import { ID, Query } from "react-native-appwrite";
import { sendItemMatchNotification } from "./notificationsService";
import {
  account,
  DATABASE_ID,
  databases,
  ITEMS_COLLECTION_ID,
  storage,
  STORAGE_BUCKET_ID,
  USERS_COLLECTION_ID,
  client,
} from "../config/appwrite";
import { Platform } from "react-native";
export interface Item {
  $id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  images: string;
  status: "active" | "claimed" | "resolved";
  createdAt: string;
}

export const createItem = async (
  data: Omit<Item, "$id" | "userId" | "userName" | "userEmail" | "createdAt">,
) => {
  const user = await account.get();

  const userProfile = await databases.listDocuments(
    DATABASE_ID,
    USERS_COLLECTION_ID,
    [Query.equal("userId", user.$id)],
  );

  const userName = userProfile.documents[0]?.fullName || "Anonymous";

  const item = await databases.createDocument(
    DATABASE_ID,
    ITEMS_COLLECTION_ID,
    ID.unique(),
    {
      userId: user.$id,
      userName,
      userEmail: user.email,
      type: data.type,
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      date: data.date,
      images: data.images,
      status: data.status,
      createdAt: new Date().toISOString(),
    },
  );

  // ------- POTENTIAL MATCH NOTIFICATION LOGIC -------
  try {
    if (data.type === "found") {
      // Find active lost items in the same category
      const lostItems = await databases.listDocuments(DATABASE_ID, ITEMS_COLLECTION_ID, [
        Query.equal("type", "lost"),
        Query.equal("category", data.category),
        Query.equal("status", "active"),
      ]);

      const notifiedUsers = new Set<string>();
      for (const lostItem of lostItems.documents) {
        if (lostItem.userId !== user.$id && !notifiedUsers.has(lostItem.userId)) {
          notifiedUsers.add(lostItem.userId);
          await sendItemMatchNotification(
            lostItem.userId,
            "Potential Match!",
            `Someone just found an item matching your lost ${data.category}. Tap to view it.`,
            item.$id // Direct them to the new found item
          );
        }
      }
    } else if (data.type === "lost") {
      // Find active found items in the same category
      const foundItems = await databases.listDocuments(DATABASE_ID, ITEMS_COLLECTION_ID, [
        Query.equal("type", "found"),
        Query.equal("category", data.category),
        Query.equal("status", "active"),
      ]);

      // Filter out items found by the user themselves
      const otherFoundItems = foundItems.documents.filter(doc => doc.userId !== user.$id);

      if (otherFoundItems.length > 0) {
        const latestFound = otherFoundItems[0];
        await sendItemMatchNotification(
          user.$id, // Notify the user who just created the lost item
          "Potential Match Found!",
          `We already have a found item matching your ${data.category}. Tap to check if it's yours.`,
          latestFound.$id // Direct them to the existing found item
        );
      }
    }
  } catch (err) {
    console.error("Match notification logic failed:", err);
  }

  return item;
};

export const getAllItems = async () => {
  const response = await databases.listDocuments(
    DATABASE_ID,
    ITEMS_COLLECTION_ID,
    [
      Query.equal("status", "active"),
      Query.orderDesc("createdAt"),
      Query.limit(50),
    ],
  );

  return response.documents as any[];
};

export const getItemsByType = async (type: "lost" | "found") => {
  const response = await databases.listDocuments(
    DATABASE_ID,
    ITEMS_COLLECTION_ID,
    [
      Query.equal("type", type),
      Query.equal("status", "active"),
      Query.orderDesc("createdAt"),
      Query.limit(50),
    ],
  );

  return response.documents;
};

export const getUserItems = async () => {
  const user = await account.get();

  const response = await databases.listDocuments(
    DATABASE_ID,
    ITEMS_COLLECTION_ID,
    [Query.equal("userId", user.$id), Query.orderDesc("createdAt")],
  );

  return response.documents as any[];
};

export const getItemById = async (id: string): Promise<any> => {
  try {
    const response = await databases.getDocument(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      id,
    );
    return response;
  } catch (error) {
    console.error("Error fetching item by ID:", error);
    throw error;
  }
};

export const updateItemStatus = async (id: string, status: "active" | "claimed" | "resolved"): Promise<any> => {
  try {
    const response = await databases.updateDocument(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      id,
      { status }
    );
    return response;
  } catch (error) {
    console.error("Error updating item status:", error);
    throw error;
  }
};

const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
};

export const uploadImage = async (imageUri: string) => {
  try {
    // Make sure we have a valid session
    const user = await account.get();
    console.log("Uploading for user:", user.$id);
    
    // Hardcode a clean filename since device URIs often have unpredictable or missing extensions
    const fileName = `upload_${Date.now()}.jpg`;
    const fileType = 'image/jpeg';
    
    // Create file object in the format Appwrite expects
    // Sometimes iOS file:// prefix blocks binary reading in React Native
    const formattedUri = Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri;
    
    const file = {
      uri: formattedUri,
      name: fileName,
      type: fileType,
      size: 1024, // Bypass empty checks if any
    };
    
    // Upload using Appwrite SDK
    const result = await storage.createFile(
      STORAGE_BUCKET_ID,
      ID.unique(),
      file as any
    );
    
    // Explicitly build the public URL to avoid relative routing issues in SDK URL parsers
    const endpointStr = client.config.endpoint;
    const projectStr = client.config.project;
    
    const finalUrl = `${endpointStr}/storage/buckets/${STORAGE_BUCKET_ID}/files/${result.$id}/view?project=${projectStr}`;
    console.log("Upload successful:", finalUrl);
    
    return finalUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};