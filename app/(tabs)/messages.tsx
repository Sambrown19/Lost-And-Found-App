import ConversationSkeleton from "@/components/loader/ConversationSkeleton";
import { account } from "@/config/appwrite";
import Colors from "@/constants/Colors";
import { getUserConversations } from "@/services/messagesService";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";

const getInitials = (name: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getRandomColor = (seed: string) => {
  const colors = [
    "#E74C3C", // Deep Red
    "#3498DB", // Deep Blue
    "#2ECC71", // Deep Green
    "#9B59B6", // Deep Purple
    "#F39C12", // Deep Orange
    "#1ABC9C", // Deep Teal
    "#E91E63", // Deep Pink
    "#00BCD4", // Deep Cyan
    "#FF9800", // Deep Amber
    "#8E44AD", // Deep Violet
    "#16A085", // Deep Sea Green
    "#C0392B", // Deep Brick Red
    "#2980B9", // Deep Navy Blue
    "#27AE60", // Deep Forest Green
    "#D35400", // Deep Pumpkin
    "#7F8C8D", // Deep Gray
    "#2C3E50", // Deep Dark Blue
    "#F1C40F", // Deep Gold
    "#E67E22", // Deep Carrot
    "#34495E", // Deep Midnight Blue
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const formatTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diff < 60000) {
    return "Just now";
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

export default function ConversationsScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");

  const loadConversations = async () => {
    try {
      setLoading(true);
      const user = await account.get();
      setCurrentUserId(user.$id);
      console.log("Current user ID:", user.$id);

      const data = await getUserConversations();
      console.log("Conversations loaded:", data.length);
      setConversations(data);
    } catch (error) {
      console.error("Load conversations error:", error);
      Alert.alert("Error", "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, []),
  );

  const getOtherParticipant = (conversation: any) => {
    let participants = conversation.participants;
    if (typeof participants === "string") {
      participants = participants.split(",");
    }

    const otherUserId = participants?.find(
      (id: string) => id !== currentUserId,
    );

    let names = conversation.participantNames;
    if (typeof names === "string") {
      names = names.split(",");
    }

    const otherUserName =
      names?.find(
        (_: any, index: number) => participants?.[index] !== currentUserId,
      ) || "User";

    return { otherUserId, otherUserName };
  };

  const renderConversation = ({ item }: { item: any }) => {
    const { otherUserId, otherUserName } = getOtherParticipant(item);
    const hasUnread = item.unreadCount > 0;
    const avatarColor = getRandomColor(otherUserId || otherUserName);
    console.log(item);

    return (
      <TouchableOpacity
        style={[styles.conversationItem, hasUnread && styles.unreadItem]}
        activeOpacity={0.7}
        onPress={() => {
          router.push({
            pathname: "/chat/[id]",
            params: {
              id: item.$id,
              otherUserId: otherUserId,
              otherUserName: otherUserName,
              itemId: item.itemId,
              itemTitle: item.itemTitle,
              itemImage: item.itemImage,
            },
          });
        }}
      >
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatar,
              styles.avatarPlaceholder,
              { backgroundColor: avatarColor },
            ]}
          >
            <Text style={styles.avatarText}>{getInitials(otherUserName)}</Text>
          </View>
          {hasUnread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text
              style={[styles.userName, hasUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {otherUserName}
            </Text>
            <Text style={[styles.timeText, hasUnread && styles.unreadText]}>
              {item.lastMessageTime ? formatTime(item.lastMessageTime) : ""}
            </Text>
          </View>

          {item.itemTitle && (
            <View style={styles.itemTitleContainer}>
              <Ionicons name="cube-outline" size={12} color={Colors.primary} />
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.itemTitle}
              </Text>
            </View>
          )}

          <View style={styles.lastMessageContainer}>
            {!item.lastMessage && (
              <Ionicons
                name="chatbubble-outline"
                size={12}
                color={Colors.textLight}
              />
            )}
            <Text
              style={[styles.lastMessage, hasUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {item.lastMessage || "Tap to start conversation"}
            </Text>
          </View>
        </View>

        {hasUnread && (
          <View style={styles.unreadBadge}>
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
      <View style={styles.emptyIconContainer}>
        <Ionicons
          name="chatbubbles-outline"
          size={60}
          color={Colors.textLight}
        />
      </View>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptyText}>
        When you contact someone about an item,{"\n"}your conversations will
        appear here
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => router.push("/home")}
      >
        <Text style={styles.browseButtonText}>Browse Items</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <ConversationSkeleton />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons
            name="search-outline"
            size={24}
            color={Colors.textPrimary}
          />
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  unreadItem: {
    backgroundColor: "rgba(10, 22, 40, 0.02)",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.white,
  },
  unreadDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textLight,
  },
  itemTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "500",
    flex: 1,
  },
  lastMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lastMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  unreadText: {
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    paddingHorizontal: 7,
  },
  unreadBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(10, 22, 40, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  browseButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
});
