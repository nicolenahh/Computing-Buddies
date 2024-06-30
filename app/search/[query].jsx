import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../../firebaseConfig';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

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

  const addFriend = async (userId) => {
    try {
      // Replace 'currentUserId' with the actual user ID of the logged-in user
      const currentUserId = FIREBASE_AUTH.currentUser.uid; 
      const currentUserRef = doc(FIRESTORE_DB, 'users', currentUserId);

      // Fetch current user's data
      const currentUserSnap = await getDoc(currentUserRef);

      // Check if document exists
      if (!currentUserSnap.exists()) {
        console.error('Current user document does not exist');
        Alert.alert('Error', 'User data not found. Please try again.');
        return;
      }

      const currentUserData = currentUserSnap.data();

      // Check if userId is already in friends list
      if (currentUserData.friends && currentUserData.friends.includes(userId)) {
        Alert.alert('Already Friends', 'This user is already in your friends list.');
        return;
      }

      // Update the friends array in current user's document
      await updateDoc(currentUserRef, {
        friends: [...(currentUserData.friends || []), userId]
      });

      Alert.alert('Friend Added', 'Friend successfully added!');
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'Failed to add friend. Please try again.');
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
      <TouchableOpacity onPress={() => addFriend(item.id)} style={{ backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}>
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
