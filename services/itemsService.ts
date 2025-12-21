// services/itemsService.ts

import { ID, Query } from 'appwrite';
import { account, DATABASE_ID, databases, ITEMS_COLLECTION_ID } from '../config/appwrite';

export interface Item {
  $id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  images: string;
  status: 'active' | 'claimed' | 'resolved';
  createdAt: string;
}

export const createItem = async (data: Omit<Item, '$id' | 'userId' | 'userName' | 'userEmail' | 'createdAt'>) => {
  try {
    const user = await account.get();
    
    // Get user profile for name
    const userProfile = await databases.listDocuments(
      DATABASE_ID,
      'EXPO_PUBLIC_USERS_COLLECTION_ID',
      [Query.equal('userId', user.$id)]
    );
    
    const userName = userProfile.documents[0]?.fullName || 'Anonymous';
    
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
      }
    );
    
    return item;
  } catch (error) {
    console.error('Create item error:', error);
    throw error;
  }
};

export const getAllItems = async () => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      [
        Query.equal('status', 'active'),
        Query.orderDesc('createdAt'),
        Query.limit(50)
      ]
    );
    
    return response.documents as any[];
  } catch (error) {
    console.error('Get items error:', error);
    throw error;
  }
};

export const getItemsByType = async (type: 'lost' | 'found') => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      [
        Query.equal('type', type),
        Query.equal('status', 'active'),
        Query.orderDesc('createdAt'),
        Query.limit(50)
      ]
    );
    
    return response.documents as any[];
  } catch (error) {
    console.error('Get items by type error:', error);
    throw error;
  }
};

export const getUserItems = async () => {
  try {
    const user = await account.get();
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      ITEMS_COLLECTION_ID,
      [
        Query.equal('userId', user.$id),
        Query.orderDesc('createdAt')
      ]
    );
    
    return response.documents as any[];
  } catch (error) {
    console.error('Get user items error:', error);
    throw error;
  }
};