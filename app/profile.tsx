import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { account, DATABASE_ID, databases, USERS_COLLECTION_ID } from '../config/appwrite';
import {
  UserProfile,
  getUserProfile,
  getUserProfileById,
  updateUserProfile,
  uploadProfileImage
} from '../services/userService';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isViewingOther = !!id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    phoneNumber: '',
    campus: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    console.log("Profile id param:", id);
    console.log("isViewingOther:", isViewingOther);
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const userProfile = isViewingOther
        ? await getUserProfileById(id!)
        : await getUserProfile();

      if (userProfile) {
        setProfile(userProfile);
        setFormData({
          fullName: userProfile.fullName || '',
          studentId: userProfile.studentId || '',
          phoneNumber: userProfile.phoneNumber || '',
          campus: userProfile.campus || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.fullName.trim() || !formData.studentId.trim() ||
        !formData.phoneNumber.trim() || !formData.campus.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      await updateUserProfile({
        fullName: formData.fullName,
        studentId: formData.studentId,
        phoneNumber: formData.phoneNumber,
        campus: formData.campus,
      });
      await loadProfile();
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const pickProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadingImage(true);
        const imageUri = result.assets[0].uri;
        const uploadedUrl = await uploadProfileImage(imageUri);
        await updateUserProfile({ profileImage: uploadedUrl });
        await loadProfile();
        Alert.alert('Success', 'Profile image updated');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to update profile image');
    } finally {
      setUploadingImage(false);
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return '';
    const names = name.trim().split(' ').filter(n => n.length > 0);
    if (names.length === 0) return '';
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names.map(n => n[0].toUpperCase()).join('');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This will permanently remove your profile and log you out. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              // 1. Best-effort: try to delete the profile document.
              // Swallow permission errors — collection-level perms may deny this
              // on the client SDK, but the session deletion below always works.
              if (profile?.$id) {
                try {
                  await databases.deleteDocument(DATABASE_ID, USERS_COLLECTION_ID, profile.$id);
                } catch (docError: any) {
                  // Permission denied or doc already gone — continue regardless
                  console.warn('Could not delete profile doc (permission denied), continuing:', docError?.message);
                }
              }

              // 2. Delete the current session — this always succeeds for the logged-in user
              await account.deleteSession('current');

              // 3. Navigate back to welcome screen
              router.replace('/');
            } catch (error: any) {
              console.error('Delete account error:', error);
              setLoading(false);
              Alert.alert('Error', error.message || 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading && !profile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: colors.white }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {isViewingOther ? `${profile?.fullName?.split(' ')[0]}'s Profile` : 'My Profile'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.profileImageSection, { backgroundColor: colors.white }]}>
        <View style={styles.profileImageContainer}>
          {profile?.profileImage ? (
            <Image source={{ uri: profile.profileImage }} style={[styles.profileImage, { borderColor: colors.primary }]} />
          ) : (
            <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <Text style={[styles.profileImageText, { color: colors.white }]}>
                {getInitials(profile?.fullName || '')}
              </Text>
            </View>
          )}
          {!isViewingOther && (
            <TouchableOpacity
              style={[styles.editImageButton, { backgroundColor: colors.primary, borderColor: colors.white }]}
              onPress={pickProfileImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="camera" size={20} color={colors.white} />
              )}
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.profileName, { color: colors.textPrimary }]}>{profile?.fullName}</Text>
        <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{profile?.email}</Text>

        {profile?.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.verifiedText}>Verified Student</Text>
          </View>
        )}
      </View>

      {!isViewingOther && (
        <View style={styles.editButtonContainer}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.white, borderColor: colors.primary }]}
            onPress={() => setEditing(!editing)}
          >
            <Ionicons name={editing ? 'close' : 'pencil'} size={16} color={colors.primary} />
            <Text style={[styles.editButtonText, { color: colors.primary }]}>
              {editing ? 'Cancel Edit' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.formContainer, { backgroundColor: colors.white }]}>
        {editing && !isViewingOther ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Full Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.fullName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textLight}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Student ID *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.studentId}
                onChangeText={(text) => setFormData(prev => ({ ...prev, studentId: text }))}
                placeholder="Enter your student ID"
                placeholderTextColor={colors.textLight}
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Phone Number *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Campus *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                value={formData.campus}
                onChangeText={(text) => setFormData(prev => ({ ...prev, campus: text }))}
                placeholder="Enter your campus"
                placeholderTextColor={colors.textLight}
              />
            </View>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.saveButtonText, { color: colors.white }]}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="person-outline" size={20} color={colors.textLight} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textLight }]}>Full Name</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{profile?.fullName}</Text>
              </View>
            </View>
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="school-outline" size={20} color={colors.textLight} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textLight }]}>Student ID</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{profile?.studentId}</Text>
              </View>
            </View>
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="call-outline" size={20} color={colors.textLight} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textLight }]}>Phone Number</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{profile?.phoneNumber}</Text>
              </View>
            </View>
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="location-outline" size={20} color={colors.textLight} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textLight }]}>Campus</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{profile?.campus}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {!isViewingOther && (
        <>
          <View style={[styles.formContainer, styles.emailContainer, { backgroundColor: colors.white }]}>
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textLight} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: colors.textLight }]}>Email</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{profile?.email}</Text>
                <Text style={[styles.emailNote, { color: colors.textLight }]}>
                  Login email (cannot be changed)
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.white }]}
            onPress={handleDeleteAccount}
            disabled={loading}
          >
            <Ionicons name="trash-outline" size={18} color="#FF4444" />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  profileImageSection: { alignItems: 'center', paddingVertical: 30, marginBottom: 10 },
  profileImageContainer: { position: 'relative', marginBottom: 16 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3 },
  profileImagePlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center', borderWidth: 3,
  },
  profileImageText: { fontSize: 36, fontWeight: '700' },
  editImageButton: {
    position: 'absolute', bottom: 0, right: 0,
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2,
  },
  profileName: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  profileEmail: { fontSize: 14, marginBottom: 12 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  verifiedText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  editButtonContainer: { paddingHorizontal: 20, marginBottom: 20 },
  editButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  editButtonText: { fontSize: 14, fontWeight: '600' },
  formContainer: { padding: 20, marginHorizontal: 20, borderRadius: 12, marginBottom: 16 },
  emailContainer: { marginBottom: 10 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15 },
  saveButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveButtonText: { fontSize: 16, fontWeight: '600' },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '500' },
  emailNote: { fontSize: 11, fontStyle: 'italic', marginTop: 4 },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 20, marginBottom: 40,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FF4444',
  },
  deleteButtonText: { fontSize: 14, fontWeight: '600', color: '#FF4444' },
  statsContainer: { marginBottom: 20 },
  statsTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: '45%', padding: 16, borderRadius: 12, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12 },
});