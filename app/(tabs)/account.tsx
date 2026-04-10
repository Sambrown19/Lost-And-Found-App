import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { account } from '../../config/appwrite';
import { getInitials, getUserProfile } from '../../services/userService';
import { getUserItems } from '../../services/itemsService';

export default function AccountScreen() {
  const router = useRouter();
  const { colors, isDark, themePreference, setThemePreference } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [stats, setStats] = useState({
    found: 0,
    lost: 0,
    returned: 0,
  });

  useEffect(() => {
    loadUserProfile();
    loadUserStats();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const items = await getUserItems();
      
      // Calculate real stats from user's items
      const lost = items.filter((item: any) => 
        item.type === 'lost' && item.status !== 'resolved' && item.status !== 'claimed'
      ).length;
      
      const found = items.filter((item: any) => 
        item.type === 'found' && item.status !== 'resolved' && item.status !== 'claimed'
      ).length;
      
      const returned = items.filter((item: any) => 
        item.status === 'resolved' || item.status === 'claimed'
      ).length;
      
      setStats({ lost, found, returned });
    } catch (error) {
      console.error('Load stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: performLogout },
    ]);
  };

  const performLogout = async () => {
    setLoggingOut(true);
    try {
      await account.deleteSession('current');
      router.replace('/');
    } catch (error: any) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.white }]}>
          <View style={styles.profileHeader}>
            {userProfile?.profileImage ? (
              <Image source={{ uri: userProfile.profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {getInitials(userProfile?.fullName || '')}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <View style={styles.nameContainer}>
                <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                  {userProfile?.fullName || 'User'}
                </Text>
                {userProfile?.isVerified && (
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                )}
              </View>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {userProfile?.email || ''}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.editIconButton, { backgroundColor: colors.gray }]}
              onPress={() => router.push('/profile')}
            >
              <Ionicons name="pencil" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Active Summary - Now with Real Data */}
          <View style={[styles.summarySection, { borderTopColor: colors.border }]}>
            <View style={styles.summaryHeader}>
              <Ionicons name="bar-chart-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
                Active Summary
              </Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {stats.found}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Items Found
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {stats.lost}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Items Lost
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {stats.returned}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Items Returned
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>

          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.gray }]}>
              <Ionicons name="person-outline" size={22} color={colors.textPrimary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Profile</Text>
              <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
                Change profile picture & username
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(tabs)/home')} style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.gray }]}>
              <Ionicons name="home-outline" size={22} color={colors.textPrimary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Browse Items</Text>
              <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
                View all lost and found items
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          {/* Theme Selector */}
          <View style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.gray }]}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={22}
                color={colors.textPrimary}
              />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>
                Appearance
              </Text>
              <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
                {themePreference === 'system' ? 'Matches system' : themePreference === 'dark' ? 'Dark mode' : 'Light mode'}
              </Text>
            </View>
          </View>
          <View style={styles.themeOptions}>
            {(['light', 'dark', 'system'] as const).map((option) => {
              const isActive = themePreference === option;
              const icon = option === 'light' ? 'sunny' : option === 'dark' ? 'moon' : 'phone-portrait-outline';
              const label = option.charAt(0).toUpperCase() + option.slice(1);
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.themeOption,
                    { backgroundColor: colors.gray, borderColor: colors.border },
                    isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setThemePreference(option)}
                >
                  <Ionicons
                    name={icon}
                    size={18}
                    color={isActive ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text style={[
                    styles.themeOptionText,
                    { color: colors.textSecondary },
                    isActive && { color: '#FFFFFF' },
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Settings */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Settings</Text>

          <View style={styles.menuItem}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.gray }]}>
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Notifications</Text>
              <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
                Push Notification for matches
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#D0D0D0', true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Privacy & Security', 'Manage your data and account privacy settings. Coming soon!')}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.gray }]}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.textPrimary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>
                Privacy & Security
              </Text>
              <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
                Manage your data & account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Help & Support', 'Need help? Contact us at support@lostandfound.app\n\nFAQ:\n• How do I report a lost item?\n• How do I claim a found item?\n• How do I verify my account?')}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.gray }]}>
              <Ionicons name="headset-outline" size={22} color={colors.textPrimary} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Help & Support</Text>
              <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
                FAQ's & Contact Us
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.white }]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#FF4444" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={22} color="#FF4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  profileCard: {
    marginHorizontal: 16, marginTop: 60, marginBottom: 20,
    borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  profileInfo: { flex: 1, marginLeft: 12 },
  nameContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  profileName: { fontSize: 18, fontWeight: '700' },
  profileEmail: { fontSize: 13 },
  editIconButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  summarySection: { paddingTop: 20, borderTopWidth: 1 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  summaryTitle: { fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12 },
  section: {
    marginHorizontal: 16, marginBottom: 20, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  menuIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  menuTextContainer: { flex: 1 },
  menuText: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  menuSubtext: { fontSize: 12 },
  themeOptions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  themeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, gap: 6 },
  themeOptionText: { fontSize: 13, fontWeight: '600' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, paddingVertical: 16, borderRadius: 16, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#FF4444' },
});