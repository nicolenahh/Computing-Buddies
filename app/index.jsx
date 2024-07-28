import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, Text, View } from 'react-native';
import { Link, Redirect, router} from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../constants';
import CustomButton from '../components/CustomButton';

export default function App() {
  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView contentContainerStyle={{ height: '100%'
      }}>
        <View className="w-full justify-center items-center min-h-[85vh] px-4">
          <Text className="font-gdiff text-5xl text-blue mt-4">
            StudyBuddy
          </Text>

          <View className="relative mt-4">
            <Text className="text-3xl text-center font-bold font-gdiff ">
              A one stop app to make
            </Text>
            <Text className="text-3xl text-center font-gdiff text-blue">
              Study Buddies
            </Text>
          </View>

          <Text className="text-sm font-pregular text-gray-900 mt-7 text-center">
            A platform for students, by students to make connections with like-minded
            people
          </Text>

          <CustomButton 
          title="Sign in"
          handlePress={() => router.push('/sign-in')}
          containerStyles="w-full mt-7"
          />
        </View>
      </ScrollView>
      <StatusBar //backgroundColor='#3838e8' 
      style='dark'/>
    </SafeAreaView>
  );
}
