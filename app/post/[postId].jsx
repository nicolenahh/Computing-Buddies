import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, Button, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, orderBy, addDoc, where } from 'firebase/firestore';
import { AntDesign } from '@expo/vector-icons';

const defaultAvatar = 'https://www.example.com/default-avatar.png'; // URL to default avatar image

const PostDetail = () => {
  const { postId } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const router = useRouter();

  const fetchComments = async () => {
    try {
      const q = query(
        collection(FIRESTORE_DB, 'comments'),
        where('postId', '==', postId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const commentsList = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
        const commentData = docSnapshot.data();
        const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', commentData.userId));
        return {
          id: docSnapshot.id,
          ...commentData,
          username: userDoc.exists() ? userDoc.data().username : 'Unknown',
          profilePicture: userDoc.exists() ? userDoc.data().profilePicture : null
        };
      }));
      setComments(commentsList);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const docRef = doc(FIRESTORE_DB, 'posts', postId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const postData = docSnap.data();
          const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', postData.userId));
          setPost({
            ...postData,
            username: userDoc.exists() ? userDoc.data().username : 'Unknown',
            profilePicture: userDoc.exists() ? userDoc.data().profilePicture : null
          });
        }
      } catch (error) {
        console.error('Failed to fetch post:', error);
      }
    };

    fetchPost();
    fetchComments();
  }, [postId]);

  const handleCommentSubmit = async () => {
    if (!comment.trim()) {
      alert('Comment cannot be empty.');
      return;
    }
    try {
      await addDoc(collection(FIRESTORE_DB, 'comments'), {
        postId: postId,
        content: comment,
        userId: FIREBASE_AUTH.currentUser.uid,
        username: FIREBASE_AUTH.currentUser.displayName,
        createdAt: new Date(),
      });
      setComment('');
      fetchComments(); // Refresh comments
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment: ' + error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-row items-center p-4 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-lg font-bold">Post Details</Text>
        </View>
        <ScrollView className="flex-1 p-4">
          {post && (
            <>
              <View className="flex-row items-center mb-4">
                <Image
                  source={post.profilePicture ? { uri: post.profilePicture } : { uri: defaultAvatar }}
                  className="w-8 h-8 rounded-full mr-2"
                />
                <Text className="text-gray-500">{post.username}</Text>
              </View>
              <Text className="text-xl font-bold">{post.title || 'No Title'}</Text>
              <Text className="text-l">{post.content}</Text>
              <Text className="text-gray-400">Category: {post.category}</Text>
              {comments.map((comment) => (
                <View key={comment.id} className="p-2 border-b border-gray-200">
                  <View className="flex-row items-center mb-1">
                    <Image
                      source={comment.profilePicture ? { uri: comment.profilePicture } : { uri: defaultAvatar }}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <Text className="text-gray-800">{comment.username}</Text>
                  </View>
                  <Text className="mb-1">{comment.content}</Text>
                  <Text className="text-gray-500 text-sm">{new Date(comment.createdAt.toDate()).toLocaleString()}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
        <View className="p-4 border-t border-gray-200">
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment..."
            className="border border-gray-400 rounded-full px-4 py-2 mb-2"
          />
          <Button title="Submit Comment" onPress={handleCommentSubmit} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PostDetail;
