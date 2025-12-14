// app/(onboarding)/_layout.tsx

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // This prevents swipe back on onboarding screens
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}