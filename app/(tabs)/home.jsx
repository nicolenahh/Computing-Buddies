import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl, Image, Modal, Button } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { AntDesign } from '@expo/vector-icons';
import EmptyState from '../../components/EmptyState';
import { useFocusEffect, useRouter } from 'expo-router';
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
  const [poster, setPoster] = useState(null);
  const [posterModalVisible, setPosterModalVisible] = useState(false);
  const { refresh } = useRefresh();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

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

  const fetchPosterData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', userId));
      if (userDoc.exists()) {
        setPoster(userDoc.data());
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
            <TouchableOpacity onPress={() => router.push(`/post/${item.id}`)}>
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
