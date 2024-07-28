import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, Button, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, orderBy, addDoc, where } from 'firebase/firestore';
import { AntDesign } from '@expo/vector-icons';
import { Alert } from 'react-native';

const defaultAvatar = 'https://www.example.com/default-avatar.png'; // URL to default avatar image

const PostDetail = () => {
  const { postId } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [poster, setPoster] = useState(null);
  const [posterModalVisible, setPosterModalVisible] = useState(false);
  const router = useRouter();
  const blueColor = '#62C5E6'; 

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

  const fetchPosterData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', userId));
      if (userDoc.exists()) {
        setPoster({ userId, ...userDoc.data() }); // Ensure userId is set in poster data
        setPosterModalVisible(true);
      } else {
        alert('Failed to fetch poster data.');
      }
    } catch (error) {
      console.error('Failed to fetch poster data:', error);
      alert('Failed to fetch poster data: ' + error.message);
    }
  };

  const handleAddFriend = async (userId, username) => {
    const currentUser = FIREBASE_AUTH.currentUser;
    if (!currentUser) {
      alert('You must be logged in to send a friend request.');
      return;
    }

    if (userId === currentUser.uid) {
      alert('You cannot send a friend request to yourself.');
      return;
    }

    const currentUserDoc = await getDoc(doc(FIRESTORE_DB, 'users', currentUser.uid));
    const currentUserData = currentUserDoc.data();
    const currentUserFriends = currentUserData.friends || [];

    if (currentUserFriends.includes(userId)) {
      alert('You are already friends with this user.');
      return;
    }

    Alert.alert(
      'Send Friend Request',
      `Are you sure you want to send a friend request to ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await addDoc(collection(FIRESTORE_DB, 'friendRequests'), {
                fromUserId: currentUser.uid,
                toUserId: userId,
                status: 'pending',
                createdAt: new Date(),
              });
              alert('Friend request sent successfully!');
            } catch (error) {
              console.error('Error sending friend request:', error);
              alert('Failed to send friend request: ' + error.message);
            }
          }
        }
      ]
    );
  };

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
                <TouchableOpacity onPress={() => fetchPosterData(post.userId)}>
                  <Image
                    source={post.profilePicture ? { uri: post.profilePicture } : { uri: defaultAvatar }}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => fetchPosterData(post.userId)}>
                  <Text className="text-gray-500">{post.username}</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-xl font-bold">{post.title || 'No Title'}</Text>
              <Text className="text-l">{post.content}</Text>
              <Text className="text-gray-400">Category: {post.category}</Text>
              {comments.map((comment) => (
                <View key={comment.id} className="p-2 border-b border-gray-200">
                  <View className="flex-row items-center mb-1">
                    <TouchableOpacity onPress={() => fetchPosterData(comment.userId)}>
                      <Image
                        source={comment.profilePicture ? { uri: comment.profilePicture } : { uri: defaultAvatar }}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => fetchPosterData(comment.userId)}>
                      <Text className="text-gray-800">{comment.username}</Text>
                    </TouchableOpacity>
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

      <Modal
        visible={posterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPosterModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="w-4/5 p-4 bg-white rounded-lg">
            {poster && (
              <>
                <View className="flex-row justify-between items-center">
                  <Image
                    source={poster.profilePicture ? { uri: poster.profilePicture } : { uri: defaultAvatar }}
                    className="w-24 h-24 rounded-full mb-4"
                  />
                  <TouchableOpacity onPress={() => handleAddFriend(poster.userId, poster.username)}>
                    <AntDesign name="adduser" size={24} color={blueColor} />
                  </TouchableOpacity>
                </View>
                <Text className="text-xl font-bold">{poster.username}</Text>
                <Text className="text-l">Course: {poster.course}</Text>
                <Text className="text-l">Year of Study: {poster.yearOfStudy}</Text>
                <Button title="Close" onPress={() => setPosterModalVisible(false)} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PostDetail;
