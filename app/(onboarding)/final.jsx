import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomButton from '../../components/CustomButton';
import { router } from 'expo-router';

const Final = () => {
  const handleGoHome = () => {
    router.push('../(tabs)/home');
  };

  return (
    <SafeAreaView className="h-full">
      <View className="w-full h-full justify-center items-center min-h-[80vh] px-4">
        <Text className="text-4xl font-psemibold text-semibold mt-10 text-center">
          Congratulations!
        </Text>
        <Text className="text-xl font-pregular text-center mt-4">
          You are now ready to start making 
        </Text>
        <Text className="font-psemibold text-2xl text-blue ">
          Study Buddies
        </Text>
        <CustomButton
          title="Go to Home"
          handlePress={handleGoHome}
          containerStyles="mt-7 px-10"
        />
      </View>
    </SafeAreaView>
  );
};

export default Final;
