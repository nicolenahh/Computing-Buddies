Profile
import { getAuth, signOut } from "firebase/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Image, FlatList, TouchableOpacity, Modal, Text, Alert, Button } from "react-native";
import React, { useState, useEffect } from 'react';
import { icons, images } from "../../constants";
import { EmptyState, InfoBox } from "../../components";
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import DropdownComponent from '../../components/DropdownComponent'; // Import the DropdownComponent
import { useAuth } from '../../components/AuthProvider';

const Profile = () => {
  const [username, setUsername] = useState('');
  const [course, setCourse] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [posts, setPosts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newProfilePicture, setNewProfilePicture] = useState(images.avatar); // Placeholder for profile picture update
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            setYearOfStudy(data.yearOfStudy); // Fetch yearOfStudy from the database
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
    setIsSubmitting(true);
        try {
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Save the user's year of study and course to Firestore
            await setDoc(doc(FIRESTORE_DB, 'users', user.uid), {
                yearOfStudy: yearOfStudy,
                course: course
            }, { merge: true }); // Merge to avoid overwriting existing data
             // Update profile picture state if necessary
        setModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.log(error);
            alert('Failed to save data: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
  };

  return (
    <SafeAreaView className="bg-white h-full"> 
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
                title="Year of Study: " // Updated to Year of Study
                subtitle={yearOfStudy} // Updated to use yearOfStudy
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
            <Text className="text-black">Edit Profile</Text>
            <DropdownComponent
              data={courseData}
              placeholder="Select Course"
              onChange={setCourse}
            />
            <DropdownComponent
              data={yearData}
              placeholder="Select Year"
              onChange={setYearOfStudy}
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

