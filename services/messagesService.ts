// services/messagesService.ts

import { ID, Query } from 'react-native-appwrite';
import { account, CONVERSATIONS_COLLECTION_ID, DATABASE_ID, databases, MESSAGES_COLLECTION_ID } from '../config/appwrite';

export interface Message {
  $id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  message: string;
  itemId?: string;
  itemTitle?: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  $id?: string;
  participants: string[];
  participantNames: string;
  itemId?: string;
  itemTitle?: string;
  itemImage?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

// Get or create conversation between two users
export const getOrCreateConversation = async (
  otherUserId: string,
  otherUserName: string,
  itemId?: string,
  itemTitle?: string,
  itemImage?: string
) => {
  try {
    const user = await account.get();
    const participants = [user.$id, otherUserId].sort(); // Sort to ensure consistent order

    // Check if conversation exists
    const existing = await databases.listDocuments(
      DATABASE_ID,
      CONVERSATIONS_COLLECTION_ID,
      [
        Query.equal('participants', participants)
      ]
    );

    if (existing.documents.length > 0) {
      return existing.documents[0];
    }

    // Create new conversation
    const conversation = await databases.createDocument(
      DATABASE_ID,
      CONVERSATIONS_COLLECTION_ID,
      ID.unique(),
      {
        participants,
        participantNames: `${user.name},${otherUserName}`,
        itemId: itemId || '',
        itemTitle: itemTitle || '',
        itemImage: itemImage || '',
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      }
    );

    return conversation;
  } catch (error) {
    console.error('Get/Create conversation error:', error);
    throw error;
  }
};

// Send a message
export const sendMessage = async (
  conversationId: string,
  receiverId: string,
  receiverName: string,
  messageText: string,
  itemId?: string,
  itemTitle?: string
) => {
  try {
    const user = await account.get();

    const message = await databases.createDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      ID.unique(),
      {
        conversationId,
        senderId: user.$id,
        senderName: user.name,
        receiverId,
        receiverName,
        message: messageText,
        itemId: itemId || '',
        itemTitle: itemTitle || '',
        read: false,
        createdAt: new Date().toISOString(),
      }
    );

    // Update conversation's last message
    await databases.updateDocument(
      DATABASE_ID,
      CONVERSATIONS_COLLECTION_ID,
      conversationId,
      {
        lastMessage: messageText,
        lastMessageTime: new Date().toISOString(),
      }
    );

    return message;
  } catch (error) {
    console.error('Send message error:', error);
    throw error;
  }
};

// Get all conversations for current user
export const getUserConversations = async () => {
  try {
    const user = await account.get();

    const conversations = await databases.listDocuments(
      DATABASE_ID,
      CONVERSATIONS_COLLECTION_ID,
      [
        Query.contains('participants', user.$id),
        Query.orderDesc('lastMessageTime'),
        Query.limit(50)
      ]
    );

    return conversations.documents as any[];
  } catch (error) {
    console.error('Get conversations error:', error);
    throw error;
  }
};

// Get messages for a conversation
export const getConversationMessages = async (conversationId: string) => {
  try {
    const messages = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      [
        Query.equal('conversationId', conversationId),
        Query.orderAsc('createdAt'),
        Query.limit(100)
      ]
    );

    return messages.documents as any[];
  } catch (error) {
    console.error('Get messages error:', error);
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (conversationId: string) => {
  try {
    const user = await account.get();

    const messages = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      [
        Query.equal('conversationId', conversationId),
        Query.equal('receiverId', user.$id),
        Query.equal('read', false)
      ]
    );

    // Mark each unread message as read
    for (const message of messages.documents) {
      await databases.updateDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        message.$id,
        { read: true }
      );
    }
  } catch (error) {
    console.error('Mark as read error:', error);
  }
};