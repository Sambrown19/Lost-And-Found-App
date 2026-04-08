import { Stack, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect } from "react";

function RootLayoutNav() {
  const router = useRouter();

  useEffect(() => {
    // Handle deep links
    const handleDeepLink = (event: Linking.EventType) => {
      const url = event.url;
      console.log("Deep link received:", url);

      if (url.includes("/email-verified")) {
        const path = url.replace(Linking.createURL(""), "");
        router.push(path);
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check initial URL
    Linking.getInitialURL().then((url) => {
      console.log("Initial URL:", url);
      if (url && url.includes("/email-verified")) {
        const path = url.replace(Linking.createURL(""), "");
        router.push(path);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(auth)" />

      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />

      <Stack.Screen name="item/[id]" />
      <Stack.Screen name="chat/[id]" />

      <Stack.Screen
        name="report-lost"
        options={{
          presentation: "modal",
          gestureEnabled: true,
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="report-found"
        options={{
          presentation: "modal",
          gestureEnabled: true,
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return <RootLayoutNav />;
}
