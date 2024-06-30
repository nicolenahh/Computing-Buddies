import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, Button, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Feather } from '@expo/vector-icons';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native'; // Ensure this is imported
import { router } from 'expo-router';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendRequestsVisible, setFriendRequestsVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation(); // Ensure navigation is initialized

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

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
              profilePicture: fromUserDoc.data().profilePicture || 'default-profile-pic-url' // Provide a default profile pic URL
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
    router.push('../search/[query]'); // Ensure this matches your actual route name
  };

  const navigateToChat = (friendId) => {
    // Implement your navigation to the chat screen here
    // For example:
    router.push(`/chat/${friendId}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'gray' }}>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, margin: 10, backgroundColor: 'white', borderRadius: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'black' }}>{item.username}</Text>
            <TouchableOpacity onPress={() => navigateToChat(item.id)}>
              <AntDesign name="message1" size={24} color="black" />
            </TouchableOpacity>
          </View>
        )}
        ListHeaderComponent={() => (
          <View style={{ marginTop: 10, paddingHorizontal: 16, marginBottom: 30 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setFriendRequestsVisible(true)}>
                <AntDesign name="adduser" size={24} color="white" />
              </TouchableOpacity>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>
                Friends
              </Text>
              <TouchableOpacity onPress={navigateToUserSearch}>
                <Feather name="user-plus" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View>
            <Text>No friends found. Add friends to see them here!</Text>
          </View>
        )}
      />

      {/* Friend Requests Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={friendRequestsVisible}
        onRequestClose={() => {
          setFriendRequestsVisible(!friendRequestsVisible);
        }}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ width: 300, padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Friend Requests</Text>
            {friendRequests.length > 0 ? (
              friendRequests.map((request) => (
                <View key={request.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Image source={{ uri: request.profilePicture }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} />
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

