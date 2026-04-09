import { useTheme } from "@/context/ThemeContext";
import { Tabs } from "expo-router";
import { Image } from "react-native";

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../../assets/images/home-01.png")}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? colors.primary : colors.textLight,
              }}
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../../assets/images/Messages.png")}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? colors.primary : colors.textLight,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../../assets/images/Account.png")}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? colors.primary : colors.textLight,
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}