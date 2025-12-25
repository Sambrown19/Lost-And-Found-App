// app/(tabs)/_layout.tsx

import { Tabs } from 'expo-router';
import { Image } from 'react-native';
import Colors from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/home-01.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? Colors.primary : Colors.textLight,
              }}
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/Messages.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? Colors.primary : Colors.textLight,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/Account.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? Colors.primary : Colors.textLight,
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}