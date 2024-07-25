import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl, Modal, Button, Alert } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, orderBy, addDoc } from 'firebase/firestore';
import { AntDesign } from '@expo/vector-icons';
import EmptyState from '../../components/EmptyState';
import { useFocusEffect } from '@react-navigation/native';
import { useRefresh } from '../refreshContext';
import DropdownComponent from '../../components/DropdownComponent';

const Home = () => {
  const [username, setUsername] = useState('');
  const [posts, setPosts] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comment, setComment] = useState('');
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
      const postsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsList);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
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

  const handlePostClick = (post) => {
    setSelectedPost(post);
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
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment: ' + error.message);
    }
  };

  const handleAddFriend = async (post) => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser) {
      alert('You must be logged in to send a friend request.');
      return;
    }

    if (post.userId === currentUser.uid) {
      alert('You cannot send a friend request to yourself.');
      return;
    }

    const currentUserDoc = await getDoc(doc(FIRESTORE_DB, 'users', currentUser.uid));
    const currentUserData = currentUserDoc.data();
    const currentUserFriends = currentUserData.friends || [];

    if (currentUserFriends.includes(post.userId)) {
      alert('You are already friends with this user.');
      return;
    }

    Alert.alert(
      'Send Friend Request',
      `Are you sure you want to send a friend request to ${post.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await addDoc(collection(FIRESTORE_DB, 'friendRequests'), {
                fromUserId: currentUser.uid,
                toUserId: post.userId,
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
            <TouchableOpacity onPress={() => handlePostClick(item)}>
              <Text className="text-xl font-bold">{item.title || 'No Title'}</Text>
              <Text className="text-l" numberOfLines={3}>{item.content}</Text>
              <Text className="text-gray-500">Posted by: {item.username}</Text>
              <Text className="text-gray-400">Category: {item.category}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleAddFriend(item)} className="absolute bottom-4 right-4">
              <AntDesign name="adduser" size={24} color="blue" />
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
                <Text className="text-xl font-bold">{selectedPost.title || 'No Title'}</Text>
                <Text className="text-l">{selectedPost.content}</Text>
                <Text className="text-gray-500">Posted by: {selectedPost.username}</Text>
                <Text className="text-gray-400">Category: {selectedPost.category}</Text>
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
    </SafeAreaView>
  );
};

export default Home;
