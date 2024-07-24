import { getAuth, signOut } from "firebase/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Image, FlatList, TouchableOpacity, Modal, Text, Alert, Button, RefreshControl } from "react-native";
import React, { useState, useEffect, useCallback } from 'react';
import { icons, images } from "../../constants";
import { EmptyState, InfoBox } from "../../components";
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import DropdownComponent from '../../components/DropdownComponent';
import { useAuth } from '../../components/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';

const Profile = () => {
  const [username, setUsername] = useState('');
  const [course, setCourse] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [posts, setPosts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [newProfilePicture, setNewProfilePicture] = useState(images.avatar);
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePickerModalVisible, setImagePickerModalVisible] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const yearData = [
    { label: 'Year 1', value: '1' },
    { label: 'Year 2', value: '2' },
    { label: 'Year 3', value: '3' },
    { label: 'Year 4', value: '4' }
  ];

  const courseData = [
    { label: 'Architecture', value: 'Architecture' },
    { label: 'Biomedical Engineering', value: 'Biomedical Engineering' },
    { label: 'Business Administration', value: 'Business Administration' },
    { label: 'Business Administration (Accountancy)', value: 'Business Administration (Accountancy)' },
    { label: 'Business Analytics', value: 'Business Analytics' },
    { label: 'Chemical Engineering', value: 'Chemical Engineering' },
    { label: 'Chinese Language', value: 'Chinese Language' },
    { label: 'Chinese Studies', value: 'Chinese Studies' },
    { label: 'Civil Engineering', value: 'Civil Engineering' },
    { label: 'Computer Engineering', value: 'Computer Engineering' },
    { label: 'Computer Science', value: 'Computer Science' },
    { label: 'Data Science and Economics', value: 'Data Science and Economics' },
    { label: 'Dentistry', value: 'Dentistry' },
    { label: 'Electrical Engineering', value: 'Electrical Engineering' },
    { label: 'Engineering and Medicine', value: 'Engineering and Medicine' },
    { label: 'Engineering Science', value: 'Engineering Science' },
    { label: 'English Language and Linguistics', value: 'English Language and Linguistics' },
    { label: 'English Literature', value: 'English Literature' },
    { label: 'Environmental Engineering', value: 'Environmental Engineering' },
    { label: 'Environmental Studies', value: 'Environmental Studies' },
    { label: 'Food Science and Technology', value: 'Food Science and Technology' },
    { label: 'Global Studies', value: 'Global Studies' },
    { label: 'History', value: 'History' },
    { label: 'Industrial Design', value: 'Industrial Design' },
    { label: 'Industrial and Systems Engineering', value: 'Industrial and Systems Engineering' },
    { label: 'Information Security', value: 'Information Security' },
    { label: 'Information Systems', value: 'Information Systems' },
    { label: 'Infrastructure and Project Management', value: 'Infrastructure and Project Management' },
    { label: 'Japanese Studies', value: 'Japanese Studies' },
    { label: 'Landscape Architecture', value: 'Landscape Architecture' },
    { label: 'Law', value: 'Law' },
    { label: 'Malay Studies', value: 'Malay Studies' },
    { label: 'Materials Science and Engineering', value: 'Materials Science and Engineering' },
    { label: 'Mechanical Engineering', value: 'Mechanical Engineering' },
    { label: 'Medicine', value: 'Medicine' },
    { label: 'Music', value: 'Music' },
    { label: 'Nursing', value: 'Nursing' },
    { label: 'Pharmaceutical Science', value: 'Pharmaceutical Science' },
    { label: 'Pharmacy', value: 'Pharmacy' },
    { label: 'Philosophy', value: 'Philosophy' },
    { label: 'Philosophy, Politics and Economics', value: 'Philosophy, Politics and Economics' },
    { label: 'Real Estate', value: 'Real Estate' },
    { label: 'South Asian Studies', value: 'South Asian Studies' },
    { label: 'Southeast Asian Studies', value: 'Southeast Asian Studies' },
    { label: 'Special Programme in Science', value: 'Special Programme in Science' },
    { label: 'Theatre and Performance Studies', value: 'Theatre and Performance Studies' },
  ];

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
          setYearOfStudy(data.yearOfStudy);
          if (data.profilePicture) {
            setNewProfilePicture({ uri: data.profilePicture });
          }
          setFriendsCount(data.friends ? data.friends.length : 0);
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

  useEffect(() => {
    fetchProfileData();
    fetchPosts();
  }, []);

  const navigation = useNavigation();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      navigation.navigate('sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Failed to log out. Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    setIsSubmitting(true);
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const updatedData = {};
      if (editingField === 'course') {
        updatedData.course = course;
      } else if (editingField === 'yearOfStudy') {
        updatedData.yearOfStudy = yearOfStudy;
      }

      await setDoc(doc(FIRESTORE_DB, 'users', user.uid), updatedData, { merge: true });
      setModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.log(error);
      alert('Failed to save data: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setNewProfilePicture({ uri: result.assets[0].uri });
      await saveProfilePicture(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setNewProfilePicture({ uri: result.assets[0].uri });
      await saveProfilePicture(result.assets[0].uri);
    }
  };

  const saveProfilePicture = async (uri) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      await setDoc(doc(FIRESTORE_DB, 'users', user.uid), { profilePicture: uri }, { merge: true });
      setImagePickerModalVisible(false);
    } catch (error) {
      console.error('Failed to save profile picture:', error);
      alert('Failed to save profile picture: ' + error.message);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchProfileData(), fetchPosts()]).then(() => setRefreshing(false));
  }, []);

  return (
    <SafeAreaView className="bg-white h-full">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="p-4 border-b border-gray-200">
            <Text className="text-2xl font-bold">{item.title}</Text>
            <Text className="text-l">{item.content}</Text>
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
                source={newProfilePicture}
                className="w-[90%] h-[90%] rounded-lg"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => setImagePickerModalVisible(true)}
                className="absolute bottom-0 right-0 bg-blue-500 p-1 rounded-full"
              >
                <Image source={icons.plus} className="w-4 h-4" />
              </TouchableOpacity>
            </View>

            <InfoBox
              title={username}
              containerStyles="mt-5"
              titleStyles="text-lg"
            />

            <View className="flex flex-row items-center">
              <InfoBox
                title="Course: "
                subtitle={course}
                titleStyles="text-xl"
              />
              <TouchableOpacity onPress={() => {
                setEditingField('course');
                setModalVisible(true);
              }}>
                <Image source={icons.pen} className="w-4 h-4 ml-2" />
              </TouchableOpacity>
            </View>

            <View className="flex flex-row items-center mt-2">
              <InfoBox
                title="Year of Study: "
                subtitle={yearOfStudy}
                titleStyles="text-xl"
              />
              <TouchableOpacity onPress={() => {
                setEditingField('yearOfStudy');
                setModalVisible(true);
              }}>
                <Image source={icons.pen} className="w-4 h-4 ml-2" />
              </TouchableOpacity>
            </View>

            <View className="mt-5 flex flex-row">
              <InfoBox
                title={posts.length || 0}
                subtitle="Posts"
                titleStyles="text-xl"
                containerStyles="mr-10"
              />
              <InfoBox
                title={friendsCount}
                subtitle="Friends"
                titleStyles="text-xl"
              />
            </View>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <BlurView intensity={100} style={{ flex: 1 }}>
          <View className="flex-1 justify-center items-center">
            <View style={{ width: 300, padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
              <Text className="text-black">Edit Profile</Text>
              {editingField === 'course' && (
                <DropdownComponent
                  data={courseData}
                  placeholder="Select Course"
                  onChange={setCourse}
                />
              )}
              {editingField === 'yearOfStudy' && (
                <DropdownComponent
                  data={yearData}
                  placeholder="Select Year"
                  onChange={setYearOfStudy}
                />
              )}
              <Button title="Save" onPress={handleSaveProfile} disabled={isSubmitting} />
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={imagePickerModalVisible}
        onRequestClose={() => {
          setImagePickerModalVisible(false);
        }}
      >
        <BlurView intensity={100} style={{ flex: 1 }}>
          <View className="flex-1 justify-center items-center">
            <View style={{ width: 300, padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
              <Text className="text-black">Change Profile Picture</Text>
              <Button title="Take Photo" onPress={takePhoto} />
              <Button title="Choose from Photos" onPress={pickImage} />
              <Button title="Cancel" onPress={() => setImagePickerModalVisible(false)} />
            </View>
          </View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;
