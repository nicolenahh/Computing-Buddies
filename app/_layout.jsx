import { StyleSheet, Text, View } from 'react-native'
import { SplashScreen, Slot, Stack } from 'expo-router';
import { useEffect, useState } from 'react'
import { useFonts } from 'expo-font';
import { onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from '../firebaseConfig';
import LoadingScreen from '../components/LoadingScreen';
import { AuthProvider } from '../components/AuthProvider';
import { RefreshProvider } from './refreshContext';


SplashScreen.preventAutoHideAsync();

const Rootlayout = () => {
  const [fontsLoaded, error] = useFonts({
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
    "GlacialIndifference-Bold": require("../assets/fonts/GlacialIndifference-Bold.otf"),
  });

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      console.log('user', user);
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) {
    return null;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <RefreshProvider>
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(onboarding)" />
          </>
        ) : (
          <>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="index" />
          </>
        )}
      </Stack>
    </AuthProvider>
    </RefreshProvider>
  );
}

export default Rootlayout