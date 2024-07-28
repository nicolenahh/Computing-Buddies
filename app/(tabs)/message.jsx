import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Modal, TextInput, Button, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { AntDesign, Feather } from '@expo/vector-icons';
import { getDocs } from 'firebase/firestore';

const defaultAvatar = 'https://www.example.com/default-avatar.png';

const Message = () => {
  const [chats, setChats] = useState([]);
  const [friendDetails, setFriendDetails] = useState({});
  const [friends, setFriends] = useState([]);
  const [friendsModalVisible, setFriendsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = FIREBASE_AUTH.currentUser;
    if (user) {
      const q = query(
        collection(FIRESTORE_DB, 'chats'),
        where('participants', 'array-contains', user.uid)
      );
      
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
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
      });

      fetchFriends(user.uid);

      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    const filtered = friends.filter(friend =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFriends(filtered);
  }, [searchQuery, friends]);

  const fetchFriends = async (userId) => {
    try {
      const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', userId));
      if (userDoc.exists()) {
        const friendsList = userDoc.data().friends || [];
        const friendsData = [];
        for (const friendId of friendsList) {
          const friendDoc = await getDoc(doc(FIRESTORE_DB, 'users', friendId));
          if (friendDoc.exists() && friendId !== userId) { // Exclude the user himself
            friendsData.push({ id: friendDoc.id, ...friendDoc.data() });
          }
        }
        setFriends(friendsData);
        setFilteredFriends(friendsData);
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const getOrCreateChat = async (friendId) => {
    try {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const chatsRef = collection(FIRESTORE_DB, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);

      let chat = null;
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.participants.includes(friendId)) {
          chat = { id: doc.id, ...data };
        }
      });

      if (!chat) {
        const chatDoc = await addDoc(chatsRef, {
          participants: [currentUser.uid, friendId],
          createdAt: new Date(),
        });
        chat = { id: chatDoc.id, participants: [currentUser.uid, friendId], createdAt: new Date() };
      }

      return chat.id;
    } catch (error) {
      console.error('Failed to get or create chat:', error);
    }
  };

  const navigateToChat = async (friendId) => {
    const chatId = await getOrCreateChat(friendId);
    setFriendsModalVisible(false);
    router.push(`/chats/${chatId}`);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const user = FIREBASE_AUTH.currentUser;
    if (user) {
      fetchFriends(user.uid).finally(() => setRefreshing(false));
    }
  }, []);

  const renderItem = ({ item, index }) => {
    const friendId = item.participants.find(p => p !== FIREBASE_AUTH.currentUser.uid);
    const friendDetail = friendDetails[friendId] || { username: 'Unknown User', profilePicture: defaultAvatar };

    return (
      <TouchableOpacity
        onPress={() => router.push(`/chats/${item.id}`)}
        className="flex-row items-center p-4 border-b border-gray-100 bg-white"
      >
        <Text className="text-lg font-pmedium text-black">{index + 1}. </Text>
        <Image
          source={{ uri: friendDetail.profilePicture }}
          className="w-12 h-12 rounded-full mr-4"
        />
        <Text className="text-lg font-pmedium text-black">{friendDetail.username}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-white p-4 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => setFriendsModalVisible(true)}>
          <Feather name="search" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-2xl font-pbold text-blue">Chats</Text>
        <TouchableOpacity onPress={() => setFriendsModalVisible(true)}>
          <AntDesign name="pluscircleo" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={<Text className="text-center mt-20 text-gray-100">No chats available</Text>}
      />

      {/* Friends Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={friendsModalVisible}
        onRequestClose={() => setFriendsModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="w-80 p-5 bg-white rounded-lg">
            <Text className="text-lg font-pbold text-black mb-4">Select a Friend</Text>
            <TextInput
              placeholder="Search friends"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="bg-gray-100 rounded-lg px-4 py-2 mb-4"
            />
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => navigateToChat(item.id)}
                  className="flex-row items-center p-2 border-b border-gray-100"
                >
                  <Image
                    source={{ uri: item.profilePicture || defaultAvatar }}
                    className="w-10 h-10 rounded-full mr-4"
                  />
                  <Text className="text-lg font-pmedium text-black">{item.username}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text className="text-center text-gray-500">No friends available</Text>}
            />
            <Button title="Close" onPress={() => setFriendsModalVisible(false)} color="black" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Message;
