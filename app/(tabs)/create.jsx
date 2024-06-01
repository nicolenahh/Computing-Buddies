import { ScrollView, Text, View, TextInput } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomButton from '../../components/CustomButton';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';

const Create = () => {
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user) {
        alert('You must be logged in to create a post.');
        return;
      }

      const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', user.uid));
      const username = userDoc.exists() ? userDoc.data().username : 'Anonymous';

      await addDoc(collection(FIRESTORE_DB, 'posts'), {
        content: postContent,
        userId: user.uid,
        username: username,
        createdAt: new Date(),
      });

      console.log('Post created successfully');
      alert('Post created successfully!');
      setPostContent('');
    } catch (error) {
      console.log('Error creating post:', error);
      alert('Failed to create post: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="h-full">
      <ScrollView>
        <View className="w-full h-full justify-center min-h-[80vh] px-4">
          <Text className="font-gdiff text-3xl text-blue">Create Post</Text>

          <TextInput
            placeholder="What's on your mind?"
            value={postContent}
            onChangeText={setPostContent}
            className="border border-gray-300 p-4 mt-10 text-lg"
            multiline
            numberOfLines={4}
          />

          <CustomButton
            title="Submit Post"
            handlePress={handleSubmit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Create;
