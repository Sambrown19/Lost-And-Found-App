import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Query } from "react-native-appwrite";
import Constants from "expo-constants";
import {
  account,
  DATABASE_ID,
  databases,
  USERS_COLLECTION_ID,
  NOTIFICATIONS_COLLECTION_ID,
} from "../config/appwrite";
import { ID } from "react-native-appwrite";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
export const registerForPushNotifications = async () => {
  try {
    if (!Device.isDevice) {
      console.log("Push notifications only work on physical devices");
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permission not granted for push notifications");
      return null;
    }

    // Android channel setup
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("messages", {
        name: "Messages",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0A1628",
        sound: "default",
      });
    }

    // Fetch push token with retry — this often fails in Expo Go due to
    // network issues or SDK 53+ limitations. It's non-critical.
    let token: string | null = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        token = result.data;
        break;
      } catch (tokenError) {
        if (attempt === 2) {
          // After 2 attempts, just log a warning — push is non-critical
          console.warn(
            "Push token registration failed (this is expected in Expo Go):",
            tokenError instanceof Error ? tokenError.message : tokenError,
          );
          return null;
        }
        // Wait 2s before retrying
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (!token) return null;

    console.log("=========================================");
    console.log("ANDROID TEST TOKEN: ", token);
    console.log("=========================================");
    await savePushToken(token);
    return token;
  } catch (error) {
    console.warn("Register notifications skipped:", error instanceof Error ? error.message : error);
    return null;
  }
};

export const savePushToken = async (token: string) => {
  try {
    const user = await account.get();
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal("userId", user.$id)],
    );

    if (response.documents.length > 0) {
      await databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        response.documents[0].$id,
        { pushToken: token },
      );
      console.log("Push token saved successfully");
    }
  } catch (error: any) {
    if (error?.message?.includes("missing scopes") || error?.code === 401) {
      console.log("Skipping push token saving: User not logged in (guest).");
    } else {
      console.error("Save push token error:", error);
    }
  }
};

export const removePushToken = async () => {
  try {
    const user = await account.get();
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal("userId", user.$id)],
    );

    if (response.documents.length > 0) {
      await databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        response.documents[0].$id,
        { pushToken: null },
      );
      console.log("Push token removed successfully");
    }
  } catch (error) {
    console.error("Remove push token error:", error);
  }
};

export const sendPushNotification = async (
  receiverUserId: string,
  senderName: string,
  message: string,
  conversationId: string,
) => {
  try {
    // Get receiver's push token from Appwrite
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal("userId", receiverUserId)],
    );

    if (response.documents.length === 0) return;

    const pushToken = response.documents[0].pushToken;
    if (!pushToken) {
      console.log("Receiver has no push token");
      return;
    }

    // Send via Expo push service
    const result = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        title: senderName,
        body: message,
        data: { conversationId },
        sound: "default",
        badge: 1,
        channelId: "messages",
        priority: "high",
      }),
    });

    const data = await result.json();
    console.log("Push notification sent:", data);
  } catch (error) {
    console.error("Send push notification error:", error);
  }
};

export const sendItemMatchNotification = async (
  receiverUserId: string,
  title: string,
  body: string,
  itemId: string,
) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal("userId", receiverUserId)],
    );

    if (response.documents.length === 0) return;

    const pushToken = response.documents[0].pushToken;
    if (!pushToken) return;

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        title: title,
        body: body,
        data: { url: `/item/${itemId}` }, // Direct deep link matching Expo Router
        sound: "default",
        badge: 1,
        channelId: "default",
        priority: "high",
      }),
    });

    // Save notification to DB
    await databases.createDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        userId: receiverUserId,
        title: title,
        body: body,
        type: "match",
        data: JSON.stringify({ itemId }),
        isRead: false,
      }
    );
  } catch (error) {
    console.error("Send match notification error:", error);
  }
};

export const sendLocalNotification = async (title: string, body: string) => {
  try {
    const Notifications = await import("expo-notifications");

    // Must ensure permissions are granted before firing local notifications
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Local notification blocked: no permissions.");
        return;
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
      },
      trigger: null, // trigger immediately
    });

    // Save to database
    try {
      const user = await account.get();
      await databases.createDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        ID.unique(),
        {
          userId: user.$id,
          title: title,
          body: body,
          type: "system",
          data: null,
          isRead: false,
        }
      );
    } catch (e) {
      console.log("Could not save local notification to DB", e);
    }
  } catch (error) {
    console.error("Local notification error", error);
  }
};