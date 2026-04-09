// app/chat/[id].tsx

import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { account, DATABASE_ID, CONVERSATIONS_COLLECTION_ID, databases } from "../../config/appwrite";
import {
  getConversationMessages,
  markMessagesAsRead,
  sendMessage,
} from "../../services/messagesService";

const getInitials = (name: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function ChatDetailScreen() {
  const { colors } = useTheme();
  const { id, itemId, itemTitle, itemImage } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [otherUserId, setOtherUserId] = useState("");
  const [otherUserName, setOtherUserName] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initChat();

    const interval = setInterval(() => {
      if (id) loadMessages(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  const initChat = async () => {
    try {
      const user = await account.get();
      setCurrentUserId(user.$id);

      // Load conversation to derive the other user dynamically
      const conversation = await databases.getDocument(
        DATABASE_ID,
        CONVERSATIONS_COLLECTION_ID,
        id as string,
      );

      const participants: string[] = conversation.participants;
      const participantNames: string[] = conversation.participantNames.split(",");

      const otherIndex = participants[0] === user.$id ? 1 : 0;
      setOtherUserId(participants[otherIndex]);
      setOtherUserName(participantNames[otherIndex]);

      await loadMessages();
    } catch (error) {
      console.error("Init chat error:", error);
    }
  };

  const loadMessages = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await getConversationMessages(id as string);
      setMessages(data);
      await markMessagesAsRead(id as string);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error("Load messages error:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      await sendMessage(
        id as string,
        otherUserId,
        otherUserName,
        messageText,
        itemId as string,
        itemTitle as string,
      );

      await loadMessages(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Send message error:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMyMessage = item.senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        {!isMyMessage && (
          <View style={[styles.senderAvatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.senderAvatarText, { color: colors.white }]}>
              {getInitials(item.senderName)}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isMyMessage
              ? [styles.myMessageBubble, { backgroundColor: colors.primary }]
              : [styles.theirMessageBubble, { backgroundColor: colors.white }],
          ]}
        >
          {!isMyMessage && (
            <Text style={[styles.senderName, { color: colors.textSecondary }]}>
              {item.senderName}
            </Text>
          )}
          <Text
            style={[
              styles.messageText,
              isMyMessage
                ? { color: colors.white }
                : { color: colors.textPrimary },
            ]}
          >
            {item.message}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isMyMessage
                  ? { color: "rgba(255, 255, 255, 0.7)" }
                  : { color: colors.textLight },
              ]}
            >
              {formatTime(item.createdAt)}
            </Text>
            {isMyMessage && (
              <Ionicons
                name={item.read ? "checkmark-done" : "checkmark"}
                size={14}
                color={item.read ? "#4CAF50" : "rgba(255, 255, 255, 0.7)"}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    if (!itemTitle) return null;

    const imageUrl = itemImage
      ? Array.isArray(itemImage) ? itemImage[0] : itemImage
      : null;

    return (
      <TouchableOpacity
        style={[styles.itemInfoCard, { backgroundColor: colors.white }]}
        onPress={() => {
          if (itemId) router.push(`/item/${itemId}` as any);
        }}
      >
        {imageUrl && (
          <Image source={{ uri: imageUrl as string }} style={styles.itemImage} />
        )}
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {itemTitle}
          </Text>
          <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
            Lost Item
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/messages")}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => {
            if (otherUserId) {
              router.push({
                pathname: "/profile",
                params: { id: otherUserId },
              });
            }
          }}
        >
          <View style={[styles.headerAvatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.headerAvatarText, { color: colors.white }]}>
              {getInitials(otherUserName)}
            </Text>
          </View>
          <View>
            <Text style={[styles.headerName, { color: colors.textPrimary }]}>
              {otherUserName || "..."}
            </Text>
            <Text style={[styles.headerStatus, { color: "#4CAF50" }]}>Online</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={styles.messagesList}
        ListHeaderComponent={renderHeader}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={50} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No messages yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Start the conversation by sending a message
            </Text>
          </View>
        }
      />

      <View style={styles.safetyReminder}>
        <Ionicons name="warning-outline" size={16} color="#FF9800" />
        <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
          Keep all communications in-app until ownership is verified
        </Text>
      </View>

      <View style={[styles.inputContainer, { backgroundColor: colors.white, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>

        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Ask about the item..."
          placeholderTextColor={colors.textLight}
          multiline
          maxLength={500}
          editable={!sending}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.primary },
            (!newMessage.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={sending || !newMessage.trim()}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="send" size={20} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 15, paddingTop: 50, paddingBottom: 15, borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  headerAvatarText: { fontSize: 16, fontWeight: "700" },
  headerName: { fontSize: 16, fontWeight: "600" },
  headerStatus: { fontSize: 12 },
  moreButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  messagesList: { padding: 15, paddingBottom: 5, flexGrow: 1 },
  itemInfoCard: {
    flexDirection: "row", borderRadius: 12, padding: 12,
    marginBottom: 20, gap: 12, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  itemImage: { width: 50, height: 50, borderRadius: 8 },
  itemInfo: { flex: 1, justifyContent: "center" },
  itemTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  itemSubtitle: { fontSize: 12 },
  messageContainer: { flexDirection: "row", marginBottom: 15, gap: 8 },
  myMessageContainer: { justifyContent: "flex-end" },
  theirMessageContainer: { justifyContent: "flex-start" },
  senderAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", alignSelf: "flex-end" },
  senderAvatarText: { fontSize: 12, fontWeight: "700" },
  messageBubble: { maxWidth: "75%", borderRadius: 16, padding: 10 },
  myMessageBubble: { borderBottomRightRadius: 4 },
  theirMessageBubble: {
    borderBottomLeftRadius: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  senderName: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageFooter: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 4 },
  messageTime: { fontSize: 10 },
  emptyState: { paddingVertical: 60, alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptyText: { fontSize: 14, textAlign: "center" },
  safetyReminder: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    paddingHorizontal: 15, paddingVertical: 10, gap: 8,
  },
  safetyText: { flex: 1, fontSize: 11 },
  inputContainer: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 15, paddingVertical: 10, borderTopWidth: 1, gap: 10,
  },
  attachButton: { marginBottom: 5 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendButton: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  sendButtonDisabled: { opacity: 0.5 },
});