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
  Modal,
  Linking,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { account, DATABASE_ID, CONVERSATIONS_COLLECTION_ID, databases, storage, STORAGE_BUCKET_ID, USERS_COLLECTION_ID } from "../../config/appwrite";
import { ID, Query } from "react-native-appwrite";
import {
  getConversationMessages,
  markMessagesAsRead,
  sendMessage,
} from "../../services/messagesService";

const getInitials = (name: string) => {
  if (!name) return "?";
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
};

const formatLastSeen = (lastSeen: string | null) => {
  if (!lastSeen) return "Offline";
  
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Online now";
  if (diffMins < 60) return `Last seen ${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `Last seen ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays === 1) return "Last seen yesterday";
  return `Last seen ${diffDays} days ago`;
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
  const [otherUserImage, setOtherUserImage] = useState("");
  const [otherUserStatus, setOtherUserStatus] = useState("");
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const flatListRef = useRef<FlatList>(null);
 const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initChat();
    const interval = setInterval(() => {
      if (id) loadMessages(false);
    }, 3000);
    return () => {
      clearInterval(interval);
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    };
  }, [id]);

  const fetchUserProfileAndStatus = async (userId: string) => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal("userId", userId)]
      );
      const userDoc = response.documents[0];
      return {
        profileImage: userDoc?.profileImage || "",
        lastActive: userDoc?.lastActive || null,
        isOnline: userDoc?.isOnline || false,
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      return { profileImage: "", lastActive: null, isOnline: false };
    }
  };

  const updateUserStatus = async (isOnline: boolean) => {
    try {
      const user = await account.get();
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal("userId", user.$id)]
      );
      
      if (response.documents.length > 0) {
        await databases.updateDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          response.documents[0].$id,
          {
            isOnline,
            lastActive: new Date().toISOString(),
          }
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusText = (isOnline: boolean, lastActive: string | null) => {
    if (isOnline) return "Online";
    return formatLastSeen(lastActive);
  };

  const initChat = async () => {
    try {
      const user = await account.get();
      setCurrentUserId(user.$id);

      // Update current user as online
      await updateUserStatus(true);

      const conversation = await databases.getDocument(
        DATABASE_ID,
        CONVERSATIONS_COLLECTION_ID,
        id as string,
      );

      const participants: string[] = conversation.participants;
      const participantNames: string[] = conversation.participantNames.split(",");
      const otherIndex = participants[0] === user.$id ? 1 : 0;
      const otherId = participants[otherIndex];
      setOtherUserId(otherId);
      setOtherUserName(participantNames[otherIndex]);

      // Fetch other user's profile image and status
      const { profileImage, lastActive, isOnline } = await fetchUserProfileAndStatus(otherId);
      setOtherUserImage(profileImage);
      setOtherUserStatus(getStatusText(isOnline, lastActive));

      // Start polling for status updates every 30 seconds
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = setInterval(async () => {
        const { lastActive: newLastActive, isOnline: newIsOnline } = await fetchUserProfileAndStatus(otherId);
        setOtherUserStatus(getStatusText(newIsOnline, newLastActive));
      }, 30000);

      if (conversation.unreadFor === user.$id && conversation.unreadCount > 0) {
        await markMessagesAsRead(id as string);
      }

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
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error("Load messages error:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const uploadMediaToAppwrite = async (uri: string, fileName: string, mimeType: string) => {
    // Use the exact same pattern that works on report-lost & profile upload:
    // just pass the raw URI with size:0 — the SDK handles it.
    const name = fileName || `file_${Date.now()}.jpg`;
    const type = mimeType || "image/jpeg";

    console.log(`[Upload] URI: ${uri}, name: ${name}, type: ${type}`);

    const file = {
      uri: uri,
      name: name,
      type: type,
      size: 0,
    };

    try {
      const result = await storage.createFile(STORAGE_BUCKET_ID, ID.unique(), file);
      const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
      const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
      const url = `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${result.$id}/view?project=${projectId}`;
      console.log("[Upload] Success:", url);
      return url;
    } catch (err: any) {
      console.error("[Upload] Appwrite Error:", JSON.stringify(err));
      throw err;
    }
  };

  // Helper: close the media options modal and wait for iOS to fully dismiss it
  // before presenting another native modal (image picker / camera).
  const closeModalAndWait = (): Promise<void> => {
    setShowMediaOptions(false);
    return new Promise((resolve) => setTimeout(resolve, 600));
  };

  const handlePickImage = async () => {
    try {
      await closeModalAndWait();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const name = asset.fileName || `img_${Date.now()}.jpg`;
        const type = asset.mimeType || "image/jpeg";
        console.log("[Gallery] Picked image:", asset.uri);
        await sendMediaMessage(asset.uri, name, type, "image");
      }
    } catch (error: any) {
      console.error("Pick Image Error:", error);
      Alert.alert("Error", "Failed to pick image: " + (error?.message || 'Unknown error'));
    }
  };

  const handlePickVideo = async () => {
    try {
      await closeModalAndWait();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const name = asset.fileName || `vid_${Date.now()}.mp4`;
        const type = asset.mimeType || "video/mp4";
        console.log("[Gallery] Picked video:", asset.uri);
        await sendMediaMessage(asset.uri, name, type, "video");
      }
    } catch (error: any) {
      console.error("Pick Video Error:", error);
      Alert.alert("Error", "Failed to pick video: " + (error?.message || 'Unknown error'));
    }
  };

  const handleTakePhoto = async () => {
    try {
      await closeModalAndWait();

      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Access Required',
          'Please allow camera access to take photos. You can enable it in your device Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const name = asset.fileName || `photo_${Date.now()}.jpg`;
        const type = asset.mimeType || "image/jpeg";
        await sendMediaMessage(asset.uri, name, type, "image");
      }
    } catch (error: any) {
      console.error("Camera Error:", error);
      Alert.alert("Error", "Failed to open camera: " + (error?.message || 'Unknown error'));
    }
  };

  const sendMediaMessage = async (
    uri: string,
    fileName: string,
    mimeType: string,
    mediaType: "image" | "video",
  ) => {
    setUploadingMedia(true);
    try {
      const mediaUrl = await uploadMediaToAppwrite(uri, fileName, mimeType);

      await sendMessage(
        id as string,
        otherUserId,
        otherUserName,
        mediaType === "image" ? "📷 Image" : "🎥 Video",
        itemId as string,
        itemTitle as string,
        mediaUrl,
        mediaType,
      );

      await loadMessages(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error("Send media error:", error);
      Alert.alert("Upload Failed", error?.message || JSON.stringify(error) || "Failed to send media");
    } finally {
      setUploadingMedia(false);
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
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const renderMediaContent = (item: any) => {
    const isMyMessage = item.senderId === currentUserId;

    if (item.mediaType === "image") {
      return (
        <TouchableOpacity onPress={() => Alert.alert("Image", item.mediaUrl)}>
          <Image
            source={{ uri: item.mediaUrl }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    if (item.mediaType === "video") {
      return (
        <TouchableOpacity
          style={[styles.fileContainer, { backgroundColor: isMyMessage ? "rgba(255,255,255,0.2)" : colors.gray }]}
          onPress={() => Alert.alert("Video", "Video playback coming soon")}
        >
          <Ionicons name="play-circle" size={40} color={isMyMessage ? colors.white : colors.primary} />
          <Text style={[styles.fileName, { color: isMyMessage ? colors.white : colors.textPrimary }]}>
            Video
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMyMessage = item.senderId === currentUserId;
    const hasMedia = !!item.mediaUrl;

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
            hasMedia && styles.mediaBubble,
          ]}
        >
          {!isMyMessage && (
            <Text style={[styles.senderName, { color: colors.textSecondary }]}>
              {item.senderName}
            </Text>
          )}

          {hasMedia && renderMediaContent(item)}

          {!hasMedia && (
            <Text style={[styles.messageText, isMyMessage ? { color: colors.white } : { color: colors.textPrimary }]}>
              {item.message}
            </Text>
          )}

          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMyMessage ? { color: "rgba(255, 255, 255, 0.7)" } : { color: colors.textLight }]}>
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
    const imageUrl = itemImage ? (Array.isArray(itemImage) ? itemImage[0] : itemImage) : null;

    return (
      <TouchableOpacity
        style={[styles.itemInfoCard, { backgroundColor: colors.white }]}
        onPress={() => { if (itemId) router.push(`/item/${itemId}` as any); }}
      >
        {imageUrl && <Image source={{ uri: imageUrl as string }} style={styles.itemImage} />}
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: colors.textPrimary }]} numberOfLines={1}>{itemTitle}</Text>
          <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>Lost Item</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>
    );
  };

  // Update user status when component unmounts
  useEffect(() => {
    return () => {
      updateUserStatus(false);
    };
  }, []);

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
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/messages")}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => {
            if (otherUserId) {
              router.push({ pathname: "/profile", params: { id: otherUserId } });
            }
          }}
        >
          {otherUserImage ? (
            <Image source={{ uri: otherUserImage }} style={styles.headerAvatarImage} />
          ) : (
            <View style={[styles.headerAvatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.headerAvatarText, { color: colors.white }]}>
                {getInitials(otherUserName)}
              </Text>
            </View>
          )}
          <View>
            <Text style={[styles.headerName, { color: colors.textPrimary }]}>{otherUserName || "..."}</Text>
            <Text style={[styles.headerStatus, { color: otherUserStatus === "Online" ? "#4CAF50" : colors.textLight }]}>
              {otherUserStatus}
            </Text>
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
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => setShowMediaOptions(true)}
          disabled={uploadingMedia}
        >
          {uploadingMedia ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
          )}
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

      <Modal
        visible={showMediaOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMediaOptions(false)}
      >
        <View style={styles.modalContentWrapper}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setShowMediaOptions(false)} 
          />
          <View style={[styles.mediaOptionsContainer, { backgroundColor: colors.white }]}>
            <Text style={[styles.mediaOptionsTitle, { color: colors.textPrimary }]}>
              Send Media
            </Text>

            <View style={styles.mediaOptionsGrid}>
              <TouchableOpacity style={[styles.mediaOption, { backgroundColor: colors.gray }]} onPress={handleTakePhoto}>
                <Ionicons name="camera" size={28} color={colors.primary} />
                <Text style={[styles.mediaOptionText, { color: colors.textPrimary }]}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.mediaOption, { backgroundColor: colors.gray }]} onPress={handlePickImage}>
                <Ionicons name="image" size={28} color={colors.primary} />
                <Text style={[styles.mediaOptionText, { color: colors.textPrimary }]}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.mediaOption, { backgroundColor: colors.gray }]} onPress={handlePickVideo}>
                <Ionicons name="videocam" size={28} color={colors.primary} />
                <Text style={[styles.mediaOptionText, { color: colors.textPrimary }]}>Video</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.gray }]}
              onPress={() => setShowMediaOptions(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerAvatarImage: { width: 40, height: 40, borderRadius: 20 },
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
  mediaBubble: { padding: 4 },
  myMessageBubble: { borderBottomRightRadius: 4 },
  theirMessageBubble: {
    borderBottomLeftRadius: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  senderName: { fontSize: 11, fontWeight: "600", marginBottom: 4, paddingHorizontal: 6 },
  messageText: { fontSize: 15, lineHeight: 20 },
  mediaImage: { width: 200, height: 200, borderRadius: 12 },
  fileContainer: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 10, borderRadius: 12, minWidth: 150,
  },
  fileName: { fontSize: 13, fontWeight: "500", flex: 1 },
  messageFooter: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-end",
    gap: 4, marginTop: 4, paddingHorizontal: 6,
  },
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
  modalContentWrapper: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalOverlay: {
    flex: 1, backgroundColor: "transparent",
  },
  mediaOptionsContainer: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  mediaOptionsTitle: { fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  mediaOptionsGrid: {
    flexDirection: "row", justifyContent: "space-around", marginBottom: 20,
  },
  mediaOption: {
    alignItems: "center", justifyContent: "center",
    width: 70, height: 70, borderRadius: 16, gap: 6,
  },
  mediaOptionText: { fontSize: 12, fontWeight: "500" },
  cancelButton: {
    paddingVertical: 14, borderRadius: 12, alignItems: "center",
  },
  cancelButtonText: { fontSize: 15, fontWeight: "600" },
});