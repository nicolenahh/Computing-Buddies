import { getAuth, signOut } from "firebase/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Image, FlatList, TouchableOpacity, Modal, Text, Alert, TextInput, Button } from "react-native";
import React, { useState, useEffect } from 'react';
import { icons, images } from "../../constants";
import { EmptyState, InfoBox } from "../../components";
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';

const Profile = () => {
  const [username, setUsername] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [posts, setPosts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCourse, setNewCourse] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newProfilePicture, setNewProfilePicture] = useState(images.avatar); // Placeholder for profile picture update
  const [open, setOpen] = useState(false); // State to control dropdown
  const [items, setItems] = useState([
    { label: 'Year 1', value: '1' },
    { label: 'Year 2', value: '2' },
    { label: 'Year 3', value: '3' },
    { label: 'Year 4', value: '4' },
    { label: 'Year 5', value: '5' },
  ]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const currentUser = FIREBASE_AUTH.currentUser;
        if (currentUser) {
          const docRef = doc(FIRESTORE_DB, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUsername(data.username);
            setCourse(data.course);
            setYear(data.year);
          } else {
            console.error('No such document!');
          }
        } else {
          console.error('No user is signed in');
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      }
    };

    const fetchPosts = async () => {
      try {
        const currentUser = FIREBASE_AUTH.currentUser;
        if (currentUser) {
          const q = query(collection(FIRESTORE_DB, 'posts'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const postsList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPosts(postsList);
        } else {
          console.error('No user is signed in');
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }
    };

    fetchProfileData();
    fetchPosts();
  }, []);

  const navigation = useNavigation();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      navigation.navigate('sign-in'); // Navigate to sign-in page
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Failed to log out. Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const currentUser = FIREBASE_AUTH.currentUser;
      if (currentUser) {
        const docRef = doc(FIRESTORE_DB, 'users', currentUser.uid);
        await updateDoc(docRef, {
          course: newCourse || course,
          year: newYear || year,
          // Add logic to update profile picture if necessary
        });
        setCourse(newCourse || course);
        setYear(newYear || year);
        // Update profile picture state if necessary
        setModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        console.error('No user is signed in');
        Alert.alert('Error', 'No user is signed in');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full"> 
      <FlatList      
        data={posts}
        keyExtractor={(item) => item.id} // Use 'id' instead of '$id'
        renderItem={({ item }) => (
          <View className="p-4 border-b border-gray-200">
            <Text className="text-xl font-bold">{item.content}</Text>
            <Text className="text-gray-500">Posted by: {item.username}</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="You have not created any posts yet"
          />
        )}
        ListHeaderComponent={() => (
          <View className="w-full flex justify-center items-center mt-6 mb-12 px-4">
            <TouchableOpacity
              onPress={handleLogout}
              className="flex w-full items-end mb-10"
            >
              <Image
                source={icons.logout}
                resizeMode="contain"
                className="w-6 h-6"
              />
            </TouchableOpacity>

            <View className="w-16 h-16 border border-secondary rounded-lg flex justify-center items-center">
              <Image
                source={ images.avatar }
                className="w-[90%] h-[90%] rounded-lg"
                resizeMode="cover"
              />
            </View>

            <InfoBox
              title={username}
              containerStyles="mt-5"
              titleStyles="text-lg"
            />

            <View>
              <InfoBox
                title="Course: "
                subtitle={course}
                titleStyles="text-xl"
              />
              <InfoBox
                title="Year: "
                subtitle={year}
                titleStyles="text-xl"
              />
            </View>

            <View className="mt-5 flex flex-row">
              <InfoBox
                title={posts.length || 0}
                subtitle="Posts"
                titleStyles="text-xl"
                containerStyles="mr-10"
              />
              <InfoBox
                title="57"
                subtitle="Friends"
                titleStyles="text-xl"
              />
            </View>

            <TouchableOpacity onPress={() => setModalVisible(true)} className="mt-5">
              <Text style={{color: 'blue'}}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View style={{ width: 300, padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
            <Text className="text-white">Edit Profile</Text>
            <TextInput
              placeholder="New Course"
              value={newCourse}
              onChangeText={setNewCourse}
              style={{ borderBottomWidth: 1, marginBottom: 10 }}
            />
            <DropDownPicker
              open={open}
              value={newYear}
              items={[
                { label: 'Year 1', value: '1' },
                { label: 'Year 2', value: '2' },
                { label: 'Year 3', value: '3' },
                { label: 'Year 4', value: '4' },
                { label: 'Year 5', value: '5' },
              ]}
              setOpen={setOpen}
              setValue={setNewYear}
              style={{ marginBottom: 10 }}
            />
            <Button title="Save" onPress={handleSaveProfile} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
      
    </SafeAreaView>
  );
};

export default Profile;
