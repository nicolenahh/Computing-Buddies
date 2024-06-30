import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import LoadingScreen from '../../components/LoadingScreen'
import { onAuthStateChanged } from 'firebase/auth'
import { FIREBASE_AUTH } from '../../firebaseConfig'

const AuthLayout = () => {

  return (
    <>
      <Stack screenOptions={{ headerShown: false}}>
        <Stack.Screen 
          name="sign-in"
        />
        <Stack.Screen 
          name="sign-up"
        />
      </Stack>

      <StatusBar //backgroundColor='#3838e8' 
      style='dark'/>
    </>
  )
}

export default AuthLayout