import ConversationSkeleton from "@/components/loader/ConversationSkeleton";
import { account } from "@/config/appwrite";
import { useTheme } from "@/context/ThemeContext";
import { getUserConversations } from "@/services/messagesService";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { databases, DATABASE_ID, USERS_COLLECTION_ID } from "@/config/appwrite";
import { Query } from "react-native-appwrite";

const getInitials = (name: string) => {
  if (!name) return "?";
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
};

const getRandomColor = (seed: string) => {
  const colors = [
    "#E74C3C", "#3498DB", "#2ECC71", "#9B59B6", "#F39C12",
    "#1ABC9C", "#E91E63", "#00BCD4", "#FF9800", "#8E44AD",
    "#16A085", "#C0392B", "#2980B9", "#27AE60", "#D35400",
    "#7F8C8D", "#2C3E50", "#F1C40F", "#E67E22", "#34495E",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return colors[Math.abs(hash) % colors.length];
};

const formatTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (diff < 60000) return "Just now";
  else if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  else if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  else if (days === 1) return "Yesterday";
  else if (days < 7) return `${days}d ago`;
  else return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function ConversationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [userImages, setUserImages] = useState<Record<string, string>>({});

  const fetchUserProfileImage = async (userId: string) => {
    if (userImages[userId]) return userImages[userId];
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal("userId", userId)]
      );
      const imageUrl = response.documents[0]?.profileImage || "";
      setUserImages(prev => ({ ...prev, [userId]: imageUrl }));
      return imageUrl;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return "";
    }
  };

  const loadConversations = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const user = await account.get();
      setCurrentUserId(user.$id);
      const data = await getUserConversations();
      setConversations(data);
      
      // Fetch profile images for all participants
      for (const conv of data) {
        let participants: string[] = Array.isArray(conv.participants)
          ? conv.participants
          : (conv.participants as string).split(",");
        const otherId = participants[0] === user.$id ? participants[1] : participants[0];
        if (otherId) {
          await fetchUserProfileImage(otherId);
        }
      }
    } catch (error) {
      console.error("Load conversations error:", error);
      if (showLoading) Alert.alert("Error", "Failed to load conversations");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();

      const interval = setInterval(() => {
        loadConversations(false);
      }, 3000);

      return () => clearInterval(interval);
    }, [])
  );

  const getOtherParticipant = (conversation: any) => {
    let participants: string[] = Array.isArray(conversation.participants)
      ? conversation.participants
      : (conversation.participants as string).split(",");

    let names: string[] = Array.isArray(conversation.participantNames)
      ? conversation.participantNames
      : (conversation.participantNames as string).split(",");

    const otherIndex = participants[0] === currentUserId ? 1 : 0;
    const otherUserId = participants[otherIndex] || "";
    const otherUserName = names[otherIndex] || "User";

    return { otherUserId, otherUserName };
  };

  const renderConversation = ({ item }: { item: any }) => {
    const { otherUserId, otherUserName } = getOtherParticipant(item);
    const hasUnread = item.unreadCount > 0 && item.unreadFor === currentUserId;
    const avatarColor = getRandomColor(otherUserId || otherUserName);
    const profileImage = userImages[otherUserId];

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          { borderBottomColor: colors.border },
          hasUnread && { backgroundColor: colors.gray },
        ]}
        activeOpacity={0.7}
        onPress={() => router.push({
          pathname: "/chat/[id]",
          params: {
            id: item.$id,
            otherUserId,
            otherUserName,
            itemId: item.itemId,
            itemTitle: item.itemTitle,
            itemImage: item.itemImage,
          },
        })}
      >
        <View style={styles.avatarContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{getInitials(otherUserName)}</Text>
            </View>
          )}
          {hasUnread && (
            <View style={[styles.unreadDot, { borderColor: colors.white }]} />
          )}
        </View>

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.userName,
                { color: colors.textPrimary },
                hasUnread && { fontWeight: "700" },
              ]}
              numberOfLines={1}
            >
              {otherUserName}
            </Text>
            <Text style={[styles.timeText, { color: colors.textLight }]}>
              {item.lastMessageTime ? formatTime(item.lastMessageTime) : ""}
            </Text>
          </View>

          {item.itemTitle && (
            <View style={styles.itemTitleContainer}>
              <Ionicons name="cube-outline" size={12} color={colors.primary} />
              <Text style={[styles.itemTitle, { color: colors.primary }]} numberOfLines={1}>
                {item.itemTitle}
              </Text>
            </View>
          )}

          <View style={styles.lastMessageContainer}>
            {!item.lastMessage && (
              <Ionicons name="chatbubble-outline" size={12} color={colors.textLight} />
            )}
            <Text
              style={[
                styles.lastMessage,
                { color: colors.textSecondary },
                hasUnread && { color: colors.textPrimary, fontWeight: "500" },
              ]}
              numberOfLines={1}
            >
              {item.lastMessage || "Tap to start conversation"}
            </Text>
          </View>
        </View>

        {hasUnread && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.unreadBadgeText}>
              {item.unreadCount > 99 ? "99+" : item.unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.gray }]}>
        <Ionicons name="chatbubbles-outline" size={60} color={colors.textLight} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No conversations yet
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        When you contact someone about an item,{"\n"}your conversations will appear here
      </Text>
      <TouchableOpacity
        style={[styles.browseButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/home")}
      >
        <Text style={styles.browseButtonText}>Browse Items</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <ConversationSkeleton />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Messages</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => Alert.alert('Search', 'Conversation search coming soon!')}>
          <Ionicons name="search-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 28, fontWeight: "700" },
  headerButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: "center", alignItems: "center",
  },
  listContent: { flexGrow: 1, paddingHorizontal: 20 },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: { position: "relative", marginRight: 14 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: "center", alignItems: "center",
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: { fontSize: 20, fontWeight: "600", color: "#FFFFFF" },
  unreadDot: {
    position: "absolute", top: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "#4CAF50", borderWidth: 2,
  },
  conversationInfo: { flex: 1 },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  userName: { fontSize: 16, fontWeight: "600", flex: 1, marginRight: 8 },
  timeText: { fontSize: 11 },
  itemTitleContainer: {
    flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4,
  },
  itemTitle: { fontSize: 12, fontWeight: "500", flex: 1 },
  lastMessageContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  lastMessage: { fontSize: 13, flex: 1 },
  unreadBadge: {
    minWidth: 24, height: 24, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
    marginLeft: 8, paddingHorizontal: 7,
  },
  unreadBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  emptyState: {
    flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: "center", alignItems: "center", marginBottom: 24,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  browseButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
  browseButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
});