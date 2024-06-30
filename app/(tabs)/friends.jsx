import { View, Text, FlatList, TouchableOpacity, Button } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import SearchInput from '../../components/SearchInput';
import { router } from 'expo-router';
import { CustomButton } from '../../components';

const Friends = () => {
  // Dummy data for the FlatList with rank property
  const data = [
    { id: 1, name: 'John Doe', rank: 1 },
    { id: 2, name: 'Jane Smith', rank: 2 },
    { id: 3, name: 'Mike Johnson', rank: 3 },
  ];

  const navigateToSearch = () => {
    router.push('../search/[query]');
  };

  
  return (
    <SafeAreaView className="bg-white h-full">
      <View className="justify-right px-4">
        <CustomButton title="Add Friends" handlePress={navigateToSearch}/>
      </View>
      

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View className="flex-row justify-left">
            <Text className="my-1 px-4 text-xl font-psemibold text-black">{item.rank}.</Text>
            <Text className="my-1 px-4 text-xl font-psemibold text-black">{item.name}</Text>
          </View>
        )}

        ListHeaderComponent={() => (
          <View className="my-1 px-4 space-y-6">
            <View className="justify-between justify-center items-start flex-row mb-6">
              <View>
                <Text className="text-2xl font-psemibold text-white">
                  Leaderboard
                </Text>
              </View>
            </View>
          </View>
        )}
      
        ListEmptyComponent={() => (
          <EmptyState
            title="No friends found"
            subtitle="Add friends to see them here!"
          />
        )}

      />
    </SafeAreaView>
  )
}

export default Friends
