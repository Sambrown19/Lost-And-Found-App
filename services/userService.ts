// services/userService.ts

import { ID, Query } from 'appwrite';
import { account, DATABASE_ID, databases, USERS_COLLECTION_ID } from '../config/appwrite';

export interface UserProfile {
  $id?: string;
  userId: string;
  email: string;
  fullName: string;
  studentId: string;
  phoneNumber: string;
  campus: string;
  profileImage?: string;
}

export const createUserProfile = async (data: Omit<UserProfile, 'userId' | '$id'>) => {
  try {
    const user = await account.get();
    
    const profile = await databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        email: data.email,
        fullName: data.fullName,
        studentId: data.studentId,
        phoneNumber: data.phoneNumber,
        campus: data.campus,
        profileImage: data.profileImage || '',
      }
    );
    
    return profile;
  } catch (error) {
    console.error('Create profile error:', error);
    throw error;
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const user = await account.get();
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [
        Query.equal('userId', user.$id)
      ]
    );
    
    if (response.documents.length > 0) {
      return response.documents[0] as any;
    }
    
    return null;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

export const updateUserProfile = async (data: Partial<UserProfile>) => {
  try {
    const profile = await getUserProfile();
    
    if (!profile || !profile.$id) {
      throw new Error('Profile not found');
    }
    
    const updated = await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      profile.$id,
      data
    );
    
    return updated;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

export const uploadProfileImage = async (imageUri: string) => {
  try {
    // For now, return the local URI
    // TODO: Implement Appwrite storage upload in production
    console.log('Saving profile image URI:', imageUri);
    return imageUri;
  } catch (error) {
    console.error('Upload image error:', error);
    throw error;
  }
};

export const getInitials = (name: string): string => {
  if (!name) return '';
  
  const names = name.trim().split(' ').filter(n => n.length > 0);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  
  return names.map(n => n[0].toUpperCase()).join('');
};