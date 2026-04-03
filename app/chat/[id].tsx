// app/chat/[id].tsx

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { account } from '../../config/appwrite';
import Colors from '../../constants/Colors';
import {
    getConversationMessages,
    markMessagesAsRead,
    sendMessage
} from '../../services/messagesService';
import { getInitials } from '../../services/userService';

export default function ChatDetailScreen() {
  const { id, otherUserId, otherUserName, itemId, itemTitle, itemImage } = useLocalSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    getCurrentUser();

    // Poll for new messages every 3 seconds (simple real-time simulation)
    const interval = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  const getCurrentUser = async () => {
    try {
      const user = await account.get();
      setCurrentUserId(user.$id);
    } catch (error) {
      console.error('Get user error:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const data = await getConversationMessages(id as string);
      setMessages(data);
      
      // Mark messages as read
      await markMessagesAsRead(id as string);
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      await sendMessage(
        id as string,
        otherUserId as string,
        otherUserName as string,
        messageText,
        itemId as string,
        itemTitle as string
      );

      await loadMessages();
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
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
          <View style={styles.senderAvatar}>
            <Text style={styles.senderAvatarText}>
              {getInitials(item.senderName)}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}
        >
          {!isMyMessage && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    if (!itemTitle) return null;

    return (
      <View style={styles.itemInfoCard}>
        {itemImage && (
         <Image
            source={{ uri: Array.isArray(itemImage) ? itemImage[0] : itemImage }}
            style={styles.itemImage}
        />

        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {itemTitle}
          </Text>
          <Text style={styles.itemSubtitle}>Lost Item</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {getInitials(otherUserName as string)}
            </Text>
          </View>
          <View>
            <Text style={styles.headerName}>{otherUserName}</Text>
            <Text style={styles.headerStatus}>Online</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.textPrimary} />
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
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Start the conversation</Text>
          </View>
        }
      />

      {/* Safety Reminder */}
      <View style={styles.safetyReminder}>
        <Ionicons name="warning" size={16} color="#FF9800" />
        <Text style={styles.safetyText}>
          Keep all communications in-app until ownership is verified
        </Text>
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add-circle-outline" size={28} color={Colors.primary} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Ask about the item..."
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending || !newMessage.trim()}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="send" size={20} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerStatus: {
    fontSize: 12,
    color: '#4CAF50',
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 15,
    paddingBottom: 5,
  },
  itemInfoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 8,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  senderAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  myMessageBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.white,
  },
  theirMessageText: {
    color: Colors.textPrimary,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: Colors.textLight,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  safetyReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
  },
  safetyText: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  attachButton: {
    marginBottom: 5,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});