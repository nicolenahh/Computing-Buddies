import React, { useState, useEffect } from 'react';
import { Animated } from 'react-native';
import { View, Text, ScrollView, TouchableOpacity, Modal, Button, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Feather } from '@expo/vector-icons';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { useChat } from '../chatContext';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendRequestsVisible, setFriendRequestsVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState([]);
  const searchAnimation = useState(new Animated.Value(0))[0];
  const router = useRouter();
  const { triggerRefresh } = useChat(); // Use the ChatContext

  const blueColor = '#62C5E6'; 

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  useEffect(() => {
    const sortedFriends = [...friends].sort((a, b) => {
      if ((b.studyMinutes || 0) !== (a.studyMinutes || 0)) {
        return (b.studyMinutes || 0) - (a.studyMinutes || 0);
      }
      return a.username.localeCompare(b.username);
    });
    setFilteredFriends(
      sortedFriends.filter(friend =>
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
            if (friendDoc.exists() && friendId !== currentUser.uid) { // Exclude the user himself
              friendsData.push({ id: friendDoc.id, ...friendDoc.data() });
            }
          }
          friendsData.sort((a, b) => {
            if ((b.studyMinutes || 0) !== (a.studyMinutes || 0)) {
              return (b.studyMinutes || 0) - (a.studyMinutes || 0);
            }
            return a.username.localeCompare(b.username);
          });
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

        if (!userData.friends.includes(fromUserId)) {
          await updateDoc(userDocRef, {
            friends: [...(userData.friends || []), fromUserId],
          });
        }

        if (!fromUserData.friends.includes(currentUserId)) {
          await updateDoc(fromUserDocRef, {
            friends: [...(fromUserData.friends || []), currentUserId],
          });
        }

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

      triggerRefresh(); // Trigger the refresh in ChatContext

      return chat.id;
    } catch (error) {
      console.error('Failed to get or create chat:', error);
    }
  };

  const navigateToChat = async (friendId) => {
    const chatId = await getOrCreateChat(friendId);
    router.push({ pathname: `/chats/${chatId}`, params: { friendId } });
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row justify-between items-center px-4 py-2">
        <TouchableOpacity onPress={() => setFriendRequestsVisible(true)}>
          <AntDesign name="adduser" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-blue text-2xl font-pbold">Friends</Text>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={toggleSearch}>
            <Feather name="search" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={navigateToUserSearch} className="ml-4">
            <Feather name="user-plus" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      <Animated.View className="overflow-hidden bg-white px-4 rounded-lg" style={{ height: searchHeight }}>
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
        {filteredFriends.map((item, index) => (
          <View key={item.id.toString()} className="flex-row justify-between items-center p-2 m-2 bg-white rounded-lg border-2 border-black">
            <View className="flex-row items-center">
              <Text className="text-black text-xl font-bold ml-2 mr-2">{index + 1}. </Text>
              <Image
                source={{ uri: item.profilePicture || 'default-profile-pic-url' }}
                className="w-10 h-10 rounded-full"
              />
              <Text className="text-black text-xl font-bold ml-2">{item.username}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-black text-sm mr-2">{item.studyMinutes || 0} minutes studied</Text>
              <TouchableOpacity onPress={() => navigateToChat(item.id)}>
                <AntDesign name="message1" size={24} color={blueColor} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Friend Requests Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={friendRequestsVisible}
        onRequestClose={() => setFriendRequestsVisible(!friendRequestsVisible)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="w-72 p-5 bg-blue rounded-lg">
            <Text className="text-white text-lg font-bold mb-2">Friend Requests</Text>
            {friendRequests.length > 0 ? (
              friendRequests.map((request) => (
                <View key={request.id} className="flex-row justify-between items-center mb-2">
                  <Image source={{ uri: request.profilePicture }} className="w-10 h-10 rounded-full" />
                  <Text className="text-white">{request.fromUsername}</Text>
                  <TouchableOpacity onPress={() => handleAcceptFriendRequest(request.id, request.fromUserId)}>
                    <AntDesign name="check" size={24} color="green" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeclineFriendRequest(request.id)}>
                    <AntDesign name="close" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text className="text-white">No friend requests.</Text>
            )}
            <Button title="Close" onPress={() => setFriendRequestsVisible(false)} color="white" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Friends;
