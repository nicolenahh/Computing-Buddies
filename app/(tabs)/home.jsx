import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl, Modal, Button, Alert, Image } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, orderBy, addDoc, where } from 'firebase/firestore';
import { AntDesign } from '@expo/vector-icons';
import EmptyState from '../../components/EmptyState';
import { useFocusEffect } from '@react-navigation/native';
import { useRefresh } from '../refreshContext';
import DropdownComponent from '../../components/DropdownComponent';

const defaultAvatar = 'https://www.example.com/default-avatar.png'; // URL to default avatar image

const Home = () => {
  const [username, setUsername] = useState('');
  const [posts, setPosts] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [poster, setPoster] = useState(null);
  const [posterModalVisible, setPosterModalVisible] = useState(false);
  const { refresh } = useRefresh();
  const [refreshing, setRefreshing] = useState(false);

  const categoryData = [
    { label: 'All', value: null },
    { label: 'Study Buddies', value: 'Study Buddies' },
    { label: 'Roommates', value: 'Roommates' },
    { label: 'Social friends', value: 'Social friends' },
    { label: 'Classmates', value: 'Classmates' },
    { label: 'Others', value: 'Others' }
  ];

  const fetchPosts = async () => {
    try {
      const q = query(collection(FIRESTORE_DB, 'posts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const postsList = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
        const postData = docSnapshot.data();
        const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', postData.userId));
        return {
          id: docSnapshot.id,
          ...postData,
          username: userDoc.exists() ? userDoc.data().username : 'Unknown',
          profilePicture: userDoc.exists() ? userDoc.data().profilePicture : null
        };
      }));
      setPosts(postsList);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const q = query(
        collection(FIRESTORE_DB, 'comments'),
        where('postId', '==', postId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const commentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(commentsList);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      alert('Failed to fetch comments: ' + error.message);
    }
  };

  const fetchPosterData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', userId));
      if (userDoc.exists()) {
        setPoster({ id: userId, ...userDoc.data() });
        setPosterModalVisible(true);
      } else {
        alert('Failed to fetch poster data.');
      }
    } catch (error) {
      console.error('Failed to fetch poster data:', error);
      alert('Failed to fetch poster data: ' + error.message);
    }
  };

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const user = FIREBASE_AUTH.currentUser;
        if (user) {
          const docRef = doc(FIRESTORE_DB, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUsername(docSnap.data().username);
          }
        }
      } catch (error) {
        console.error('Failed to fetch username:', error);
      }
    };

    fetchUsername();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [refresh])
  );

  const handleSearchToggle = () => {
    setSearchVisible(!searchVisible);
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
  };

  const handleFilterToggle = () => {
    setFilterVisible(!filterVisible);
  };

  const filteredPosts = posts.filter(post =>
    ((post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.content || '').toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!selectedCategory || post.category === selectedCategory)
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts().then(() => setRefreshing(false));
  }, []);

  const handlePostClick = async (post) => {
    setSelectedPost(post);
    await fetchComments(post.id);
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) {
      alert('Comment cannot be empty.');
      return;
    }
    try {
      await addDoc(collection(FIRESTORE_DB, 'comments'), {
        postId: selectedPost.id,
        content: comment,
        userId: FIREBASE_AUTH.currentUser.uid,
        username: username,
        createdAt: new Date(),
      });
      alert('Comment added successfully!');
      setComment('');
      await fetchComments(selectedPost.id); // Refresh comments
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment: ' + error.message);
    }
  };

  const handleAddFriend = async (userId, username) => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser) {
      alert('You must be logged in to send a friend request.');
      return;
    }

    if (userId === currentUser.uid) {
      alert('You cannot send a friend request to yourself.');
      return;
    }

    const currentUserDoc = await getDoc(doc(FIRESTORE_DB, 'users', currentUser.uid));
    const currentUserData = currentUserDoc.data();
    const currentUserFriends = currentUserData.friends || [];

    if (currentUserFriends.includes(userId)) {
      alert('You are already friends with this user.');
      return;
    }

    Alert.alert(
      'Send Friend Request',
      `Are you sure you want to send a friend request to ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await addDoc(collection(FIRESTORE_DB, 'friendRequests'), {
                fromUserId: currentUser.uid,
                toUserId: userId,
                status: 'pending',
                createdAt: new Date(),
              });
              alert('Friend request sent successfully!');
            } catch (error) {
              console.error('Error sending friend request:', error);
              alert('Failed to send friend request: ' + error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="bg-customBlue h-full">
      <View className="bg-customBlue w-full p-4 z-10">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="font-pmedium text-sm text-black">Welcome Back</Text>
            <Text className="text-2xl font-psemibold text-blue">{username}</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleFilterToggle} className="ml-4">
              <AntDesign name="filter" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSearchToggle} className="ml-4">
              <AntDesign name="search1" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>
        {filterVisible && (
          <DropdownComponent
            data={categoryData}
            placeholder="Filter by category"
            onChange={setSelectedCategory}
          />
        )}
        {searchVisible && (
          <TextInput
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search..."
            className="border border-gray-400 rounded-full px-4 py-2 mb-2"
            autoFocus
          />
        )}
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => fetchPosterData(item.userId)}>
                  <Image
                    source={item.profilePicture ? { uri: item.profilePicture } : { uri: defaultAvatar }}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => fetchPosterData(item.userId)}>
                  <Text className="text-gray-500">{item.username}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => handleAddFriend(item.userId, item.username)}>
                <AntDesign name="adduser" size={24} color="blue" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => handlePostClick(item)}>
              <Text className="text-xl font-bold">{item.title || 'No Title'}</Text>
              <Text className="text-l" numberOfLines={3}>{item.content}</Text>
              <Text className="text-gray-400">Category: {item.category}</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No posts found"
            subtitle="Be the first one to upload a post!"
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <Modal
        visible={!!selectedPost}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedPost(null)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="w-4/5 p-4 bg-white rounded-lg">
            {selectedPost && (
              <>
                <View className="flex-row items-center mb-2">
                  <TouchableOpacity onPress={() => fetchPosterData(selectedPost.userId)}>
                    <Image
                      source={selectedPost.profilePicture ? { uri: selectedPost.profilePicture } : { uri: defaultAvatar }}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => fetchPosterData(selectedPost.userId)}>
                    <Text className="text-gray-500">{selectedPost.username}</Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-xl font-bold">{selectedPost.title || 'No Title'}</Text>
                <Text className="text-l">{selectedPost.content}</Text>
                <Text className="text-gray-400">Category: {selectedPost.category}</Text>
                <FlatList
                  data={comments}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View className="p-2 border-b border-gray-200">
                      <Text className="text-gray-800">{item.username}</Text>
                      <Text>{item.content}</Text>
                      <Text className="text-gray-500 text-sm">{new Date(item.createdAt.toDate()).toLocaleString()}</Text>
                    </View>
                  )}
                />
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Add a comment..."
                  className="border border-gray-400 rounded-full px-4 py-2 my-2"
                />
                <Button title="Submit Comment" onPress={handleCommentSubmit} />
                <Button title="Close" onPress={() => setSelectedPost(null)} />
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={posterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPosterModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="w-4/5 p-4 bg-white rounded-lg">
            {poster && (
              <>
                <Image
                  source={poster.profilePicture ? { uri: poster.profilePicture } : { uri: defaultAvatar }}
                  className="w-24 h-24 rounded-full mb-4"
                />
                <Text className="text-xl font-bold">{poster.username}</Text>
                <Text className="text-l">Course: {poster.course}</Text>
                <Text className="text-l">Year of Study: {poster.yearOfStudy}</Text>
                <TouchableOpacity onPress={() => handleAddFriend(poster.id, poster.username)} className="absolute top-4 right-4">
                  <AntDesign name="adduser" size={24} color="blue" />
                </TouchableOpacity>
                <Button title="Close" onPress={() => setPosterModalVisible(false)} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Home;
