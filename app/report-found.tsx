// app/report-found.tsx

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
import Colors from '../constants/Colors';

interface Category {
  id: string;
  name: string;
  icon: string;
}

const categories: Category[] = [
  { id: 'electronics', name: 'Electronics', icon: 'phone-portrait-outline' },
  { id: 'personal', name: 'Personal Items', icon: 'card-outline' },
  { id: 'accessories', name: 'Accessories', icon: 'watch-outline' },
  { id: 'books', name: 'Books & Documents', icon: 'book-outline' },
  { id: 'bags', name: 'Bags & Luggage', icon: 'briefcase-outline' },
  { id: 'other', name: 'Other', icon: 'add-circle-outline' },
];

export default function ReportFoundScreen() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [itemName, setItemName] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [foundLocation, setFoundLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  };

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const onDateChange = (event: any, selected: Date | undefined) => {
    setShowDatePicker(false);
    if (selected) {
      setSelectedDate(selected);
    }
  };

  const onTimeChange = (event: any, selected: Date | undefined) => {
    setShowTimePicker(false);
    if (selected) {
      setSelectedTime(selected);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newPhotos = result.assets.map(asset => asset.uri);
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (step === 1 && !selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (step === 2 && photos.length === 0) {
      Alert.alert('Error', 'Please add at least one photo');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = () => {
    Alert.alert('Success', 'Found item reported successfully!', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  // Step 1: What did you find?
  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>What did you find?</Text>
      <Text style={styles.stepSubtitle}>
        Specify the category that best describes the item you found
      </Text>

      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              selectedCategory === category.id && styles.categoryCardActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <View style={[
              styles.categoryIconContainer,
              selectedCategory === category.id && styles.categoryIconContainerActive,
            ]}>
              <Ionicons 
                name={category.icon as any} 
                size={28} 
                color={selectedCategory === category.id ? Colors.white : Colors.primary} 
              />
            </View>
            <Text style={[
              styles.categoryName,
              selectedCategory === category.id && styles.categoryNameActive,
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tipBox}>
        <Ionicons name="bulb-outline" size={20} color={Colors.primary} />
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Quick Tip</Text>
          <Text style={styles.tipText}>
            Choose the category that you feel best describes the item you found. You'll be able to add more details in the next step.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  // Step 2: Take photos of the item (was Step 3)
  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Take photos of the item</Text>
      <Text style={styles.stepSubtitle}>Upload/Add Photo</Text>

      <View style={styles.photosSection}>
        <Text style={styles.label}>Upload/Add Photo</Text>
        
        <View style={styles.photosGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoItem}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          ))}
          
          {photos.length < 4 && (
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
              <Ionicons name="camera-outline" size={32} color={Colors.primary} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.photoHint}>
          We need clear photos of your item before finding matches
        </Text>
      </View>

      <View style={styles.tipBox}>
        <Ionicons name="bulb-outline" size={20} color={Colors.primary} />
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Photo Tips</Text>
          <Text style={styles.tipText}>
            {'\u2022'} Take clear and well-lit photos from multiple angles{'\n'}
            {'\u2022'} Include any unique features that will help in identifying the item{'\n'}
            {'\u2022'} Verify images are good before submission{'\n'}
            {'\u2022'} Avoid adding pictures with faces
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

// Step 3: Privacy Protection
const renderStep3 = () => (
  <>
    <Text style={styles.stepTitle}>Privacy Protection</Text>
    <Text style={styles.stepSubtitle}>We prioritize your safety and privacy</Text>

    <View style={styles.privacySection}>
      <Text style={styles.label}>Item Photos</Text>
      
      <View style={styles.privacyPreview}>
        <View style={styles.privacyPhotosGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.privacyImageContainer}>
              <Image 
                source={{ uri: photo }} 
                style={styles.privacyImage} 
                blurRadius={10}
              />
            </View>
          ))}
        </View>
        
        <View style={styles.privacyBadges}>
          <View style={styles.privacyBadge}>
            <Ionicons name="eye-off" size={16} color={Colors.primary} />
            <Text style={styles.privacyBadgeText}>Blurred</Text>
          </View>
          <View style={styles.privacyBadge}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
            <Text style={styles.privacyBadgeText}>Verified</Text>
          </View>
        </View>
      </View>
    </View>

    <View style={styles.tipBox}>
      <Ionicons name="bulb-outline" size={20} color={Colors.primary} />
      <View style={styles.tipContent}>
        <Text style={styles.tipTitle}>Ready Tip</Text>
        <Text style={styles.tipText}>
          We're going to blur the photos of the found item and only verified students can view the non-blurred version. This is done for privacy purposes.
        </Text>
      </View>
    </View>

    <TouchableOpacity style={styles.button} onPress={handleContinue}>
      <Text style={styles.buttonText}>Continue</Text>
    </TouchableOpacity>
  </>
);
  // Step 4: Item Details (was Step 5)
  const renderStep4 = () => (
    <>
      <Text style={styles.stepTitle}>Item Details</Text>
      <Text style={styles.stepSubtitle}>Provide details about the item</Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Item Name/Title</Text>
          <TextInput
            style={styles.input}
            value={itemName}
            onChangeText={setItemName}
            placeholder="Black Leather Bag"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Brand (If Applicable)</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="Brand name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Color</Text>
          <TextInput
            style={styles.input}
            value={color}
            onChangeText={setColor}
            placeholder="Black"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date/Found</Text>
          <TouchableOpacity 
            style={styles.inputWithIcon}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputWithIconText}>{formatDate(selectedDate)}</Text>
            <Ionicons name="calendar-outline" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Time/Found</Text>
          <TouchableOpacity 
            style={styles.inputWithIcon}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.inputWithIconText}>{formatTime(selectedTime)}</Text>
            <Ionicons name="time-outline" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Found Location</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.inputWithIconText}
              value={foundLocation}
              onChangeText={setFoundLocation}
              placeholder="Phase 2"
            />
            <Ionicons name="location-outline" size={20} color={Colors.textLight} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="I can describe what's inside to verify ownership"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  // Step 5: Item Location (was Step 6)
  const renderStep5 = () => (
    <>
      <Text style={styles.stepTitle}>Item Location</Text>
      <Text style={styles.stepSubtitle}>
        Help the owner locate the item easily. Click on desired location
      </Text>

      <View style={styles.locationOptions}>
        <TouchableOpacity 
          style={[
            styles.locationOption,
            foundLocation === 'I have it with me' && styles.locationOptionActive
          ]}
          onPress={() => setFoundLocation('I have it with me')}
        >
          <Ionicons name="person" size={24} color={Colors.primary} />
          <Text style={styles.locationOptionText}>I have it with me</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.locationOption,
            foundLocation === 'Left at campus security office' && styles.locationOptionActive
          ]}
          onPress={() => setFoundLocation('Left at campus security office')}
        >
          <Ionicons name="business" size={24} color={Colors.primary} />
          <Text style={styles.locationOptionText}>Left at campus security office</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.locationOption,
            foundLocation === 'Left at location found' && styles.locationOptionActive
          ]}
          onPress={() => setFoundLocation('Left at location found')}
        >
          <Ionicons name="location-outline" size={24} color={Colors.primary} />
          <Text style={styles.locationOptionText}>Left at location found</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.locationOption,
            foundLocation === 'Left at student support unit' && styles.locationOptionActive
          ]}
          onPress={() => setFoundLocation('Left at student support unit')}
        >
          <Ionicons name="school" size={24} color={Colors.primary} />
          <Text style={styles.locationOptionText}>Left at student support unit</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  // Step 6: Thank You (was Step 7)
  const renderStep6 = () => (
    <View style={styles.thankYouContainer}>
      <View style={styles.thankYouIcon}>
        <Image 
          source={require('../assets/images/Thank-you.png')} 
          style={styles.thankYouImage}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.thankYouTitle}>Thank You!! 🎉</Text>
      <Text style={styles.thankYouMessage}>
        Your report has been submitted. You're helping someone get their item back!
      </Text>

      <View style={styles.reportDetails}>
        <View style={styles.reportDetailItem}>
          <Text style={styles.reportDetailLabel}>OBJECT ID</Text>
          <Text style={styles.reportDetailValue}>HFJD654524S</Text>
        </View>

        <View style={styles.reportDetailDivider} />

        <View style={styles.reportDetailItem}>
          <Text style={styles.reportDetailLabel}>Date</Text>
          <Text style={styles.reportDetailValue}>{formatDate(selectedDate)}</Text>
        </View>

        <View style={styles.reportDetailDivider} />

        <View style={styles.reportDetailItem}>
          <Text style={styles.reportDetailLabel}>Location</Text>
          <Text style={styles.reportDetailValue}>Dormitory</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Back to Homepage</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 6) * 100}%` }]} />
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Keep all the styles exactly the same as before
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    gap: 15,
    backgroundColor: Colors.background,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  categoryCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(10, 22, 40, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  categoryNameActive: {
    color: Colors.white,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 22, 40, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  photosSection: {
    marginBottom: 20,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  photoItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  addPhotoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  photoHint: {
    fontSize: 12,
    color: Colors.textLight,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  privacySection: {
  marginBottom: 20,
},
privacyPreview: {
  backgroundColor: Colors.white,
  borderRadius: 12,
  padding: 20,
  alignItems: 'center',
  marginBottom: 20,
},
privacyPhotosGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
  marginBottom: 16,
  justifyContent: 'center',
},
privacyImageContainer: {
  width: 90,
  height: 90,
  borderRadius: 12,
  overflow: 'hidden',
},
privacyImage: {
  width: '100%',
  height: '100%',
},
privacyBadges: {
  flexDirection: 'row',
  gap: 10,
},
privacyBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  backgroundColor: 'rgba(10, 22, 40, 0.05)',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 6,
},
privacyBadgeText: {
  fontSize: 12,
  color: Colors.primary,
  fontWeight: '600',
},
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  inputWithIconText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  locationOptions: {
    gap: 12,
    marginBottom: 20,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  locationOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(10, 22, 40, 0.03)',
  },
  locationOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
  },
  thankYouContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  thankYouIcon: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  thankYouImage: {
    width: 100,
    height: 100,
  },
  thankYouTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  thankYouMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  reportDetails: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
  },
  reportDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  reportDetailLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reportDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  reportDetailDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 10,
  },
  thankYouContact: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    width: '100%',
  },
  thankYouContactLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  thankYouContactValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 100,
    width: '100%',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});