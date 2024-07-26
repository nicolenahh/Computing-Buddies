import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

const defaultAvatar = 'https://www.example.com/default-avatar.png';

const Message = () => {
  const [chats, setChats] = useState([]);
  const [friendDetails, setFriendDetails] = useState({});
  const router = useRouter();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const user = FIREBASE_AUTH.currentUser;
        if (user) {
          const q = query(
            collection(FIRESTORE_DB, 'chats'),
            where('participants', 'array-contains', user.uid)
          );
          const querySnapshot = await getDocs(q);
          const chatsList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setChats(chatsList);

          // Fetch usernames and profile pictures for each friend
          const details = {};
          for (const chat of chatsList) {
            const friendId = chat.participants.find(p => p !== user.uid);
            const friendDoc = await getDoc(doc(FIRESTORE_DB, 'users', friendId));
            if (friendDoc.exists()) {
              details[friendId] = {
                username: friendDoc.data().username,
                profilePicture: friendDoc.data().profilePicture || defaultAvatar,
              };
            }
          }
          setFriendDetails(details);
        }
      } catch (error) {
        console.error('Failed to fetch chats:', error);
      }
    };

    fetchChats();
  }, []);

  const renderItem = ({ item }) => {
    const friendId = item.participants.find(p => p !== FIREBASE_AUTH.currentUser.uid);
    const friendDetail = friendDetails[friendId] || { username: 'Unknown User', profilePicture: defaultAvatar };

    return (
      <TouchableOpacity
        onPress={() => router.push(`/chats/${item.id}`)}
        className="flex-row items-center p-4 border-b border-gray-100 bg-blue"
      >
        <Image
          source={{ uri: friendDetail.profilePicture }}
          className="w-12 h-12 rounded-full mr-4"
        />
        <Text className="text-lg font-pmedium text-white">{friendDetail.username}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-blue">
      <View className="bg-blue p-4">
        <Text className="text-2xl font-pbold text-white text-center">Chats</Text>
      </View>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text className="text-center mt-20 text-gray-100">No chats available</Text>}
      />
    </SafeAreaView>
  );
};

export default Message;
