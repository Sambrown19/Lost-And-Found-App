// config/appwrite.ts

import { Account, Client, Databases, Storage } from "react-native-appwrite";

export const client = new Client();

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  console.error("Missing Appwrite configuration! Check your .env file");
}

client
  .setEndpoint(endpoint || "https://fra.cloud.appwrite.io/v1")
  .setProject(projectId || "")
  .setPlatform("com.mante.lostandfound");  // ← ONLY ADD THIS

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID || "";
export const USERS_COLLECTION_ID =
  process.env.EXPO_PUBLIC_USERS_COLLECTION_ID || "";
export const ITEMS_COLLECTION_ID =
  process.env.EXPO_PUBLIC_ITEMS_COLLECTION_ID || "";
export const STORAGE_BUCKET_ID =
  process.env.EXPO_PUBLIC_STORAGE_BUCKET_ID || "";
export const MESSAGES_COLLECTION_ID =
  process.env.EXPO_PUBLIC_MESSAGES_COLLECTION_ID || "";
export const CONVERSATIONS_COLLECTION_ID =
  process.env.EXPO_PUBLIC_CONVERSATIONS_COLLECTION_ID || "";

// Log to verify they're loaded (remove in production)
console.log("DATABASE_ID:", DATABASE_ID);
console.log("ITEMS_COLLECTION_ID:", ITEMS_COLLECTION_ID);
console.log("Platform set to: com.mante.lostandfound");

export default client;