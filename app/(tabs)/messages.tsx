import ConversationSkeleton from "@/components/loader/ConversationSkeleton";
import { account } from "@/config/appwrite";
import { useTheme } from "@/context/ThemeContext";
import { getUserConversations } from "@/services/messagesService";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState, useRef } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
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
  const [searchQuery, setSearchQuery] = useState("");
  // Fix: Use a ref for the image cache so the interval closure doesn't get a strict, empty copy!
  const userImagesRef = useRef<Record<string, string>>({});
  const userOnlineRef = useRef<Record<string, boolean>>({}); // cache online status
  const [imagesVersion, setImagesVersion] = useState(0); // Dummy state to trigger UI re-renders 

  const fetchUserProfileImage = async (userId: string) => {
    if (userImagesRef.current[userId] !== undefined) return userImagesRef.current[userId];
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal("userId", userId)]
      );
      const doc = response.documents[0];
      const imageUrl = doc?.profileImage || "";
      const isOnline = doc?.isOnline || false;
      userImagesRef.current[userId] = imageUrl;
      userOnlineRef.current[userId] = isOnline;
      setImagesVersion(v => v + 1); // trigger re-render
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

  const filteredConversations = searchQuery.trim()
    ? conversations.filter((conv) => {
        const { otherUserName } = getOtherParticipant(conv);
        return (
          otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (conv.itemTitle || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : conversations;

  const renderConversation = ({ item }: { item: any }) => {
    const { otherUserId, otherUserName } = getOtherParticipant(item);
    const hasUnread = item.unreadCount > 0 && item.unreadFor === currentUserId;
    const avatarColor = getRandomColor(otherUserId || otherUserName);
    const profileImage = userImagesRef.current[otherUserId] || "";
    const isOtherOnline = userOnlineRef.current[otherUserId] || false;

    return (
      <TouchableOpacity
        style={[
          styles.conversationCard,
          { backgroundColor: colors.white, shadowColor: colors.black },
          hasUnread && styles.conversationCardUnread,
        ]}
        activeOpacity={0.75}
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
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{getInitials(otherUserName)}</Text>
            </View>
          )}
          {isOtherOnline && (
            <View style={[styles.onlineDot, { borderColor: colors.white }]} />
          )}
        </View>

        {/* Content */}
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.userName,
                { color: colors.textPrimary },
                hasUnread && { fontWeight: "800" },
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
            <View style={[styles.itemPill, { backgroundColor: colors.gray }]}>
              <Ionicons name="pricetag-outline" size={11} color={colors.primary} />
              <Text style={[styles.itemPillText, { color: colors.primary }]} numberOfLines={1}>
                {item.itemTitle}
              </Text>
            </View>
          )}

          <Text
            style={[
              styles.lastMessage,
              { color: hasUnread ? colors.textPrimary : colors.textSecondary },
              hasUnread && { fontWeight: "600" },
            ]}
            numberOfLines={1}
          >
            {item.lastMessage || "Tap to start conversation"}
          </Text>
        </View>

        {/* Right side */}
        <View style={styles.cardRight}>
          {hasUnread ? (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadBadgeText}>
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          )}
          {item.itemImage ? (
            <Image source={{ uri: item.itemImage }} style={[styles.itemThumb, { borderColor: colors.border }]} />
          ) : null}
        </View>
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Messages</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchWrapper, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.gray, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by name or item..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredConversations}
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

  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 0,
  },
  headerTitle: { fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, marginTop: 2 },

  // Search
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },

  // List
  listContent: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 10 },

  // Conversation Card
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  conversationCardUnread: {
    shadowOpacity: 0.12,
    elevation: 5,
  },

  // Avatar
  avatarContainer: { position: "relative", marginRight: 14 },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    justifyContent: "center", alignItems: "center",
  },
  avatarImage: { width: 54, height: 54, borderRadius: 27 },
  avatarText: { fontSize: 19, fontWeight: "700", color: "#FFFFFF" },
  onlineDot: {
    position: "absolute", bottom: 1, right: 1,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: "#22C55E", borderWidth: 2,
  },

  // Content
  conversationInfo: { flex: 1, minWidth: 0 },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: { fontSize: 15, fontWeight: "700", flex: 1, marginRight: 6 },
  timeText: { fontSize: 11, fontWeight: "500" },
  itemPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    marginBottom: 5,
  },
  itemPillText: { fontSize: 11, fontWeight: "600", maxWidth: 160 },
  lastMessage: { fontSize: 13 },

  // Right side
  cardRight: { alignItems: "center", gap: 8, marginLeft: 8 },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  itemThumb: {
    width: 36, height: 36, borderRadius: 8, borderWidth: 1,
  },

  // Empty state
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