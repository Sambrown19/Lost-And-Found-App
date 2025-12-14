// app/(auth)/_layout.tsx

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="email-verification" />
      <Stack.Screen name="email-verified" />
      <Stack.Screen name="complete-profile" />
    </Stack>
  );
}