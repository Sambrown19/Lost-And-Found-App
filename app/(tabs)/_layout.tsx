import { useTheme } from "@/context/ThemeContext";
import { getUserProfile } from "@/services/userService";
import { Tabs, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View, Image, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { account } from "../../config/appwrite";

export default function TabLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const guardCheck = async () => {
      try {
        // 1. Must have an active session
        await account.get();

        // 2. Must have a completed profile in the database
        const profile = await getUserProfile();
        if (!profile) {
          // Account exists but profile setup was never finished
          router.replace("/(auth)/complete-profile");
          return;
        }
      } catch {
        // No session at all — send to login
        router.replace("/(auth)/login");
        return;
      } finally {
        setChecking(false);
      }
    };

    guardCheck();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 90 : 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerShown: false,
        freezeOnBlur: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home-sharp" : "home-outline"}
              size={24}
              color={focused ? colors.primary : colors.textLight}
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="my-items"
        options={{
          title: "My Items",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "file-tray-stacked" : "file-tray-stacked-outline"}
              size={24}
              color={focused ? colors.primary : colors.textLight}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={24}
              color={focused ? colors.primary : colors.textLight}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={focused ? colors.primary : colors.textLight}
            />
          ),
        }}
      />
    </Tabs>
  );
}