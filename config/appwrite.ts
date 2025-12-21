// config/appwrite.ts

import { Account, Client, Databases, Storage } from 'appwrite';

const client = new Client();

client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const DATABASE_ID = process.env.EXPO_PUBLIC_DATABASE_ID || '';
export const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_USERS_COLLECTION_ID || '';
export const ITEMS_COLLECTION_ID = process.env.EXPO_PUBLIC_ITEMS_COLLECTION_ID || '';
export const STORAGE_BUCKET_ID = process.env.EXPO_PUBLIC_STORAGE_BUCKET_ID || '';

export default client;