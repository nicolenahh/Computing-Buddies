import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { collection, addDoc, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

const defaultAvatar = 'https://www.example.com/default-avatar.png';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chatExists, setChatExists] = useState(true); // New state to track if chat exists
  const { chatId, friendId } = useLocalSearchParams(); // Get chatId and friendId from search params
  const router = useRouter();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const user = FIREBASE_AUTH.currentUser;
        if (user) {
          setCurrentUserId(user.uid);
          const chatDocRef = doc(FIRESTORE_DB, 'chats', chatId);
          const chatDoc = await getDoc(chatDocRef);
          if (chatDoc.exists()) {
            const messagesRef = collection(FIRESTORE_DB, 'chats', chatId, 'messages');
            const q = query(messagesRef, orderBy('createdAt', 'asc'));
            const querySnapshot = await getDocs(q);
            const messagesList = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));
            setMessages(messagesList);
          } else {
            setChatExists(false); // Chat does not exist
          }
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
  }, [chatId]);

  const handleSendMessage = async () => {
    if (messageText.trim() === '') return;

    try {
      const user = FIREBASE_AUTH.currentUser;
      if (user) {
        let chatDocId = chatId;

        // If chat does not exist, create a new chat document
        if (!chatExists && friendId) {
          const chatDoc = await addDoc(collection(FIRESTORE_DB, 'chats'), {
            participants: [user.uid, friendId], // Use friendId from params
            createdAt: new Date(),
          });
          chatDocId = chatDoc.id;
          setChatExists(true);
        }

        await addDoc(collection(FIRESTORE_DB, 'chats', chatDocId, 'messages'), {
          text: messageText,
          senderId: user.uid,
          createdAt: new Date(),
        });
        setMessageText('');

        // Fetch messages again to update the list
        const messagesRef = collection(FIRESTORE_DB, 'chats', chatDocId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        const messagesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(messagesList);
      } else {
        console.error('Failed to send message: User is not authenticated');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const renderItem = ({ item }) => (
    <View
      style={{
        padding: 10,
        margin: 10,
        borderRadius: 10,
        backgroundColor: item.senderId === currentUserId ? '#62C5E6' : '#f2f2f2',
        alignSelf: item.senderId === currentUserId ? 'flex-end' : 'flex-start'
      }}
    >
      <Text>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
          <AntDesign name="arrowleft" size={24} color="black" />
        </TouchableOpacity>
        <Text className="font-pbold" style={{ fontSize: 20 }}>Chat</Text>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10 }}
      />
      <KeyboardAvoidingView behavior="padding" style={{ flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#e0e0e0' }}>
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          style={{ flex: 1, borderColor: '#e0e0e0', borderWidth: 1, borderRadius: 25, padding: 10 }}
        />
        <TouchableOpacity onPress={handleSendMessage} style={{ marginLeft: 10, justifyContent: 'center' }}>
          <Text style={{ color: '#007bff' }}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chat;
