import { View, Text, FlatList, Image } from 'react-native'
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context'
import { images } from '../../constants'
import SearchInput from '../../components/SearchInput'
import Trending from '../../components/Trending'
import EmptyState from '../../components/EmptyState'


const Home = () => {
  
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
            <View className="justify-between items-start flex-row mb-6">
              <View>
                <Text className="font-pmedium text-sm text-black">
                  Welcome Back
                </Text>
                <Text className="text-2xl font-psemibold text-white">
                  Waylon
                </Text>
              </View>

              <View>
                

              </View>
            </View>
            <SearchInput
            />
            

            <View className="w-full flex-1 pt-5 pb-8">
              <Text className="text-white text-lg font-psemibold mb-3">
                Latest Posts
              </Text>

              <Trending posts={[{ id: 1}, { id: 2}, { id: 3}] ?? []} />
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

export default Home