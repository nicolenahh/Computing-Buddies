import { ScrollView, Text, View } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import { images } from '../../constants'
import FormField from '../../components/FormField'

import CustomButton from '../../components/CustomButton';
import { Link } from 'expo-router'

import { FIREBASE_AUTH } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const SignUp = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const auth = FIREBASE_AUTH;

  const signUp = async () => {
    setIsSubmitting(true);
    try {
      const response = await createUserWithEmailAndPassword(auth, form.email, form.password);
      console.log(response);
      alert("Check your email!");
    } catch (error) {
      console.log(error);
      alert('Sign up failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="h-full">
      <ScrollView>
        <View className="w-full h-full justify-center min-h-[80vh] px-4">
          <Text className="font-gdiff text-3xl text-blue">
            StudyBuddy
          </Text>

          <Text className="text-2xl font-psemibold text-semibold mt-10">
            Sign up 
          </Text>

          <FormField
            title="Username"
            value={form.username}
            handleChangeText={(e) => setForm({ ...form, username: e})}
            otherStyles="mt-10"
          />

          <FormField
            title="Email"
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
          title="Create Account"
          handlePress={signUp}
          containerStyles="mt-7"
          isLoading={isSubmitting}
          />

          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-600 font-pregular">
              Have an account already?
            </Text>
            <Link href='/sign-in' className="text-lg font-psemibold text-blue">Sign In</Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignUp