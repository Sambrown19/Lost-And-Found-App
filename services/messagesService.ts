import { ID, Query } from "react-native-appwrite";
import {
  account,
  CONVERSATIONS_COLLECTION_ID,
  DATABASE_ID,
  databases,
  MESSAGES_COLLECTION_ID,
} from "../config/appwrite";

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

// Send a message
export const sendMessage = async (
  conversationId: string,
  receiverId: string,
  receiverName: string,
  messageText: string,
  itemId?: string,
  itemTitle?: string,
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
        itemId: itemId || "",
        itemTitle: itemTitle || "",
        read: false,
        createdAt: new Date().toISOString(),
      },
    );

    // Update conversation's last message and increment unread count for receiver
    const conversation = await databases.getDocument(
      DATABASE_ID,
      CONVERSATIONS_COLLECTION_ID,
      conversationId,
    );

    await databases.updateDocument(
      DATABASE_ID,
      CONVERSATIONS_COLLECTION_ID,
      conversationId,
      {
        lastMessage: messageText,
        lastMessageTime: new Date().toISOString(),
        unreadCount: (conversation.unreadCount || 0) + 1,
      },
    );

    return message;
  } catch (error) {
    console.error("Send message error:", error);
    throw error;
  }
};

// services/messagesService.ts

export const getOrCreateConversation = async (
  otherUserId: string,
  otherUserName: string,
  itemId?: string,
  itemTitle?: string,
  itemImage?: string,
) => {
  try {
    const user = await account.get();

    if (user.$id === otherUserId) {
      throw new Error("You cannot start a conversation with yourself.");
    }

    // Sort participants for consistency
    const unsorted = [
      { id: user.$id, name: user.name },
      { id: otherUserId, name: otherUserName },
    ];
    const sorted = unsorted.sort((a, b) => a.id.localeCompare(b.id));

    const participants = sorted.map((p) => p.id);
    const participantNames = sorted.map((p) => p.name).join(",");

    // Check if conversation exists for this specific item
    const queries = [
      Query.contains("participants", participants[0]),
      Query.contains("participants", participants[1]),
      Query.limit(10),
    ];

    if (itemId) {
      queries.push(Query.equal("itemId", itemId));
    }

    const existingConversations = await databases.listDocuments(
      DATABASE_ID,
      CONVERSATIONS_COLLECTION_ID,
      queries,
    );

    if (existingConversations.documents.length > 0) {
      return existingConversations.documents[0];
    }

    const conversation = await databases.createDocument(
      DATABASE_ID,
      CONVERSATIONS_COLLECTION_ID,
      ID.unique(),
      {
        participants,
        participantNames,
        itemId: itemId || "",
        itemTitle: itemTitle || "",
        itemImage: itemImage || "",
        lastMessage: "",
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      },
    );

    return conversation;
  } catch (error) {
    console.error("Get/Create conversation error:", error);
    throw error;
  }
};

// Updated getUserConversations - Remove participantIds reference
export const getUserConversations = async () => {
  try {
    const user = await account.get();
    console.log("Current user ID:", user.$id);

    // Get all conversations
    const conversations = await databases.listDocuments(
      DATABASE_ID,
      CONVERSATIONS_COLLECTION_ID,
      [Query.orderDesc("lastMessageTime"), Query.limit(100)],
    );

    // Filter to only show conversations where user is a participant
    const userConversations = conversations.documents.filter((conv) => {
      if (conv.participants && Array.isArray(conv.participants)) {
        return conv.participants.includes(user.$id);
      }

      // Handle participants as string (if stored that way)
      if (conv.participants && typeof conv.participants === "string") {
        return conv.participants.includes(user.$id);
      }

      return false;
    });

    console.log(`Found ${userConversations.length} conversations for user`);
    return userConversations;
  } catch (error) {
    console.error("Get conversations error:", error);
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
        Query.equal("conversationId", conversationId),
        Query.orderAsc("createdAt"),
        Query.limit(100),
      ],
    );

    return messages.documents;
  } catch (error) {
    console.error("Get messages error:", error);
    throw error;
  }
};

// Mark messages as read for a conversation
export const markMessagesAsRead = async (conversationId: string) => {
  try {
    const user = await account.get();

    // Get unread messages where current user is receiver
    const messages = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      [
        Query.equal("conversationId", conversationId),
        Query.equal("receiverId", user.$id),
        Query.equal("read", false),
      ],
    );

    // Mark each unread message as read
    for (const message of messages.documents) {
      await databases.updateDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        message.$id,
        { read: true },
      );
    }

    // Reset unread count in conversation
    await databases.updateDocument(
      DATABASE_ID,
      CONVERSATIONS_COLLECTION_ID,
      conversationId,
      { unreadCount: 0 },
    );
  } catch (error) {
    console.error("Mark as read error:", error);
  }
};
