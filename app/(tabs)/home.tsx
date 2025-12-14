// app/(tabs)/home.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Colors from '../../constants/Colors';
import { getInitials, getUserProfile } from '../../services/userService';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const firstName = userProfile?.fullName?.split(' ')[0] || 'User';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {userProfile?.profileImage ? (
            <Image
              source={{ uri: userProfile.profileImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(userProfile?.fullName || '')}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
            <Text style={styles.subGreeting}>Find your lost items</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textLight} />
        <Text style={styles.searchPlaceholder}>Search for lost item</Text>
        <TouchableOpacity>
          <Ionicons name="options-outline" size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Report Buttons */}
      <View style={styles.reportButtons}>
        <TouchableOpacity style={styles.reportButton}>
          <View style={styles.reportIconContainer}>
            <Ionicons name="alert-circle-outline" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.reportButtonText}>Report Lost</Text>
          <Text style={styles.reportButtonSubtext}>Lost something?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.reportButton, styles.reportFoundButton]}>
          <View style={[styles.reportIconContainer, styles.reportFoundIconContainer]}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.reportButtonText}>Report Found</Text>
          <Text style={styles.reportButtonSubtext}>Found something?</Text>
        </TouchableOpacity>
      </View>

      {/* Categories/Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Recent Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>Lost</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyText}>No items found</Text>
          <Text style={styles.emptySubtext}>Lost items will appear here</Text>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: Colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subGreeting: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: Colors.textLight,
  },
  reportButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 15,
    gap: 12,
  },
  reportButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reportFoundButton: {},
  reportIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 22, 40, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportFoundIconContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  reportButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  reportButtonSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
    gap: 15,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  },
});