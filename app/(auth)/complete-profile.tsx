// app/(auth)/complete-profile.tsx

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { account } from '../../config/appwrite';
import { createUserProfile, uploadProfileImage } from '../../services/userService';

export default function CompleteProfileScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Profile Setup fields
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showStudentId, setShowStudentId] = useState(false);
  const [campus, setCampus] = useState('');
  const [showCampusDropdown, setShowCampusDropdown] = useState(false);

  // Picture Upload fields
  const [imageUri, setImageUri] = useState<string | null>(null);

  const campusOptions = [
    'Safo Hall',
    'Yeboah Hall',
    'Annan Hall',
    'Adams Hostel',
    'Off-Campus',
  ];

  const getInitials = (name: string) => {
    const names = name.trim().split(' ').filter(n => n.length > 0);
    if (names.length === 0) return '';
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    
    // Get first letter of each name
    return names.map(n => n[0].toUpperCase()).join('');
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need permission to access your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleContinueStep1 = () => {
    if (!fullName || !studentId || !phoneNumber || !campus) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setCurrentStep(2);
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      const user = await account.get();
      
      let profileImageUrl = '';
      
      // Upload image if selected
      if (imageUri) {
        profileImageUrl = await uploadProfileImage(imageUri);
      }
      
      // Add this line to overwrite the Appwrite Auth email-prefix with their REAL name!
      await account.updateName(fullName);

      // Save profile to database
      await createUserProfile({
        email: user.email,
        fullName,
        studentId,
        phoneNumber,
        campus,
        profileImage: profileImageUrl,
        isVerified: true,
      });

      Alert.alert('Success', 'Profile created successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/home'),
        },
      ]);
    } catch (error: any) {
      console.error('Complete profile error:', error);
      Alert.alert('Error', error.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectCampus = (option: string) => {
    setCampus(option);
    setShowCampusDropdown(false);
  };

  const renderStep1 = () => (
    <>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Profile Setup</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Fill in your details to set up your account
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Full Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.white,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Samuel Duodu Sampson"
            placeholderTextColor={colors.textLight}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Student ID</Text>
          <View
            style={[
              styles.passwordContainer,
              {
                backgroundColor: colors.white,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              style={[styles.passwordInput, { color: colors.textPrimary }]}
              placeholder="PUIT/22210010"
              placeholderTextColor={colors.textLight}
              value={studentId}
              onChangeText={setStudentId}
              secureTextEntry={!showStudentId}
            />
            <TouchableOpacity
              onPress={() => setShowStudentId(!showStudentId)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showStudentId ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textLight}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Phone Number</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.white,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            placeholder="+233"
            placeholderTextColor={colors.textLight}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Primary Campus Location</Text>
          <TouchableOpacity
            style={[
              styles.dropdownButton,
              {
                backgroundColor: colors.white,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setShowCampusDropdown(!showCampusDropdown)}
          >
            <Text style={[
              styles.dropdownText,
              !campus && styles.placeholder,
              { color: campus ? colors.textPrimary : colors.textLight }
            ]}>
              {campus || 'Select campus'}
            </Text>
            <Ionicons
              name={showCampusDropdown ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>
          
          {showCampusDropdown && (
            <View style={[
              styles.dropdownList,
              {
                backgroundColor: colors.white,
                borderColor: colors.border,
              },
            ]}>
              {campusOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                  onPress={() => selectCampus(option)}
                >
                  <Text style={[styles.dropdownItemText, { color: colors.textPrimary }]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleContinueStep1}
      >
        <Text style={[styles.buttonText, { color: colors.white }]}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Picture Upload</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Upload your profile picture to complete your account
        </Text>
      </View>

      <View style={styles.imageSection}>
        <View style={styles.imageCircle}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.profileImage} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: colors.primary }]}>
              <Text style={[styles.initialsText, { color: colors.white }]}>
                {getInitials(fullName)}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.addPhotoButton, { borderColor: colors.primary }]} 
          onPress={pickImage}
        >
          <Text style={[styles.addPhotoText, { color: colors.primary }]}>Add Photo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.white }]}>Complete</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleComplete}
          disabled={loading}
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => currentStep === 1 ? router.back() : setCurrentStep(1)}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <View style={styles.stepItem}>
              <View style={[
                styles.stepCircle, 
                { backgroundColor: currentStep >= 1 ? colors.primary : colors.border },
                currentStep >= 1 && styles.stepCircleActive
              ]}>
                <Text style={[
                  styles.stepNumber, 
                  { color: currentStep >= 1 ? colors.white : colors.textLight }
                ]}>1</Text>
              </View>
            </View>
            <View style={[
              styles.stepLine, 
              { backgroundColor: currentStep >= 2 ? colors.primary : colors.border }
            ]} />
            <View style={styles.stepItem}>
              <View style={[
                styles.stepCircle, 
                { backgroundColor: currentStep >= 2 ? colors.primary : colors.border },
                currentStep >= 2 && styles.stepCircleActive
              ]}>
                <Text style={[
                  styles.stepNumber, 
                  { color: currentStep >= 2 ? colors.white : colors.textLight }
                ]}>2</Text>
              </View>
            </View>
          </View>
        </View>

        {currentStep === 1 ? renderStep1() : renderStep2()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    // backgroundColor handled inline
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLine: {
    width: 60,
    height: 2,
    marginHorizontal: 10,
  },
  titleContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
  },
  placeholder: {
    // color handled inline
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 5,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  imageSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: 20,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 48,
    fontWeight: '700',
  },
  addPhotoButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 50,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 40,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 10,
  },
  skipText: {
    fontSize: 14,
  },
});