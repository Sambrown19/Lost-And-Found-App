// app/(tabs)/messages.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Colors from '../../constants/Colors';

// Dummy data for conversations
const conversations = [
  {
    id: '1',
    name: 'Mike Johnson',
    message: "Great I'll be at the library at 3pm..",
    time: '12:00pm',
    avatar: null,
    status: 'Approved',
    statusColor: '#4CAF50',
    unread: false,
    itemImage: require('../../assets/images/Home.png'), // Placeholder
  },
  {
    id: '2',
    name: 'Dindin Makola',
    message: "I can describe what's inside to v..",
    time: '10:00am',
    avatar: null,
    status: 'Pending',
    statusColor: '#FF9800',
    unread: true,
    itemImage: require('../../assets/images/Home.png'),
  },
  {
    id: '3',
    name: 'Cindy Arthur',
    message: 'Does it have a Nike logo on the fr..',
    time: '11:00pm',
    avatar: null,
    status: 'Inquiry',
    statusColor: '#2196F3',
    unread: false,
    itemImage: require('../../assets/images/Home.png'),
  },
  {
    id: '4',
    name: 'Philip Dosmay',
    message: 'Thanks again for finding them for',
    time: '12:00pm',
    avatar: null,
    status: 'Returned',
    statusColor: '#9C27B0',
    unread: false,
    itemImage: require('../../assets/images/Home.png'),
  },
  {
    id: '5',
    name: 'Paul Heyman',
    message: 'I really appreciate what you did',
    time: '12:00am',
    avatar: null,
    status: 'Returned',
    statusColor: '#9C27B0',
    unread: false,
    itemImage: require('../../assets/images/Home.png'),
  },
  {
    id: '6',
    name: 'Seth Bentilley',
    message: 'Most grateful',
    time: '11:00pm',
    avatar: null,
    status: 'Returned',
    statusColor: '#9C27B0',
    unread: false,
    itemImage: require('../../assets/images/Home.png'),
  },
];

export default function MessagesScreen() {
  const [activeFilter, setActiveFilter] = useState('All Chat');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = ['All Chat(6)', 'Claims', 'Inquiries', 'Archived'];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textLight}
        />
        <Ionicons name="search" size={20} color={Colors.textLight} />
      </View>

      {/* Filter Tabs */}
     <View style={styles.filterContainer}>
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.filterContent}
  >
    {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              activeFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </View>

      {/* Conversations List */}
      <ScrollView style={styles.conversationsList}>
        {conversations.map((conversation) => (
          <TouchableOpacity
            key={conversation.id}
            style={styles.conversationItem}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.itemImageSmall}>
                <Image
                  source={conversation.itemImage}
                  style={styles.itemImage}
                />
              </View>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                  {getInitials(conversation.name)}
                </Text>
              </View>
            </View>

            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <View style={styles.nameContainer}>
                  <Text style={styles.conversationName}>
                    {conversation.name}
                  </Text>
                  {conversation.status === 'Approved' && (
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  )}
                </View>
                <Text style={styles.conversationTime}>{conversation.time}</Text>
              </View>

              <View style={styles.messageRow}>
                <Text
                  style={styles.conversationMessage}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {conversation.message}
                </Text>
              </View>

              <View style={styles.statusBadge}>
                <Text
                  style={[
                    styles.statusText,
                    { color: conversation.statusColor },
                  ]}
                >
                  {conversation.status}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  filterContainer: {
    marginBottom: 20,
    flexGrow: 0,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  itemImageSmall: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.gray,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    tintColor: Colors.primary,
  },
  userAvatar: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  messageRow: {
    marginBottom: 6,
  },
  conversationMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});