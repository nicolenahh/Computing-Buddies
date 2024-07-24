import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { AntDesign } from '@expo/vector-icons';
import EmptyState from '../../components/EmptyState';
import { useFocusEffect } from '@react-navigation/native';
import { useRefresh } from '../refreshContext';

const Home = () => {
  const [username, setUsername] = useState('');
  const [posts, setPosts] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { refresh } = useRefresh();
  const [refreshing, setRefreshing] = useState(false);

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

  const filteredPosts = posts.filter(post =>
    (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts().then(() => setRefreshing(false));
  }, []);

  return (
    <SafeAreaView className="bg-customBlue h-full">
      <View className="bg-customBlue w-full p-4 z-10">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="font-pmedium text-sm text-black">Welcome Back</Text>
            <Text className="text-2xl font-psemibold text-blue">{username}</Text>
          </View>
          <TouchableOpacity onPress={handleSearchToggle} className="ml-4">
            <AntDesign name="search1" size={24} color="black" />
          </TouchableOpacity>
        </View>
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
            <Text className="text-xl font-bold">{item.title || 'No Title'}</Text>
            <Text className="text-l">{item.content}</Text>
            <Text className="text-gray-500">Posted by: {item.username}</Text>
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
    </SafeAreaView>
  );
};

export default Home;
