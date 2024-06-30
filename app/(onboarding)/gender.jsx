import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import CustomButton from '../../components/CustomButton';
import { router } from 'expo-router';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../components/AuthProvider';

const Gender = () => {
  const [gender, setGender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleNext = async () => {
    setIsSubmitting(true);
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('User UID:', user.uid);
      console.log('Selected Gender:', gender);


      // Save the user's gender to Firestore
      await setDoc(doc(FIRESTORE_DB, 'users', user.uid), {
        gender: gender
      }, { merge: true }); // Merge to avoid overwriting existing data

      // Navigate to the next step
      router.push('/yearCourse');
    } catch (error) {
      console.log(error);
      alert('Failed to save gender: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center p-4">
      <View className="w-full h-full justify-center min-h-[80vh]">
        <Text className="text-2xl font-psemibold text-semibold mt-10 text-center">
          Next, please select your gender
        </Text>
        <View className>
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue) => setGender(itemValue)}
          >
            <Picker.Item label="Select your gender" value="" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>
        <View className="mt-10">
          <CustomButton
            title="Next"
            handlePress={handleNext}
            isLoading={isSubmitting}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default Gender;
