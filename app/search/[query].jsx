import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseConfig';
import { collection, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';

const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(FIRESTORE_DB, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSearchResults(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users. Please try again.');
    }
  };

  const handleSearch = async () => {
    try {
      const usersRef = collection(FIRESTORE_DB, 'users');
      const snapshot = await getDocs(usersRef);
  
      // Filter users based on searchQuery
      const filteredUsers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase())
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
      <TouchableOpacity onPress={() => sendFriendRequest(item.id)} style={{ backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}>
        <Text style={{ color: 'white' }}>Add Friend</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <TouchableOpacity onPress={navigateToFriends} style={{ marginBottom: 16, marginLeft: 16 }}>
        <Text style={{ color: 'blue', marginBottom: 10 }}>Back</Text>
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

