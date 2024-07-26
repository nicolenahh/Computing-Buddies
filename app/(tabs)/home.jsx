import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl, Image, Modal, Button, Alert, AppState } from 'react-native';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, orderBy, updateDoc } from 'firebase/firestore';
import { AntDesign } from '@expo/vector-icons';
import EmptyState from '../../components/EmptyState';
import { useFocusEffect, useRouter } from 'expo-router';
import { useRefresh } from '../refreshContext';
import DropdownComponent from '../../components/DropdownComponent';
import { Picker } from '@react-native-picker/picker';

const defaultAvatar = 'https://www.example.com/default-avatar.png'; // URL to default avatar image

const Home = () => {
  const [username, setUsername] = useState('');
  const [posts, setPosts] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [poster, setPoster] = useState(null);
  const [posterModalVisible, setPosterModalVisible] = useState(false);
  const { refresh } = useRefresh();
  const [refreshing, setRefreshing] = useState(false);
  const [studyModalVisible, setStudyModalVisible] = useState(false);
  const [studyDuration, setStudyDuration] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [isStudying, setIsStudying] = useState(false);
  const [timer, setTimer] = useState(0);
  const [sessionQuit, setSessionQuit] = useState(false); // Track if the session was quit
  const intervalRef = useRef(null);
  const startTime = useRef(new Date().getTime()); // Record the start time
  const router = useRouter();
  const lastActiveTime = useRef(new Date().getTime());
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [appState]);

  const handleAppStateChange = (nextAppState) => {
    console.log(`App state changed from ${appState} to ${nextAppState}`);
    const now = new Date().getTime();

    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      if (sessionQuit) {
        Alert.alert('Session Ended', 'You gave up the study session.');
        setSessionQuit(false); // Reset the session quit flag
      }
      startTime.current += now - lastActiveTime.current; // Adjust the start time to account for the time spent in the background
    } else if (appState === 'active' && nextAppState === 'inactive') {
      // App is going to inactive state (screen locked)
      lastActiveTime.current = now;
    } else if (appState === 'inactive' && nextAppState === 'background') {
      // App is going to background state (switching apps)
      if (isStudying) {
        endStudySession(false);
        setSessionQuit(true); // Set the session quit flag
      }
    } else if (appState === 'active' && nextAppState === 'background') {
      // App is going to background state (switching apps directly)
      if (isStudying) {
        endStudySession(false);
        setSessionQuit(true); // Set the session quit flag
      }
    }
    setAppState(nextAppState);
  };

  const fetchPosts = async () => {
    try {
      const q = query(collection(FIRESTORE_DB, 'posts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const postsList = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
        const postData = docSnapshot.data();
        const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', postData.userId));
        return {
          id: docSnapshot.id,
          ...postData,
          username: userDoc.exists() ? userDoc.data().username : 'Unknown',
          profilePicture: userDoc.exists() ? userDoc.data().profilePicture : null
        };
      }));
      setPosts(postsList);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  const fetchPosterData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', userId));
      if (userDoc.exists()) {
        setPoster(userDoc.data());
        setPosterModalVisible(true);
      } else {
        alert('Failed to fetch poster data.');
      }
    } catch (error) {
      console.error('Failed to fetch poster data:', error);
      alert('Failed to fetch poster data: ' + error.message);
    }
  };

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const user = FIREBASE_AUTH.currentUser;
        if (user) {
          const docRef = doc(FIRESTORE_DB, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUsername(docSnap.data().username);
          }
        }
      } catch (error) {
        console.error('Failed to fetch username:', error);
      }
    };

    fetchUsername();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [refresh])
  );

  const handleSearchToggle = () => {
    setSearchVisible(!searchVisible);
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
  };

  const handleFilterToggle = () => {
    setFilterVisible(!filterVisible);
  };

  const filteredPosts = posts.filter(post =>
    ((post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.content || '').toLowerCase().includes(searchQuery.toLowerCase())) &&
    (!selectedCategory || post.category === selectedCategory)
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts().then(() => setRefreshing(false));
  }, []);

  const handleAddFriend = async (userId, username) => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser) {
      alert('You must be logged in to send a friend request.');
      return;
    }

    if (userId === currentUser.uid) {
      alert('You cannot send a friend request to yourself.');
      return;
    }

    const currentUserDoc = await getDoc(doc(FIRESTORE_DB, 'users', currentUser.uid));
    const currentUserData = currentUserDoc.data();
    const currentUserFriends = currentUserData.friends || [];

    if (currentUserFriends.includes(userId)) {
      alert('You are already friends with this user.');
      return;
    }

    Alert.alert(
      'Send Friend Request',
      `Are you sure you want to send a friend request to ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await addDoc(collection(FIRESTORE_DB, 'friendRequests'), {
                fromUserId: currentUser.uid,
                toUserId: userId,
                status: 'pending',
                createdAt: new Date(),
              });
              alert('Friend request sent successfully!');
            } catch (error) {
              console.error('Error sending friend request:', error);
              alert('Failed to send friend request: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const startStudySession = (duration) => {
    setStudyDuration(duration * 60); // Convert minutes to seconds
    setTimer(0);
    setIsStudying(true);
    setStudyModalVisible(false);
    startTime.current = new Date().getTime(); // Record the start time
  };

  useEffect(() => {
    if (isStudying) {
      intervalRef.current = setInterval(() => {
        const now = new Date().getTime();
        const elapsedTime = Math.floor((now - startTime.current) / 1000); // Calculate elapsed time in seconds
        if (elapsedTime >= studyDuration) {
          clearInterval(intervalRef.current);
          endStudySession(true);
        } else {
          setTimer(elapsedTime);
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isStudying, studyDuration]);

  const endStudySession = async (completed) => {
    setIsStudying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (completed) {
      const user = FIREBASE_AUTH.currentUser;
      if (user) {
        const userDocRef = doc(FIRESTORE_DB, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const newStudyMinutes = (userData.studyMinutes || 0) + studyDuration / 60; // Add new minutes to existing ones

        await updateDoc(userDocRef, { studyMinutes: newStudyMinutes });
        Alert.alert('Success', `You studied for ${studyDuration / 60} minutes!`);
      }
    }
  };

  return (
    <SafeAreaView className="bg-customBlue h-full">
      <View className="bg-customBlue w-full p-4 z-10">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="font-pmedium text-sm text-black">Welcome Back</Text>
            <Text className="text-2xl font-psemibold text-blue">{username}</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => setStudyModalVisible(true)} className="ml-4">
              <AntDesign name="book" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleFilterToggle} className="ml-4">
              <AntDesign name="filter" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSearchToggle} className="ml-4">
              <AntDesign name="search1" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>
        {filterVisible && (
          <DropdownComponent
            data={categoryData}
            placeholder="Filter by category"
            onChange={setSelectedCategory}
          />
        )}
        {searchVisible && (
          <TextInput
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search..."
            className="border border-gray-400 rounded-full px-4 py-2 mb-2"
            autoFocus
          />
        )}
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => fetchPosterData(item.userId)}>
                  <Image
                    source={item.profilePicture ? { uri: item.profilePicture } : { uri: defaultAvatar }}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => fetchPosterData(item.userId)}>
                  <Text className="text-gray-500">{item.username}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => handleAddFriend(item.userId, item.username)}>
                <AntDesign name="adduser" size={24} color="blue" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => router.push(`/post/${item.id}`)}>
              <Text className="text-xl font-bold">{item.title || 'No Title'}</Text>
              <Text className="text-l" numberOfLines={3}>{item.content}</Text>
              <Text className="text-gray-400">Category: {item.category}</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No posts found"
            subtitle="Be the first one to upload a post!"
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <Modal
        visible={studyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStudyModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="w-4/5 p-4 bg-white rounded-lg">
            <Text className="text-xl font-bold mb-4">Select Study Duration</Text>
            <Picker
              selectedValue={selectedDuration}
              onValueChange={(itemValue) => setSelectedDuration(itemValue)}
              style={{ height: 200, width: '100%' }}
            >
              {Array.from({ length: 24 }, (_, i) => (i + 1) * 5).map((value) => (
                <Picker.Item key={value} label={`${value} minutes`} value={value} />
              ))}
            </Picker>
            <Button title="Start Study Session" onPress={() => startStudySession(selectedDuration)} />
            <Button title="Cancel" onPress={() => setStudyModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <Modal
        visible={isStudying}
        animationType="slide"
        transparent={true}
        onRequestClose={() => endStudySession(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="w-4/5 p-4 bg-white rounded-lg">
            <Text className="text-xl font-bold mb-4">Study Session</Text>
            <Text>{`Time Elapsed: ${Math.floor(timer / 60)}m ${timer % 60}s`}</Text>
            <Button title="Give Up" onPress={() => endStudySession(false)} />
          </View>
        </View>
      </Modal>

      <Modal
        visible={posterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPosterModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="w-4/5 p-4 bg-white rounded-lg">
            {poster && (
              <>
                <Image
                  source={poster.profilePicture ? { uri: poster.profilePicture } : { uri: defaultAvatar }}
                  className="w-24 h-24 rounded-full mb-4"
                />
                <Text className="text-xl font-bold">{poster.username}</Text>
                <Text className="text-l">Course: {poster.course}</Text>
                <Text className="text-l">Year of Study: {poster.yearOfStudy}</Text>
                <Button title="Close" onPress={() => setPosterModalVisible(false)} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Home;
