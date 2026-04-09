import { ID, Query } from "react-native-appwrite";
import {
  account,
  DATABASE_ID,
  databases,
  ITEMS_COLLECTION_ID,
  storage,
  STORAGE_BUCKET_ID,
  USERS_COLLECTION_ID,
} from "../config/appwrite";
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
    
    // Get file info
    const fileName = imageUri.split('/').pop() || `image_${Date.now()}.jpg`;
    const fileType = 'image/jpeg';
    
    // Create file object in the format Appwrite expects
    const file = {
      uri: imageUri,
      name: fileName,
      type: fileType,
      size: 0, // Size will be handled automatically
    };
    
    // Upload using Appwrite SDK
    const result = await storage.createFile(
      STORAGE_BUCKET_ID,
      ID.unique(),
      file
    );
    
    // Get the correct view URL
    const imageUrl = storage.getFileView(STORAGE_BUCKET_ID, result.$id);
    console.log("Upload successful:", imageUrl);
    
    return imageUrl.toString();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};