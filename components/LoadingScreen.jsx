import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { tw } from 'nativewind'; // Ensure you have nativewind setup

const LoadingScreen = () => {
  return (
    <View style={`flex-1 justify-center items-center bg-blue-50`}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={`mt-5 text-lg text-gray-800`}>Loading...</Text>
    </View>
  );
};

export default LoadingScreen;