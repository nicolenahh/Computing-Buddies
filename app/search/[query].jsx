import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseConfig';
import { collection, getDocs, doc, getDoc, addDoc, query, where } from 'firebase/firestore';

const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if (friends.length > 0) {
      fetchUsers();
      fetchSentRequests();
    }
  }, [friends]);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(FIRESTORE_DB, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredUsers = usersData.filter(user => !friends.includes(user.id) && user.id !== FIREBASE_AUTH.currentUser.uid);
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users. Please try again.');
    }
  };

  const fetchSentRequests = async () => {
    try {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (currentUser) {
        const q = query(
          collection(FIRESTORE_DB, 'friendRequests'),
          where('fromUserId', '==', currentUser.uid),
          where('status', '==', 'pending')
        );
        const querySnapshot = await getDocs(q);
        const requests = querySnapshot.docs.map(doc => doc.data().toUserId);
        setSentRequests(requests);
      }
    } catch (error) {
      console.error('Error fetching sent friend requests:', error);
    }
  };

  const fetchFriends = async () => {
    try {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const friendsList = userDoc.data().friends || [];
          setFriends(friendsList);
        }
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const handleSearch = async () => {
    try {
      const usersRef = collection(FIRESTORE_DB, 'users');
      const snapshot = await getDocs(usersRef);

      // Filter users based on searchQuery and remove friends
      const filteredUsers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
          user.id !== FIREBASE_AUTH.currentUser.uid &&
          !friends.includes(user.id)
        );

      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users. Please try again.');
    }
  };

  const sendFriendRequest = async (toUserId) => {
    try {
      const currentUserId = FIREBASE_AUTH.currentUser.uid;
      const currentUsername = FIREBASE_AUTH.currentUser.displayName; // Assuming displayName is set during sign-up

      await addDoc(collection(FIRESTORE_DB, 'friendRequests'), {
        fromUserId: currentUserId,
        toUserId: toUserId,
        fromUsername: currentUsername,
        status: 'pending'
      });

      Alert.alert('Friend Request Sent', 'Your friend request has been sent.');
      fetchSentRequests(); // Update sent requests
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
    }
  };

  const navigateToProfile = (userId) => {
    router.push(`/profile/${userId}`);
  };

  const navigateToFriends = () => {
    router.push('../(tabs)/friends');
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
      <Text>{item.username}</Text>
      {sentRequests.includes(item.id) ? (
        <Text>Friend Request Sent</Text>
      ) : (
        <TouchableOpacity onPress={() => sendFriendRequest(item.id)} style={{ backgroundColor: '#62C5E6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}>
          <Text style={{ color: 'white' }}>Add Friend</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <TouchableOpacity onPress={navigateToFriends} style={{ marginBottom: 16, marginLeft: 16 }}>
        <Text className="text-blue mb-10 font-pbold">Back</Text>
      </TouchableOpacity>

      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#161622', borderRadius: 20, borderWidth: 2, borderColor: '#232533', paddingLeft: 10 }}>
          <TextInput
            style={{ flex: 1, height: 40, color: 'white' }}
            value={searchQuery}
            placeholder="Search by username"
            placeholderTextColor="#CDCDE0"
            onChangeText={text => setSearchQuery(text)}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch} style={{ paddingRight: 10 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <Text style={{ textAlign: 'center', marginTop: 10 }}>No users found</Text>
        )}
      />
    </SafeAreaView>
  );
};

export default UserSearch;
