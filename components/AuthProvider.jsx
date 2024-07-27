// components/AuthProvider.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { FIREBASE_AUTH } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const navigation = useNavigation(); // Initialize navigation

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      setUser(null);
      navigation.navigate('sign-in'); // Navigate to login page
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, form, setForm, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
