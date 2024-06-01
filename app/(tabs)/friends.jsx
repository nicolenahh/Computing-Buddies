import { View, Text, FlatList } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import SearchInput from '../../components/SearchInput'

const Friends = () => {
  return (
    <SafeAreaView className="bg-customBlue h-full">
      <FlatList
        data={[{ id: 1 }, { id: 2 }, { id: 3 }, ]}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <Text className="text-3xl text-white">{item.id}</Text>
        )}
        ListHeaderComponent={() => (
          <View className="my-1 px-4 space-y-6">
            <View className="justify-between justify-center items-start flex-row mb-6">
              <View>
                <Text className="text-2xl font-psemibold text-white">
                  Leaderboard
                </Text>
              </View>

              <View>
                

              </View>
            </View>

            

            <View className="w-full flex-1 pt-5 pb-8">


            </View>
          </View>
        )}
      
        ListEmptyComponent={() => (
          <EmptyState 
            title="No posts found"
            subtitle="Be the first one to upload a post!"
          />
        )}

      />
    </SafeAreaView>
  )
}

export default Friends