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

export default function AccountScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
            <TouchableOpacity style={[styles.editIconButton, { backgroundColor: colors.gray }]}>
              <Ionicons name="pencil" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Active Summary */}
          <View style={[styles.summarySection, { borderTopColor: colors.border }]}>
            <View style={styles.summaryHeader}>
              <Ionicons name="bar-chart-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
                Active Summary
              </Text>
            </View>
            <View style={styles.statsRow}>
              {[
                { number: '12', label: 'Items Found' },
                { number: '5', label: 'Items Lost' },
                { number: '8', label: 'Items Returned' },
              ].map((stat) => (
                <View key={stat.label} style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.textPrimary }]}>
                    {stat.number}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    {stat.label}
                  </Text>
                </View>
              ))}
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

          {/* System Theme Indicator */}
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
                Dark Mode
              </Text>
              <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
                Follows your system settings
              </Text>
            </View>
            <Switch
              value={isDark}
              disabled={true}
              trackColor={{ false: '#D0D0D0', true: colors.primary }}
              thumbColor={colors.white}
            />
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

          <TouchableOpacity style={styles.menuItem}>
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

          <TouchableOpacity style={styles.menuItem}>
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
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, paddingVertical: 16, borderRadius: 16, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#FF4444' },
});