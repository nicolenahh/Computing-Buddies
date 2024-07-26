import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Button, Alert, Image, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Feather } from '@expo/vector-icons';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendRequestsVisible, setFriendRequestsVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState([]);
  const searchAnimation = useState(new Animated.Value(0))[0];
  const router = useRouter();

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  useEffect(() => {
    setFilteredFriends(
      friends.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, friends]);

  const fetchFriends = async () => {
    try {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const friendsList = userDoc.data().friends || [];
          const friendsData = [];
          for (const friendId of friendsList) {
            const friendDoc = await getDoc(doc(FIRESTORE_DB, 'users', friendId));
            if (friendDoc.exists()) {
              friendsData.push({ id: friendDoc.id, ...friendDoc.data() });
            }
          }
          setFriends(friendsData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (currentUser) {
        const friendRequestsRef = collection(FIRESTORE_DB, 'friendRequests');
        const q = query(friendRequestsRef, where('toUserId', '==', currentUser.uid), where('status', '==', 'pending'));
        const querySnapshot = await getDocs(q);
        const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const requestsWithUserDetails = await Promise.all(requests.map(async request => {
          const fromUserDoc = await getDoc(doc(FIRESTORE_DB, 'users', request.fromUserId));
          if (fromUserDoc.exists()) {
            return {
              ...request,
              fromUsername: fromUserDoc.data().username,
              profilePicture: fromUserDoc.data().profilePicture || 'default-profile-pic-url'
            };
          } else {
            return request;
          }
        }));

        setFriendRequests(requestsWithUserDetails);
      }
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
    }
  };

  const handleAcceptFriendRequest = async (requestId, fromUserId) => {
    try {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (currentUser) {
        const currentUserId = currentUser.uid;

        const userDocRef = doc(FIRESTORE_DB, 'users', currentUserId);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();

        const fromUserDocRef = doc(FIRESTORE_DB, 'users', fromUserId);
        const fromUserDoc = await getDoc(fromUserDocRef);
        const fromUserData = fromUserDoc.data();

        await updateDoc(userDocRef, {
          friends: [...(userData.friends || []), fromUserId],
        });

        await updateDoc(fromUserDocRef, {
          friends: [...(fromUserData.friends || []), currentUserId],
        });

        await updateDoc(doc(FIRESTORE_DB, 'friendRequests', requestId), {
          status: 'accepted'
        });

        fetchFriends();
        fetchFriendRequests();
      }
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleDeclineFriendRequest = async (requestId) => {
    try {
      await updateDoc(doc(FIRESTORE_DB, 'friendRequests', requestId), {
        status: 'declined'
      });
      fetchFriendRequests();
    } catch (error) {
      console.error('Failed to decline friend request:', error);
    }
  };

  const navigateToUserSearch = () => {
    router.push('../search/[query]');
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
    router.push(`/chats/${chatId}`);
  };

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    Animated.timing(searchAnimation, {
      toValue: searchVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const searchHeight = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });

  return (
    <SafeAreaView className="flex-1 bg-blue">
      <View className="flex-row justify-between items-center px-4 py-2 bg-blue">
        <TouchableOpacity onPress={() => setFriendRequestsVisible(true)}>
          <AntDesign name="adduser" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Friends</Text>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={toggleSearch}>
            <Feather name="search" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={navigateToUserSearch} className="ml-4">
            <Feather name="user-plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <Animated.View className="overflow-hidden bg-gray-700 px-4" style={{ height: searchHeight }}>
        {searchVisible && (
          <TextInput
            placeholder="Search friends"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="bg-white rounded-lg px-4 py-2 my-2"
          />
        )}
      </Animated.View>
      <ScrollView>
        {filteredFriends.map((item) => (
          <View key={item.id.toString()} className="flex-row justify-between items-center p-2 m-2 bg-white rounded-lg">
            <View className="flex-row items-center">
              <Image
                source={{ uri: item.profilePicture || 'default-profile-pic-url' }}
                className="w-10 h-10 rounded-full"
              />
              <Text className="text-black text-xl font-bold ml-2">{item.username}</Text>
            </View>
            <TouchableOpacity onPress={() => navigateToChat(item.id)}>
              <AntDesign name="message1" size={24} color="black" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      {/* Friend Requests Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={friendRequestsVisible}
        onRequestClose={() => {
          setFriendRequestsVisible(!friendRequestsVisible);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="w-72 p-5 bg-white rounded-lg">
            <Text className="text-black text-lg font-bold mb-2">Friend Requests</Text>
            {friendRequests.length > 0 ? (
              friendRequests.map((request) => (
                <View key={request.id} className="flex-row justify-between items-center mb-2">
                  <Image source={{ uri: request.profilePicture }} className="w-10 h-10 rounded-full" />
                  <Text>{request.fromUsername}</Text>
                  <TouchableOpacity onPress={() => handleAcceptFriendRequest(request.id, request.fromUserId)}>
                    <AntDesign name="check" size={24} color="green" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeclineFriendRequest(request.id)}>
                    <AntDesign name="close" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text>No friend requests.</Text>
            )}
            <Button title="Close" onPress={() => setFriendRequestsVisible(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Friends;
