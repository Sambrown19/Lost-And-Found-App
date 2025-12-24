import { Item } from '@/services/itemsService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DATABASE_ID, databases, ITEMS_COLLECTION_ID } from '../../config/appwrite';
import Colors from '../../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 260;
const AUTO_SCROLL_INTERVAL = 5000;

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const autoScrollTimer = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    fetchItem();
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (item?.imagesArray && item?.imagesArray?.length > 1) {
      startAutoScroll();
    }
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [item?.imagesArray]);

  const fetchItem = async () => {
    try {
      const res = await databases.getDocument(
        DATABASE_ID,
        ITEMS_COLLECTION_ID,
        id!
      );
      const itemData = res;
      
      if (itemData.images && typeof itemData.images === 'string') {
        itemData.imagesArray = itemData.images.split(',').filter(url => url.trim());
      } else if (Array.isArray(itemData.images)) {
        itemData.imagesArray = itemData.images;
      } else {
        itemData.imagesArray = [];
      }
      
      setItem(itemData);
    } catch (error) {
      console.error('Fetch item error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAutoScroll = () => {
    if (!item.imagesArray || item?.imagesArray?.length <= 1) return;
    
    autoScrollTimer.current = setInterval(() => {
      const nextIndex = (currentIndex + 1) % item?.imagesArray?.length;
      setCurrentIndex(nextIndex);
      
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    }, AUTO_SCROLL_INTERVAL);
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        setCurrentIndex(index);
        
        if (autoScrollTimer.current) {
          clearInterval(autoScrollTimer.current);
        }
        startAutoScroll();
      },
    }
  );

  const onDotPress = (index: number) => {
    setCurrentIndex(index);
    flatListRef.current?.scrollToOffset({
      offset: index * SCREEN_WIDTH,
      animated: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.loading}>
        <Text>Item not found</Text>
      </View>
    );
  }

  const statusColor = item.type === 'lost' ? '#FF4444' : '#4CAF50';
  const imagesArray = item.imagesArray || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Item Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {imagesArray.length > 0 ? (
          <View>
            <FlatList
              ref={flatListRef}
              data={imagesArray}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              renderItem={({ item: imageUrl }) => (
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.image} 
                    resizeMode="cover"
                  />
                </View>
              )}
            />
            
            {imagesArray.length > 1 && (
              <View style={styles.pagination}>
                {imagesArray.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dot,
                      index === currentIndex && styles.activeDot,
                    ]}
                    onPress={() => onDotPress(index)}
                  />
                ))}
              </View>
            )}
            
            {imagesArray.length > 1 && (
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentIndex + 1} / {imagesArray.length}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name={item.type === 'lost' ? 'help-circle-outline' : 'checkmark-circle-outline'}
              size={64}
              color={Colors.textLight}
            />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={[styles.type, { color: statusColor }]}>
              {item.type.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.category}>{item.category}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={Colors.textLight} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textLight} />
            <Text style={styles.metaText}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.reporterCard}>
            <Ionicons name="person-circle-outline" size={40} color={Colors.textLight} />
            <View>
              <Text style={styles.reporterName}>{item.userName}</Text>
              <Text style={styles.reporterSub}>Posted this item</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>
              {item.type === 'lost' ? 'I Found This Item' : 'This Is Mine'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    backgroundColor: Colors.white,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  imageContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },

  image: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.border,
  },

  imagePlaceholder: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: Colors.white,
    width: 20,
  },

  imageCounter: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  imageCounterText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },

  content: {
    padding: 20,
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 10,
  },

  type: {
    fontSize: 12,
    fontWeight: '700',
  },

  category: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },

  metaText: {
    fontSize: 13,
    color: Colors.textLight,
  },

  sectionTitle: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 22,
  },

  reporterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 12,
    marginTop: 25,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  reporterName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  reporterSub: {
    fontSize: 12,
    color: Colors.textLight,
  },

  actionButton: {
    marginTop: 25,
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  actionText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});