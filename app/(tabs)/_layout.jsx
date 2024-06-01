import { View, Text, Image } from 'react-native'
import { Tabs, Redirect } from 'expo-router'

import { icons } from '../../constants';

const TabIcon = ({ icon, color, name, focused}) => {
  return (
  <View className="items-center justify-center gap-2">
      <Image 
        source={icon}
        resizeMode="contain"
        tintColor={color}
        className="w-6 h-6"
      />
      <Text className={`${focused ? 'font-psemibold' :
        'font-pregular'} text-xs`} style={{ color: color}}
      >
        {name}
      </Text>
  </View>
  )
}

const TabsLayout = () => {
  return (
    <>
    <Tabs
    screenOptions={{
      tabBarShowLabel: false,
      tabBarActiveTintColor: '#62C5E6',
      tabBarInactiveTintColor: '#000000',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 0.2,
        borderTopColor: '#000000',
        height: 90,
      }
    }}
    >
      <Tabs.Screen
      name="home" 
      options={{
        title: "Home",
        headerShown: false,
        tabBarIcon: ({ color, focused}) => (
          <TabIcon
            icon={icons.tabHome}
            color={color}
            name="Home"
            focused={focused}
          />
        )
      }}
      />
      <Tabs.Screen
      name="friends"
      options={{
        title: 'Friends',
        headerShown: false,
        tabBarIcon: ({ color, focused}) => (
          <TabIcon
            icon={icons.tabFriends}
            color={color}
            name="Friends"
            focused={focused}
          />
        )
      }}
      />
      <Tabs.Screen
      name="create"
      options={{
        title: 'Create',
        headerShown: false,
        tabBarIcon: ({ color, focused}) => (
          <TabIcon
            icon={icons.plus}
            color={color}
            name="Create"
            focused={focused}
          />
        )
      }}
      />
      <Tabs.Screen
      name="messages"
      options={{
        title: 'Messages',
        headerShown: false,
        tabBarIcon: ({ color, focused}) => (
          <TabIcon
            icon={icons.tabMessage}
            color={color}
            name="Messages"
            focused={focused}
          />
        )
      }}
      />
      <Tabs.Screen
      name="profile"
      options={{
        title: 'Profile',
        headerShown: false,
        tabBarIcon: ({ color, focused}) => (
          <TabIcon
            icon={icons.tabUser}
            color={color}
            name="Profile"
            focused={focused}
          />
        )
      }}
      />
    </Tabs>
    </>
  )
}

export default TabsLayout