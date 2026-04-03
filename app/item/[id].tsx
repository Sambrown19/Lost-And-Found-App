// app/item/[id].tsx

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../../constants/Colors';
import { getOrCreateConversation } from '../../services/messagesService';

export default function ItemDetailScreen() {
  const { id, title, description, images, userName, userId, category, location, date } = useLocalSearchParams();
  const router = useRouter();
  const [contacting, setContacting] = React.useState(false);

  const imageArray = typeof images === 'string' ? images.split(',') : [];

  const handleContactOwner = async () => {
    setContacting(true);
    try {
      const conversation = await getOrCreateConversation(
        userId as string,
        userName as string,
        id as string,
        title as string,
        imageArray[0]
      );

      router.push({
        pathname: '/chat/[id]',
        params: {
          id: conversation.$id,
          otherUserId: userId,
          otherUserName: userName,
          itemId: id,
          itemTitle: title,
          itemImage: imageArray[0] || '',
        }
      });
    } catch (error) {
      console.error('Contact owner error:', error);
    } finally {
      setContacting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {imageArray.length > 0 && (
          <Image
            source={{ uri: imageArray[0] }}
            style={styles.image}
          />
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{category}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>{location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>{date}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Posted by</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleContactOwner}
          disabled={contacting}
        >
          <Ionicons name="chatbubble-outline" size={20} color={Colors.white} />
          <Text style={styles.contactButtonText}>
            {contacting ? 'Loading...' : 'Contact Owner'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  userName: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  contactButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});