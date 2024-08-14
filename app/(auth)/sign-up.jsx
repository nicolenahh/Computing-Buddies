import React, { useState } from 'react';
import { Alert, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { Link } from 'expo-router';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { images } from '../../constants';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const SignUp = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const auth = FIREBASE_AUTH;

  const isEmailValid = (email) => {
    return email.endsWith('@u.nus.edu');
  };
  

  const signUp = async () => {
    if (!isEmailValid(form.email)) {
      Alert.alert('Invalid Email', 'Please use your university email ending with @u.nus.edu');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = response.user;
      console.log('User created:', user);

      // Send email verification
      await sendEmailVerification(user);
      console.log('Verification email sent to:', form.email);

      // Save the username and default profile picture to Firestore
      await setDoc(doc(FIRESTORE_DB, 'users', user.uid), {
        username: form.username,
        email: form.email,
        profilePicture: images.defaultpic // Assign default profile picture
      });

      await setDoc(doc(FIRESTORE_DB, 'usernames', form.username), {
        email: form.email
      });

      console.log('Username and profile picture saved to Firestore:', form.username);
      Alert.alert("Verification Email Sent", "Please check your email to verify your account.");

    } catch (error) {
      console.log('Error during sign up:', error);
      Alert.alert('Sign up failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="h-full">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={100}
      >
        <View className="w-full justify-center min-h-[90vh] px-4">
          <Text className="font-gdiff text-5xl text-blue">StudyBuddy</Text>
          <Text className="text-2xl font-psemibold text-semibold mt-10">Sign up</Text>
          <FormField
            title="Username"
            value={form.username}
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles="mt-10"
          />
          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-7"
            keyboardType="email-address"
          />
          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-7"
            secureTextEntry
          />
          <CustomButton
            title="Create Account"
            handlePress={signUp}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />
          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-600 font-pregular">Have an account already?</Text>
            <Link href='/sign-in' className="text-lg font-psemibold text-blue">Sign In</Link>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default SignUp;
