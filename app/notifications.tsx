import { useTheme } from "@/context/ThemeContext";
import { getUserConversations } from "@/services/messagesService";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { account, databases, DATABASE_ID, NOTIFICATIONS_COLLECTION_ID } from "@/config/appwrite";
import { Query } from "react-native-appwrite";

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      const user = await account.get();
      
      // Fetch both Conversations and DB Notifications in parallel
      const [conversations, dbNotifications] = await Promise.all([
        getUserConversations(),
        databases.listDocuments(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, [
          Query.equal("userId", user.$id),
          Query.orderDesc("$createdAt"),
          Query.limit(50)
        ])
      ]);
      
      const mappedNotifications: any[] = [];

      // Map conversations
      conversations.forEach(conv => {
        const isNew = conv.unreadCount > 0 && conv.unreadFor === user.$id;
        const names = conv.participantNames?.split(",") || ["User", "User"];
        const senderName = names[0] === user.name ? names[1] : names[0] || "Someone";
        
        mappedNotifications.push({
          id: conv.$id,
          dbId: null, // Conversations manage unread state internally 
          type: "message",
          title: `Message from ${senderName}`,
          message: conv.lastMessage || "Sent you a message",
          time: conv.lastMessageTime,
          conversationId: conv.$id,
          itemTitle: conv.itemTitle,
          isNew: isNew,
        });
      });

      // Map Real DB Notifications
      const unreadDbIds: string[] = [];
      dbNotifications.documents.forEach(doc => {
        if (!doc.isRead) unreadDbIds.push(doc.$id);

        let parsedData = null;
        try { if (doc.data) parsedData = JSON.parse(doc.data); } catch (e) {}

        mappedNotifications.push({
          id: doc.$id,
          dbId: doc.$id,
          type: doc.type || "system",
          title: doc.title || "Notification",
          message: doc.body || "",
          time: doc.$createdAt,
          conversationId: parsedData?.conversationId || null,
          itemTitle: parsedData?.itemId ? "Item Match" : null,
          isNew: !doc.isRead,
        });
      });

      // Automatically mark DB notifications as read in the background since they've now been seen
      if (unreadDbIds.length > 0) {
        Promise.all(
          unreadDbIds.map(docId =>
            databases.updateDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION_ID, docId, { isRead: true })
          )
        ).catch(err => console.log("Failed to clear notification statuses", err));
      }

      // Sort globally by time descending
      mappedNotifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      
      setNotifications(mappedNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[
        styles.notificationCard, 
        { 
          backgroundColor: item.isNew ? (isDark ? "rgba(255,255,255,0.05)" : "#F0F7FF") : colors.white, 
          borderColor: item.isNew ? colors.primary : colors.border 
        }
      ]}
      onPress={() => item.type === 'message' ? router.push(`/chat/${item.conversationId}` as any) : {}}
      activeOpacity={item.type === 'message' ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.type === 'system' ? '#4CAF50' : colors.primary }]}>
        <Ionicons name={item.type === 'system' ? "megaphone" : "chatbubble-ellipses"} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, { color: colors.textPrimary }]}>{item.title}</Text>
        {item.itemTitle && (
          <Text style={[styles.notificationSubtitle, { color: colors.primary }]}>Regarding: {item.itemTitle}</Text>
        )}
        <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={[styles.notificationTime, { color: colors.textLight }]}>
          {new Date(item.time).toLocaleDateString()} at {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {item.isNew && <View style={[styles.unreadDot, { backgroundColor: '#FF4444' }]} />}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.gray }]}>
        <Ionicons name="notifications-off-outline" size={60} color={colors.textLight} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No new notifications</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        You're all caught up! When you receive new messages or updates, they will appear here.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={notifications.length === 0 ? styles.emptyFlex : styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotifications(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyFlex: {
    flexGrow: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
