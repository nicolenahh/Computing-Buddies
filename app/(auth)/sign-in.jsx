import { ScrollView, Text, View } from 'react-native'
import React, { useState, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import { images } from '../../constants'
import FormField from '../../components/FormField'

import CustomButton from '../../components/CustomButton';
import { Link, router } from 'expo-router'

import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../components/AuthProvider'; // <-- Import the context

const SignIn = () => {
  const { form, setForm } = useAuth(); // <-- Use the context
  const [isSubmitting, setIsSubmitting] = useState(false);

  const auth = FIREBASE_AUTH;

  const signIn = async () => {
    setIsSubmitting(true);
    try {
      let email = form.email;

      // Check if the input is a username
      if (!email.includes('@')) {
        // Assume it's a username and fetch the email
        const usernameDoc = await getDoc(doc(FIRESTORE_DB, 'usernames', email));
        if (usernameDoc.exists()) {
          email = usernameDoc.data().email;
        } else {
          throw new Error('No account found with that username');
        }
      }

      const response = await signInWithEmailAndPassword(auth, email, form.password);
      const user = response.user;

      // Check if user has completed onboarding
      const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.name && userData.gender && userData.course && userData.yearOfStudy) {
          router.push('../(tabs)/home');
        } else {
          router.push('../(onboarding)/name');
        }
      } else {
        router.push('/onboarding');
      }
    } catch (error) {
      console.log(error);
      alert('Sign in failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="h-full">
      <ScrollView>
        <View className="w-full h-full justify-center min-h-[80vh] px-4">
          <Text className="font-gdiff text-5xl text-blue">
            StudyBuddy
          </Text>

          <Text className="text-2xl font-psemibold text-semibold mt-10">
            Log in
          </Text>

          <FormField
            title="Email or Username"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e})}
            otherStyles="mt-7"
            keyboardType="email-address"
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e})}
            otherStyles="mt-7"
          />

          <CustomButton
            title="Sign In"
            handlePress={signIn}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />

          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-600 font-pregular">
              Don't have account?
            </Text>
            <Link href='/sign-up' className="text-lg font-psemibold text-blue">Sign Up</Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignIn
