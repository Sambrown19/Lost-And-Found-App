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
  Dimensions,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import * as ImagePicker from "expo-image-picker";
import { account, DATABASE_ID, CONVERSATIONS_COLLECTION_ID, databases, storage, STORAGE_BUCKET_ID, USERS_COLLECTION_ID } from "../../config/appwrite";
import { ID, Query } from "react-native-appwrite";
import {
  getConversationMessages,
  markMessagesAsRead,
  sendMessage,
  deleteMessage,
  editMessage,
} from "../../services/messagesService";

const getInitials = (name: string) => {
  if (!name) return "?";
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
};

// Sub-component for expo-video so the hook is always called unconditionally
function VideoPlayerModal({ uri }: { uri: string }) {
  const player = useVideoPlayer({ uri }, (p) => {
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: "80%" }}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

const formatLastSeen = (lastSeen: string | null) => {
  if (!lastSeen) return "Offline";
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Online now";
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;
  if (diffDays === 1) return "Last seen yesterday";
  return `Last seen ${diffDays}d ago`;
};

export default function ChatDetailScreen() {
  const { colors } = useTheme();
  const { id, itemId, itemTitle, itemImage } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [viewImageUri, setViewImageUri] = useState<string | null>(null);
  const [viewVideoUri, setViewVideoUri] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [otherUserId, setOtherUserId] = useState("");
  const [otherUserName, setOtherUserName] = useState("");
  const [otherUserImage, setOtherUserImage] = useState("");
  const [otherUserStatus, setOtherUserStatus] = useState("");
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Edit / Delete state
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track whether user is near the bottom so polling doesn't hijack scroll position
  const isAtBottom = useRef(true);

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
          { isOnline, lastActive: new Date().toISOString() }
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

      const { profileImage, lastActive, isOnline } = await fetchUserProfileAndStatus(otherId);
      setOtherUserImage(profileImage);
      setOtherUserStatus(getStatusText(isOnline, lastActive));

      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = setInterval(async () => {
        const { lastActive: la, isOnline: io } = await fetchUserProfileAndStatus(otherId);
        setOtherUserStatus(getStatusText(io, la));
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
      // Only auto-scroll if user is already at (or near) the bottom
      if (isAtBottom.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error("Load messages error:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const uploadMediaToAppwrite = async (uri: string, fileName: string, mimeType: string) => {
    const isVideo = mimeType?.includes("video");
    const name = `file_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
    const type = mimeType || "image/jpeg";
    const file = { uri, name, type, size: 0 };
    const result = await storage.createFile(STORAGE_BUCKET_ID, ID.unique(), file);
    const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
    return `${endpoint}/storage/buckets/${STORAGE_BUCKET_ID}/files/${result.$id}/view?project=${projectId}`;
  };

  const closeModalAndWait = (): Promise<void> => {
    setShowMediaOptions(false);
    return new Promise((resolve) => setTimeout(resolve, 600));
  };

  const handlePickImage = async () => {
    try {
      await closeModalAndWait();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: false, quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        await sendMediaMessage(asset.uri, asset.fileName || `img_${Date.now()}.jpg`, asset.mimeType || "image/jpeg", "image");
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to pick image: " + (error?.message || 'Unknown error'));
    }
  };

  const handlePickVideo = async () => {
    try {
      await closeModalAndWait();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'], allowsEditing: false, quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        await sendMediaMessage(asset.uri, asset.fileName || `vid_${Date.now()}.mp4`, asset.mimeType || "video/mp4", "video");
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to pick video: " + (error?.message || 'Unknown error'));
    }
  };

  const handleTakePhoto = async () => {
    try {
      await closeModalAndWait();
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Access Required', 'Please allow camera access in Settings.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        await sendMediaMessage(asset.uri, asset.fileName || `photo_${Date.now()}.jpg`, asset.mimeType || "image/jpeg", "image");
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to open camera: " + (error?.message || 'Unknown error'));
    }
  };

  const sendMediaMessage = async (uri: string, fileName: string, mimeType: string, mediaType: "image" | "video") => {
    setUploadingMedia(true);
    try {
      const mediaUrl = await uploadMediaToAppwrite(uri, fileName, mimeType);
      await sendMessage(
        id as string, otherUserId, otherUserName,
        mediaType === "image" ? "📷 Image" : "🎥 Video",
        itemId as string, itemTitle as string, mediaUrl, mediaType,
      );
      await loadMessages(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: any) {
      Alert.alert("Upload Failed", error?.message || "Failed to send media");
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
        id as string, otherUserId, otherUserName, messageText,
        itemId as string, itemTitle as string,
      );
      await loadMessages(false);
      // Always scroll after the user sends — they want to see their new message
      isAtBottom.current = true;
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      Alert.alert("Error", "Failed to send message. Please try again.");
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  // Long-press handler — shows actions menu for sender's own non-deleted messages
  const handleLongPress = (item: any) => {
    if (item.senderId !== currentUserId) return;
    if (item.isDeleted) return;
    setSelectedMessage(item);
    setShowMessageActions(true);
  };

  const handleDelete = () => {
    setShowMessageActions(false);
    
    if (selectedMessage) {
      const ageMs = Date.now() - new Date(selectedMessage.createdAt).getTime();
      if (ageMs > 5 * 60 * 1000) {
        setTimeout(() => {
          Alert.alert("Cannot Delete", "You can only delete messages within 5 minutes of sending.");
        }, 300);
        return;
      }
    }

    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMessage(selectedMessage.$id, id as string);
              await loadMessages(false);
            } catch {
              Alert.alert("Error", "Failed to delete message.");
            }
          },
        },
      ]
    );
  };

  const handleEditPress = () => {
    setShowMessageActions(false);
    
    if (selectedMessage) {
      const ageMs = Date.now() - new Date(selectedMessage.createdAt).getTime();
      if (ageMs > 5 * 60 * 1000) {
        setTimeout(() => {
          Alert.alert("Cannot Edit", "You can only edit messages within 5 minutes of sending.");
        }, 300);
        return;
      }
    }

    setEditText(selectedMessage?.message || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || editText.trim() === selectedMessage?.message) {
      setShowEditModal(false);
      return;
    }
    setSavingEdit(true);
    try {
      await editMessage(selectedMessage.$id, editText.trim(), id as string);
      await loadMessages(false);
      setShowEditModal(false);
    } catch {
      Alert.alert("Error", "Failed to edit message.");
    } finally {
      setSavingEdit(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    if (days === 1) return "Yesterday";
    if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderMediaContent = (item: any) => {
    const isMyMessage = item.senderId === currentUserId;
    if (item.mediaType === "image") {
      return (
        <TouchableOpacity onPress={() => setViewImageUri(item.mediaUrl)}>
          <Image source={{ uri: item.mediaUrl }} style={styles.mediaImage} resizeMode="cover" />
        </TouchableOpacity>
      );
    }
    if (item.mediaType === "video") {
      return (
        <TouchableOpacity
          style={[styles.fileContainer, { backgroundColor: isMyMessage ? "rgba(255,255,255,0.2)" : colors.gray }]}
          onPress={() => setViewVideoUri(item.mediaUrl)}
        >
          <Ionicons name="play-circle" size={40} color={isMyMessage ? colors.white : colors.primary} />
          <Text style={[styles.fileName, { color: isMyMessage ? colors.white : colors.textPrimary }]}>Video</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMyMessage = item.senderId === currentUserId;
    const hasMedia = !!item.mediaUrl && !item.isDeleted;
    const isDeleted = !!item.isDeleted;
    const isEdited = !!item.isEdited && !isDeleted;

    return (
      <TouchableOpacity
        activeOpacity={isMyMessage && !isDeleted ? 0.75 : 1}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={350}
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        {/* Other user avatar */}
        {!isMyMessage && (
          otherUserImage ? (
            <Image source={{ uri: otherUserImage }} style={styles.senderAvatarImage} />
          ) : (
            <View style={[styles.senderAvatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.senderAvatarText, { color: colors.white }]}>
                {getInitials(item.senderName)}
              </Text>
            </View>
          )
        )}

        <View
          style={[
            styles.messageBubble,
            isMyMessage
              ? [styles.myMessageBubble, { backgroundColor: isDeleted ? colors.gray : colors.primary }]
              : [styles.theirMessageBubble, { backgroundColor: colors.white }],
            hasMedia && styles.mediaBubble,
          ]}
        >
          {/* Deleted message */}
          {isDeleted && (
            <View style={styles.deletedRow}>
              <Ionicons name="ban-outline" size={13} color={colors.textLight} />
              <Text style={[styles.deletedText, { color: colors.textLight }]}>
                {isMyMessage ? "You deleted this message" : "This message was deleted"}
              </Text>
            </View>
          )}

          {/* Normal message */}
          {!isDeleted && (
            <>
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
            </>
          )}

          {/* Footer: time + read + edited */}
          <View style={styles.messageFooter}>
            {isEdited && (
              <Text style={[styles.editedLabel, { color: isMyMessage ? "rgba(255,255,255,0.6)" : colors.textLight }]}>
                edited
              </Text>
            )}
            {!isDeleted && (
              <Text style={[styles.messageTime, isMyMessage ? { color: "rgba(255,255,255,0.7)" } : { color: colors.textLight }]}>
                {formatTime(item.createdAt)}
              </Text>
            )}
            {isMyMessage && !isDeleted && (
              <Ionicons
                name={item.read ? "checkmark-done" : "checkmark"}
                size={14}
                color={item.read ? "#4ADE80" : "rgba(255,255,255,0.7)"}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
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
          <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>Tap to view item</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    return () => { updateUserStatus(false); };
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isOnline = otherUserStatus === "Online";

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/messages")}>
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => {
            if (otherUserId) router.push({ pathname: "/profile", params: { id: otherUserId } });
          }}
        >
          <View style={styles.avatarWrapper}>
            {otherUserImage ? (
              <Image source={{ uri: otherUserImage }} style={styles.headerAvatarImage} />
            ) : (
              <View style={[styles.headerAvatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.headerAvatarText, { color: colors.white }]}>
                  {getInitials(otherUserName)}
                </Text>
              </View>
            )}
            {isOnline && <View style={[styles.onlineDot, { borderColor: colors.white }]} />}
          </View>
          <View>
            <Text style={[styles.headerName, { color: colors.textPrimary }]}>{otherUserName || "..."}</Text>
            <Text style={[styles.headerStatus, { color: isOnline ? "#22C55E" : colors.textLight }]}>
              {otherUserStatus}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={styles.messagesList}
        ListHeaderComponent={renderHeader}
        onScroll={(e) => {
          const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
          // Consider "at bottom" if within 80px of the end
          isAtBottom.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - 80;
        }}
        scrollEventThrottle={100}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBg, { backgroundColor: colors.gray }]}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.textLight} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No messages yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Start the conversation below
            </Text>
          </View>
        }
      />

      {/* Safety reminder */}
      <View style={styles.safetyReminder}>
        <Ionicons name="shield-checkmark-outline" size={14} color="#F59E0B" />
        <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
          Keep all communications in-app until ownership is verified
        </Text>
      </View>

      {/* Input bar */}
      <View style={[styles.inputContainer, { backgroundColor: colors.white, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => setShowMediaOptions(true)}
          disabled={uploadingMedia}
        >
          {uploadingMedia ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="add-circle" size={30} color={colors.primary} />
          )}
        </TouchableOpacity>

        <View style={[styles.inputWrapper, { backgroundColor: colors.gray, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={500}
            editable={!sending}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: newMessage.trim() && !sending ? colors.primary : colors.gray },
          ]}
          onPress={handleSend}
          disabled={sending || !newMessage.trim()}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="send" size={18} color={newMessage.trim() ? colors.white : colors.textLight} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Message Actions Bottom Sheet ── */}
      <Modal
        visible={showMessageActions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMessageActions(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowMessageActions(false)}
        />
        <View style={[styles.actionsSheet, { backgroundColor: colors.white }]}>
          <View style={[styles.actionsDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.actionsTitle, { color: colors.textPrimary }]}>Message Options</Text>

          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: colors.border }]}
            onPress={handleEditPress}
          >
            <View style={[styles.actionIconBg, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="pencil" size={20} color="#3B82F6" />
            </View>
            <View>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Edit Message</Text>
              <Text style={[styles.actionSub, { color: colors.textSecondary }]}>Change the text of this message</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
            <View style={[styles.actionIconBg, { backgroundColor: "#FEF2F2" }]}>
              <Ionicons name="trash" size={20} color="#EF4444" />
            </View>
            <View>
              <Text style={[styles.actionLabel, { color: "#EF4444" }]}>Delete Message</Text>
              <Text style={[styles.actionSub, { color: colors.textSecondary }]}>Remove for everyone in this chat</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelActionBtn, { backgroundColor: colors.gray }]}
            onPress={() => setShowMessageActions(false)}
          >
            <Text style={[styles.cancelActionText, { color: colors.textPrimary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Edit Message Modal ── */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.editModalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowEditModal(false)}
          />
          <View style={[styles.editModal, { backgroundColor: colors.white }]}>
            <View style={[styles.actionsDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.actionsTitle, { color: colors.textPrimary }]}>Edit Message</Text>
            <TextInput
              style={[styles.editInput, { backgroundColor: colors.gray, color: colors.textPrimary, borderColor: colors.border }]}
              value={editText}
              onChangeText={setEditText}
              multiline
              autoFocus
              maxLength={500}
              placeholderTextColor={colors.textLight}
            />
            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={[styles.editCancelBtn, { backgroundColor: colors.gray }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.editCancelText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSaveBtn, { backgroundColor: colors.primary, opacity: savingEdit ? 0.7 : 1 }]}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.editSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Media Options Sheet ── */}
      <Modal
        visible={showMediaOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMediaOptions(false)}
      >
        <View style={styles.modalBackdropFull}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowMediaOptions(false)}
          />
          <View style={[styles.mediaOptionsContainer, { backgroundColor: colors.white }]}>
            <View style={[styles.actionsDivider, { backgroundColor: colors.border }]} />
            <Text style={[styles.mediaOptionsTitle, { color: colors.textPrimary }]}>Send Media</Text>
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

      {/* Image Viewer */}
      <Modal visible={!!viewImageUri} transparent animationType="fade" onRequestClose={() => setViewImageUri(null)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setViewImageUri(null)}>
            <Ionicons name="close-circle" size={36} color="#FFFFFF" />
          </TouchableOpacity>
          {viewImageUri && <Image source={{ uri: viewImageUri }} style={styles.fullScreenMedia} resizeMode="contain" />}
        </View>
      </Modal>

      {/* Video Player */}
      <Modal visible={!!viewVideoUri} transparent animationType="fade" onRequestClose={() => setViewVideoUri(null)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setViewVideoUri(null)}>
            <Ionicons name="close-circle" size={36} color="#FFFFFF" />
          </TouchableOpacity>
          {viewVideoUri && <VideoPlayerModal uri={viewVideoUri} />}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingTop: 52, paddingBottom: 14, borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 4 },
  avatarWrapper: { position: "relative" },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  headerAvatarImage: { width: 42, height: 42, borderRadius: 21 },
  headerAvatarText: { fontSize: 16, fontWeight: "700" },
  onlineDot: { position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: "#22C55E", borderWidth: 2 },
  headerName: { fontSize: 16, fontWeight: "700" },
  headerStatus: { fontSize: 12, fontWeight: "500", marginTop: 1 },
  moreButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },

  // List
  messagesList: { padding: 16, paddingBottom: 8, flexGrow: 1 },

  // Item card in header
  itemInfoCard: {
    flexDirection: "row", borderRadius: 14, padding: 12,
    marginBottom: 20, gap: 12, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  itemImage: { width: 48, height: 48, borderRadius: 10 },
  itemInfo: { flex: 1, justifyContent: "center" },
  itemTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  itemSubtitle: { fontSize: 12 },

  // Message bubbles
  messageContainer: { flexDirection: "row", marginBottom: 12, gap: 8, alignItems: "flex-end" },
  myMessageContainer: { justifyContent: "flex-end" },
  theirMessageContainer: { justifyContent: "flex-start" },
  senderAvatar: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  senderAvatarImage: { width: 30, height: 30, borderRadius: 15 },
  senderAvatarText: { fontSize: 11, fontWeight: "700" },
  messageBubble: { maxWidth: "75%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  mediaBubble: { padding: 4 },
  myMessageBubble: { borderBottomRightRadius: 4 },
  theirMessageBubble: {
    borderBottomLeftRadius: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  senderName: { fontSize: 11, fontWeight: "600", marginBottom: 3 },
  messageText: { fontSize: 15, lineHeight: 21 },
  mediaImage: { width: 200, height: 200, borderRadius: 14 },
  fileContainer: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 10, borderRadius: 12, minWidth: 150,
  },
  fileName: { fontSize: 13, fontWeight: "500", flex: 1 },

  // Deleted
  deletedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  deletedText: { fontSize: 13, fontStyle: "italic" },

  // Footer
  messageFooter: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-end",
    gap: 4, marginTop: 5,
  },
  editedLabel: { fontSize: 10, fontStyle: "italic" },
  messageTime: { fontSize: 10 },

  // Empty
  emptyState: { paddingVertical: 60, alignItems: "center", gap: 14 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center" },

  // Safety
  safetyReminder: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    paddingHorizontal: 14, paddingVertical: 8, gap: 8,
  },
  safetyText: { flex: 1, fontSize: 11 },

  // Input
  inputContainer: {
    flexDirection: "row", alignItems: "flex-end",
    paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, gap: 8,
  },
  attachButton: { marginBottom: 6 },
  inputWrapper: {
    flex: 1, borderRadius: 22, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  input: { fontSize: 15, maxHeight: 100, paddingVertical: 0 },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: "center", alignItems: "center", marginBottom: 2,
  },

  // Actions sheet
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  actionsSheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingBottom: 30, paddingTop: 10,
  },
  actionsDivider: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  actionsTitle: { fontSize: 14, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  actionRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  actionLabel: { fontSize: 14, fontWeight: "600" },
  actionSub: { fontSize: 11, marginTop: 1 },
  cancelActionBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  cancelActionText: { fontSize: 14, fontWeight: "600" },

  // Edit modal
  editModalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  editModal: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12,
  },
  editInput: {
    borderRadius: 14, borderWidth: 1,
    padding: 14, fontSize: 15, minHeight: 100, maxHeight: 200,
    textAlignVertical: "top", marginBottom: 16, lineHeight: 22,
  },
  editModalActions: { flexDirection: "row", gap: 12 },
  editCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  editCancelText: { fontSize: 15, fontWeight: "600" },
  editSaveBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  editSaveText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // Media options
  modalBackdropFull: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  mediaOptionsContainer: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12,
  },
  mediaOptionsTitle: { fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 24 },
  mediaOptionsGrid: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  mediaOption: { alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 18, gap: 6 },
  mediaOptionText: { fontSize: 12, fontWeight: "500" },
  cancelButton: { paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  cancelButtonText: { fontSize: 15, fontWeight: "600" },

  // Full-screen viewers
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
  modalCloseButton: { position: "absolute", top: 52, right: 20, zIndex: 10, padding: 10 },
  fullScreenMedia: { width: "100%", height: "80%" },
});