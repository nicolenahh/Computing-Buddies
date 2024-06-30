import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

const _layout = () => {
    return (
        <>
          <Stack screenOptions={{ headerShown: false}}>
            <Stack.Screen 
              name="name"
            />
            <Stack.Screen 
              name="gender"
            />
            <Stack.Screen 
              name="yearCourse"
            />
            <Stack.Screen 
              name="final"
            />
          </Stack>
    
          <StatusBar //backgroundColor='#3838e8' 
          style='dark'/>
        </>
      )
}

export default _layout