import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

const Message = () => {
  const [chats, setChats] = useState([]);
  const [friendUsernames, setFriendUsernames] = useState({});
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

          // Fetch usernames for each friend
          const usernames = {};
          for (const chat of chatsList) {
            const friendId = chat.participants.find(p => p !== user.uid);
            const friendDoc = await getDoc(doc(FIRESTORE_DB, 'users', friendId));
            if (friendDoc.exists()) {
              usernames[friendId] = friendDoc.data().username;
            }
          }
          setFriendUsernames(usernames);
        }
      } catch (error) {
        console.error('Failed to fetch chats:', error);
      }
    };

    fetchChats();
  }, []);

  const renderItem = ({ item }) => {
    const friendId = item.participants.find(p => p !== FIREBASE_AUTH.currentUser.uid);
    const friendUsername = friendUsernames[friendId] || 'Unknown User';

    return (
      <TouchableOpacity
        onPress={() => router.push(`/chats/${item.id}`)}
        style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' }}
      >
        <Text>Chat with {friendUsername}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No chats available</Text>}
      />
    </SafeAreaView>
  );
};

export default Message;
