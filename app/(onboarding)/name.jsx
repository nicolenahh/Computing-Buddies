// screens/Name.js
import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { router } from 'expo-router';
import { FIRESTORE_DB } from '../../firebaseConfig';
import { useAuth } from '../../components/AuthProvider';
import { doc, setDoc } from 'firebase/firestore';

const Name = () => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const inputName = async () => {
    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Save user's name
      await setDoc(doc(FIRESTORE_DB, 'users', user.uid), {
        name: name
      }, { merge: true });

      router.push('/gender');
    } catch (error) {
      console.log(error);
      Alert.alert('Failed to save name', error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="h-full">
      <ScrollView>
        <View className="w-full h-full justify-center min-h-[80vh] px-4">
          <Text className="text-2xl font-psemibold text-semibold mt-10 text-center">
            Welcome, let's start you off by first inputting your name
          </Text>
          <FormField
            value={name}
            handleChangeText={setName}
            otherStyles="mt-7"
            placeholder="Name"
          />
          <CustomButton
            title="Next"
            handlePress={inputName}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default Name;
