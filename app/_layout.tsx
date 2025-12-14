// app/_layout.tsx

import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen 
        name="(tabs)" 
        options={{
          gestureEnabled: false, // Disable swipe back on main app
        }}
      />
    </Stack>
  );
}