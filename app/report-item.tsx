// app/report-item.tsx

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Colors from '../constants/Colors';

type ItemType = 'lost' | 'found';

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

export default function ReportItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const itemType: ItemType = (params.type as ItemType) || 'lost';

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [itemName, setItemName] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [reward, setReward] = useState('');

  const title = itemType === 'lost' ? 'Report Lost Item' : 'Report Found Item';
  const subtitle = itemType === 'lost' 
    ? 'Specify the category that best describes your lost item'
    : 'Specify the category that best describes the item you found';

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

  const handleContinueStep1 = () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    setStep(2);
  };

  const handleContinueStep2 = () => {
    if (!itemName || !color || !date || !time || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setStep(3);
  };

  const handleContinueStep3 = () => {
    if (photos.length === 0) {
      Alert.alert('Error', 'Please add at least one photo');
      return;
    }
    setStep(4);
  };

  const handleSubmit = () => {
    // TODO: Submit to Appwrite
    Alert.alert('Success', `${itemType === 'lost' ? 'Lost' : 'Found'} item reported successfully!`, [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>What did you {itemType === 'lost' ? 'lose' : 'find'}?</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>

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
            Choose the category that you feel best describes your {itemType === 'lost' ? 'lost' : 'found'} item. You'll be able to add more details in the next step.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinueStep1}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepSubtitle}>Provide details about the item</Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Item Name/Title</Text>
          <TextInput
            style={styles.input}
            value={itemName}
            onChangeText={setItemName}
            placeholder="e.g., iPhone 13 Pro"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Brand (Apparel/etc)</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g., Apple"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Color</Text>
          <TextInput
            style={styles.input}
            value={color}
            onChangeText={setColor}
            placeholder="e.g., Black"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date/Last Seen</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.inputWithIconText}
              value={date}
              onChangeText={setDate}
              placeholder="mm/dd/yy"
            />
            <Ionicons name="calendar-outline" size={20} color={Colors.textLight} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Time/Last Seen</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.inputWithIconText}
              value={time}
              onChangeText={setTime}
              placeholder="9:00 AM"
            />
            <Ionicons name="time-outline" size={20} color={Colors.textLight} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location/Last Seen</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.inputWithIconText}
              value={location}
              onChangeText={setLocation}
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
            placeholder="Add any additional details..."
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinueStep2}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Add Photos & Offer Rewards</Text>
      <Text style={styles.stepSubtitle}>Upload photos</Text>

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

        <Text style={styles.photoHint}>Upload photos of your lost item (up to 4 Photos)</Text>
      </View>

      {itemType === 'lost' && (
        <View style={styles.rewardSection}>
          <Text style={styles.label}>Offer Reward</Text>
          <View style={styles.rewardInput}>
            <Text style={styles.currencySymbol}>GH₵</Text>
            <TextInput
              style={styles.rewardAmount}
              value={reward}
              onChangeText={setReward}
              placeholder="300"
              keyboardType="numeric"
            />
          </View>
        </View>
      )}

      <View style={styles.tipBox}>
        <Ionicons name="bulb-outline" size={20} color={Colors.primary} />
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Photo Tips</Text>
          <Text style={styles.tipText}>
            {'\u2022'} Take clear and well-lit photos from multiple angles{'\n'}
            {'\u2022'} Include any unique features that will help in identifying your item{'\n'}
            {'\u2022'} Verify images are good before submission{'\n'}
            {'\u2022'} Avoid adding pictures with faces
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinueStep3}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep4 = () => (
    <>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepSubtitle}>Please verify all information is accurate</Text>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>{itemName}</Text>
        <Text style={styles.reviewBrand}>{brand}</Text>

        <View style={styles.photosPreview}>
          {photos.map((photo, index) => (
            <Image key={index} source={{ uri: photo }} style={styles.previewImage} />
          ))}
        </View>

        <View style={styles.reviewDetails}>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Color</Text>
            <Text style={styles.reviewValue}>{color}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Category</Text>
            <Text style={styles.reviewValue}>
              {categories.find(c => c.id === selectedCategory)?.name}
            </Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Where/When</Text>
            <View>
              <Text style={styles.reviewValue}>{location}</Text>
              <Text style={styles.reviewValueSmall}>
                {date} • {time}
              </Text>
            </View>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Location</Text>
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={14} color={Colors.primary} />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Additional Description</Text>
            <Text style={styles.reviewValue}>{description}</Text>
          </View>
        </View>

        {itemType === 'lost' && reward && (
          <View style={styles.rewardDisplay}>
            <Text style={styles.rewardDisplayLabel}>Offer Reward</Text>
            <Text style={styles.rewardDisplayAmount}>GH₵ {reward}</Text>
            <View style={styles.importantBox}>
              <Ionicons name="warning-outline" size={20} color="#FF9800" />
              <View style={styles.importantContent}>
                <Text style={styles.importantTitle}>Important</Text>
                <Text style={styles.importantText}>
                  {'\u2022'} Any report will be visible to verified finders only{'\n'}
                  {'\u2022'} Verified finders(s) will be listed on your report{'\n'}
                  {'\u2022'} Reward will only be given once the item ownership is verified
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Report</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>
    </View>
  );
}

// (Keep all the styles the same from before)
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
    paddingHorizontal: 20,
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
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
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
    textAlignVertical: 'top',
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
  rewardSection: {
    marginBottom: 20,
  },
  rewardInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  rewardAmount: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  reviewSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  reviewBrand: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  photosPreview: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  reviewDetails: {
    gap: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  reviewValueSmall: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'right',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  rewardDisplay: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rewardDisplayLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  rewardDisplayAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  importantBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  importantContent: {
    flex: 1,
  },
  importantTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: 4,
  },
  importantText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 40,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});