// app/(tabs)/messages.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../../constants/Colors';
import { getUserConversations } from '../../services/messagesService';
import { getInitials } from '../../services/userService';

export default function MessagesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await getUserConversations();
      setConversations(data);
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getOtherUserName = (participantNames: string, userId: string) => {
    // This is a simplified version - you'd need to match user IDs
    const names = participantNames.split(',');
    return names[1] || names[0];
  };

  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => {
      const otherUserName = getOtherUserName(item.participantNames, '');
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: item.$id,
          otherUserId: '', // You'll need to extract this from participants
          otherUserName,
          itemId: item.itemId || '',
          itemTitle: item.itemTitle || '',
          itemImage: item.itemImage || '',
        }
      });
}}
    >
      {item.itemImage ? (
        <Image source={{ uri: item.itemImage }} style={styles.avatar} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getInitials(getOtherUserName(item.participantNames, ''))}
          </Text>
        </View>
      )}

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>
            {getOtherUserName(item.participantNames, '')}
          </Text>
          <Text style={styles.conversationTime}>
            {item.lastMessageTime ? formatTime(item.lastMessageTime) : ''}
          </Text>
        </View>

        <View style={styles.conversationFooter}>
          <Text style={styles.conversationMessage} numberOfLines={1}>
            {item.lastMessage || 'No messages yet'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>

        {item.itemTitle && (
          <Text style={styles.itemTitle} numberOfLines={1}>
            About: {item.itemTitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Your conversations will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.$id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  listContent: {
    paddingVertical: 10,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  conversationTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  itemTitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 5,
    textAlign: 'center',
  },
});