import React, { createContext, useState, useContext } from 'react';
import { FIREBASE_AUTH } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      setForm({ email: '', password: '' });
      navigation.navigate('sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Failed to log out. Please try again.');
    }
  };

  return (
    <AuthContext.Provider value={{ form, setForm, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
