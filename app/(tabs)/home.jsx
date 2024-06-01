import { View, Text, FlatList, Image } from 'react-native'
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context'
import SearchInput from '../../components/SearchInput'
import Trending from '../../components/Trending'
import EmptyState from '../../components/EmptyState'
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';


const Home = () => {
  const [username, setUsername] = useState('');
  const [posts, setPosts] = useState([]);

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

    fetchUsername();
    fetchPosts();
  }, []);
  
  return (
    <SafeAreaView className="bg-customBlue h-full">
      <FlatList
        // data={[{ id: 1 }, { id: 2 }, { id: 3 }, ]}
        data={posts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <View className="p-4 border-b border-gray-200">
            <Text className="text-xl font-bold">{item.content}</Text>
            <Text className="text-gray-500">Posted by: {item.username}</Text>
          </View>
        )}
        ListHeaderComponent={() => (
          <View className="my-1 px-4 space-y-6">
            <View className="justify-between items-start flex-row mb-6">
              <View>
                <Text className="font-pmedium text-sm text-black">
                  Welcome Back
                </Text>
                <Text className="text-2xl font-psemibold text-white">
                  {username}
                </Text>
              </View>

              <View>
                

              </View>
            </View>
            <SearchInput
            />
            

            <View className="w-full flex-1 pt-5 pb-8">
              
            </View>
          </View>
        )}
      
        ListEmptyComponent={() => (
          <EmptyState 
            title="No posts found"
            subtitle="Be the first one to upload a post!"
          />
        )}

      />
    </SafeAreaView>
  )
}

export default Home