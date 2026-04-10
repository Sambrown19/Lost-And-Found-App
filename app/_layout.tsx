import { ThemeProvider } from '@/context/ThemeContext';
import { registerForPushNotifications } from '@/services/notificationsService';
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef } from "react";

function RootLayoutNav() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const conversationId = response.notification.request.content.data?.conversationId;
        if (conversationId) {
          router.push({
            pathname: "/chat/[id]",
            params: { id: conversationId as string },
          });
        }
      }
    );

    const handleDeepLink = (event: Linking.EventType) => {
      const url = event.url;
      console.log("Deep link received:", url);
      if (url.includes("/email-verified")) {
        const path = url.replace(Linking.createURL(""), "");
        router.push(path as any);
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    Linking.getInitialURL().then((url) => {
      console.log("Initial URL:", url);
      if (url && url.includes("/email-verified")) {
        const path = url.replace(Linking.createURL(""), "");
        router.push(path as any);
      }
    });

    return () => {
      subscription.remove();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
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
      <Stack.Screen name="profile" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}