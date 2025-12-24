import { ID, Query } from 'appwrite';
import { account, DATABASE_ID, databases, ENDPOINT, ITEMS_COLLECTION_ID, PROJECT_ID, STORAGE_BUCKET_ID, USERS_COLLECTION_ID } from '../config/appwrite';
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

  const user = await account.get();
  
  const userProfile = await databases.listDocuments(
    DATABASE_ID,
    USERS_COLLECTION_ID,
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
};

export const getAllItems = async () => {
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
};

export const getItemsByType = async (type: 'lost' | 'found') => {
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

  return response.documents;
};


export const getUserItems = async () => {
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

};


export const uploadImage = async (uri: string) => {
  try {
    const fileId = ID.unique();
    
    const filename = uri.split('/').pop() || `image-${Date.now()}.jpg`;
    
    const getMimeType = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        heic: 'image/heic',
        heif: 'image/heif',
        gif: 'image/gif',
        webp: 'image/webp',
      };
      return mimeTypes[ext] || 'image/jpeg';
    };
    
    const mimeType = getMimeType(filename);
    
    const formData = new FormData();
    
    formData.append('fileId', fileId);
    
    formData.append('file', {
      uri: uri,
      name: filename,
      type: mimeType,
    } as any);

    const uploadUrl = `${ENDPOINT}/storage/buckets/${STORAGE_BUCKET_ID}/files`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': PROJECT_ID,
      },
      body: formData,
    });
    
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return `${ENDPOINT}/storage/buckets/${STORAGE_BUCKET_ID}/files/${data.$id}/view?project=${PROJECT_ID}`;
    
  } catch (error: any) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};