import { ID, Query } from "react-native-appwrite";
import { sendPushNotification } from "./notificationsService";
import {
  account,
  CONVERSATIONS_COLLECTION_ID,
  DATABASE_ID,
  databases,
  MESSAGES_COLLECTION_ID,
  USERS_COLLECTION_ID,
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
  isEdited?: boolean;
  isDeleted?: boolean;
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
  unreadFor?: string;
}

export const sendMessage = async (
  conversationId: string,
  receiverId: string,
  receiverName: string,
  messageText: string,
  itemId?: string,
  itemTitle?: string,
  mediaUrl?: string,
  mediaType?: string,
) => {
  try {
    const user = await account.get();
    
    // Fetch real full name from database instead of email prefix
    const userProfile = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
      Query.equal("userId", user.$id)
    ]);

    const message = await databases.createDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      ID.unique(),
      {
        conversationId,
        senderId: user.$id,
        senderName: userProfile && userProfile.documents.length > 0 ? userProfile.documents[0].fullName || user.name : user.name,
        receiverId,
        receiverName,
        message: messageText,
        itemId: itemId || "",
        itemTitle: itemTitle || "",
        read: false,
        createdAt: new Date().toISOString(),
        mediaUrl: mediaUrl || "",
        mediaType: mediaType || "",
      },
    );

    const conversation = await databases.getDocument(
      DATABASE_ID,
      CONVERSATIONS_COLLECTION_ID,
      conversationId,
    );

    const currentUnread = conversation.unreadFor === receiverId
      ? (conversation.unreadCount || 0) + 1
      : 1;

    await databases.updateDocument(
      DATABASE_ID,
      CONVERSATIONS_COLLECTION_ID,
      conversationId,
      {
        lastMessage: messageText,
        lastMessageTime: new Date().toISOString(),
        unreadCount: currentUnread,
        unreadFor: receiverId,
      },
    );

    await sendPushNotification(
      receiverId,
      userProfile && userProfile.documents.length > 0 ? userProfile.documents[0].fullName || user.name : user.name,
      messageText,
      conversationId,
    );

    return message;
  } catch (error) {
    console.error("Send message error:", error);
    throw error;
  }
};
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

    // Fetch current user's fullName from users collection
    const currentUserProfile = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal("userId", user.$id)],
    );
    const currentUserName = currentUserProfile.documents.length > 0
      ? currentUserProfile.documents[0].fullName
      : user.name; // fallback to auth name

    const unsorted = [
      { id: user.$id, name: currentUserName },
      { id: otherUserId, name: otherUserName },
    ];
    const sorted = unsorted.sort((a, b) => a.id.localeCompare(b.id));

    const participants = sorted.map((p) => p.id);
    const participantNames = sorted.map((p) => p.name).join(",");

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
      // Update participantNames in case they changed
      await databases.updateDocument(
        DATABASE_ID,
        CONVERSATIONS_COLLECTION_ID,
        existingConversations.documents[0].$id,
        { participantNames },
      );
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
        unreadFor: "",
      },
    );

    return conversation;
  } catch (error) {
    console.error("Get/Create conversation error:", error);
    throw error;
  }
};

export const getUserConversations = async () => {
  try {
    const user = await account.get();
    console.log("Current user ID:", user.$id);

    const conversations = await databases.listDocuments(
      DATABASE_ID,
      CONVERSATIONS_COLLECTION_ID,
      [Query.orderDesc("lastMessageTime"), Query.limit(100)],
    );

    const userConversations = conversations.documents.filter((conv) => {
      if (conv.participants && Array.isArray(conv.participants)) {
        return conv.participants.includes(user.$id);
      }
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

export const markMessagesAsRead = async (conversationId: string) => {
  try {
    const user = await account.get();

    const messages = await databases.listDocuments(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      [
        Query.equal("conversationId", conversationId),
        Query.equal("receiverId", user.$id),
        Query.equal("read", false),
      ],
    );

    for (const message of messages.documents) {
      await databases.updateDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        message.$id,
        { read: true },
      );
    }

    const conversation = await databases.getDocument(
      DATABASE_ID,
      CONVERSATIONS_COLLECTION_ID,
      conversationId,
    );

    if (conversation.unreadFor === user.$id) {
      await databases.updateDocument(
        DATABASE_ID,
        CONVERSATIONS_COLLECTION_ID,
        conversationId,
        { unreadCount: 0, unreadFor: "" },
      );
    }
  } catch (error) {
    console.error("Mark as read error:", error);
  }
};

export const deleteMessage = async (messageId: string, conversationId?: string) => {
  try {
    const deletedText = "This message was deleted";
    await databases.updateDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      messageId,
      {
        message: deletedText,
        isDeleted: true,
        mediaUrl: "",
        mediaType: "",
      },
    );

    // Keep the conversation preview in sync if this was the last message
    if (conversationId) {
      try {
        const latestMessages = await databases.listDocuments(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          [
            Query.equal("conversationId", conversationId),
            Query.orderDesc("createdAt"),
            Query.limit(1)
          ]
        );
        
        if (latestMessages.documents.length > 0 && latestMessages.documents[0].$id === messageId) {
          await databases.updateDocument(DATABASE_ID, CONVERSATIONS_COLLECTION_ID, conversationId, {
            lastMessage: deletedText,
          });
        }
      } catch {
        // Non-critical — don't throw
      }
    }
  } catch (error) {
    console.error("Delete message error:", error);
    throw error;
  }
};

export const editMessage = async (messageId: string, newText: string, conversationId?: string) => {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      messageId,
      {
        message: newText,
        isEdited: true,
      },
    );

    // Keep the conversation preview in sync if this was the last message
    if (conversationId) {
      try {
        const latestMessages = await databases.listDocuments(
          DATABASE_ID,
          MESSAGES_COLLECTION_ID,
          [
            Query.equal("conversationId", conversationId),
            Query.orderDesc("createdAt"),
            Query.limit(1)
          ]
        );
        
        if (latestMessages.documents.length > 0 && latestMessages.documents[0].$id === messageId) {
          await databases.updateDocument(DATABASE_ID, CONVERSATIONS_COLLECTION_ID, conversationId, {
            lastMessage: newText,
          });
        }
      } catch {
        // Non-critical — don't throw
      }
    }
  } catch (error) {
    console.error("Edit message error:", error);
    throw error;
  }
};