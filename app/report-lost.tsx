import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createItem, uploadImage } from "../services/itemsService";

interface Category {
  id: string;
  name: string;
  icon: string;
}

const categories: Category[] = [
  { id: "electronics", name: "Electronics", icon: "phone-portrait-outline" },
  { id: "personal", name: "Personal Items", icon: "card-outline" },
  { id: "accessories", name: "Accessories", icon: "watch-outline" },
  { id: "books", name: "Books & Documents", icon: "book-outline" },
  { id: "bags", name: "Bags & Luggage", icon: "briefcase-outline" },
  { id: "other", name: "Other", icon: "add-circle-outline" },
];

export default function ReportLostScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [itemName, setItemName] = useState("");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [offerReward, setOfferReward] = useState(false);
  const [reward, setReward] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [apiCallState, setApiCallState] = useState({
    isLoading: false,
    error: null as string | null,
    success: false,
  });

  const [formData, setFormData] = useState({
    type: "lost" as "lost" | "found",
    title: "",
    description: "",
    category: "",
    location: "",
    date: "",
    images: [] as string[],
    status: "active" as "active" | "claimed" | "resolved",
  });

  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  };

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const onDateChange = (event: any, selected: Date | undefined) => {
    setShowDatePicker(false);
    if (selected) {
      setSelectedDate(selected);
      setFormData((prev) => ({
        ...prev,
        date: `${formatDate(selected)} ${formatTime(selectedTime)}`,
      }));
    }
  };

  const onTimeChange = (event: any, selected: Date | undefined) => {
    setShowTimePicker(false);
    if (selected) {
      setSelectedTime(selected);
      setFormData((prev) => ({
        ...prev,
        date: `${formatDate(selectedDate)} ${formatTime(selected)}`,
      }));
    }
  };

  const pickImage = async () => {
    if (uploading) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    try {
      setUploading(true);
      setUploadProgress(0);
      const assets = result.assets;
      const totalImages = assets.length;
      let uploadedCount = 0;
      const uploadedUrls: string[] = [];
      for (const asset of assets) {
        try {
          const urls = await uploadImage(asset);
          uploadedUrls.push(...urls);
          uploadedCount++;
          setUploadProgress(Math.round((uploadedCount / totalImages) * 100));
        } catch (error) {
          console.error("Single image upload failed:", error);
          throw error;
        }
      }
      const updatedPhotos = [...photos, ...uploadedUrls];
      setPhotos(updatedPhotos);
      setFormData((prev) => ({ ...prev, images: updatedPhotos }));
      Alert.alert("Success", `${uploadedUrls.length} image(s) uploaded successfully!`);
    } catch (error) {
      console.error("Image upload failed:", error);
      Alert.alert("Upload Failed", "Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    setFormData((prev) => ({ ...prev, images: updatedPhotos }));
  };

  const handleContinueStep1 = () => {
    if (!selectedCategory) { Alert.alert("Error", "Please select a category"); return; }
    const categoryName = categories.find((c) => c.id === selectedCategory)?.name || selectedCategory;
    setFormData((prev) => ({ ...prev, category: categoryName }));
    setStep(2);
  };

  const handleContinueStep2 = () => {
    if (!itemName || !color || !location) { Alert.alert("Error", "Please fill in all required fields"); return; }
    setFormData((prev) => ({ ...prev, title: itemName, location, description }));
    setStep(3);
  };

  const handleContinueStep3 = () => {
    if (photos.length === 0) { Alert.alert("Error", "Please add at least one photo"); return; }
    setStep(4);
  };

  const handleSubmit = async () => {
    try {
      setApiCallState((prev) => ({ ...prev, isLoading: true, error: null }));
      const finalFormData = {
        ...formData,
        description: formData.description || "No additional description",
        date: `${formatDate(selectedDate)} ${formatTime(selectedTime)}`,
        images: formData.images.join(","),
      };
      const response = await createItem(finalFormData);
      if (response) {
        setApiCallState((prev) => ({ ...prev, success: true, isLoading: false }));
        Alert.alert("Success", "Lost item reported successfully!", [
          { text: "OK", onPress: () => router.replace("/(tabs)/home") },
        ]);
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      setApiCallState((prev) => ({ ...prev, error: error.message, isLoading: false }));
      Alert.alert("Error", "Failed to submit report. Please try again.");
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>What did you lose?</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Specify the category that best describes your lost item
      </Text>
      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              { backgroundColor: colors.white, borderColor: colors.border },
              selectedCategory === category.id && { borderColor: colors.primary, backgroundColor: colors.primary },
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
                color={selectedCategory === category.id ? "#FFFFFF" : colors.primary}
              />
            </View>
            <Text style={[
              styles.categoryName,
              { color: colors.textPrimary },
              selectedCategory === category.id && { color: "#FFFFFF" },
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={[styles.tipBox, { backgroundColor: colors.gray }]}>
        <Ionicons name="bulb-outline" size={20} color={colors.primary} />
        <View style={styles.tipContent}>
          <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>Quick Tip</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            Choose the category that you feel best describes your lost item.
            You&apos;ll be able to add more details in the next step.
          </Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleContinueStep1}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Basic Information</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Provide details about the item</Text>
      <View style={styles.form}>
        {[
          { label: "Item Name/Title", value: itemName, setter: setItemName, placeholder: "e.g., iPhone 13 Pro" },
          { label: "Brand (Apparel/etc)", value: brand, setter: setBrand, placeholder: "e.g., Apple" },
          { label: "Color", value: color, setter: setColor, placeholder: "e.g., Black" },
        ].map(({ label, value, setter, placeholder }) => (
          <View key={label} style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.white, borderColor: colors.border, color: colors.textPrimary }]}
              value={value}
              onChangeText={setter}
              placeholder={placeholder}
              placeholderTextColor={colors.textLight}
            />
          </View>
        ))}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Date/Last Seen</Text>
          <TouchableOpacity
            style={[styles.inputWithIcon, { backgroundColor: colors.white, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.inputWithIconText, { color: colors.textPrimary }]}>{formatDate(selectedDate)}</Text>
            <Ionicons name="calendar-outline" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Time/Last Seen</Text>
          <TouchableOpacity
            style={[styles.inputWithIcon, { backgroundColor: colors.white, borderColor: colors.border }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={[styles.inputWithIconText, { color: colors.textPrimary }]}>{formatTime(selectedTime)}</Text>
            <Ionicons name="time-outline" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>
        {showTimePicker && (
          <DateTimePicker value={selectedTime} mode="time" display="default" onChange={onTimeChange} />
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Location/Last Seen</Text>
          <View style={[styles.locationInputContainer, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <TextInput
              style={[styles.locationInput, { color: colors.textPrimary }]}
              value={location}
              onChangeText={setLocation}
              placeholder="Phase 2"
              placeholderTextColor={colors.textLight}
            />
            <Ionicons name="location-outline" size={20} color={colors.textLight} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Additional Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.white, borderColor: colors.border, color: colors.textPrimary }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add any additional details..."
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleContinueStep2}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Add Photos & Offer Rewards</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Upload photos</Text>
      <View style={styles.photosSection}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Upload/Add Photo</Text>
        <View style={styles.photosGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoItem}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              {!uploading && (
                <TouchableOpacity style={styles.removePhotoButton} onPress={() => removePhoto(index)}>
                  <Ionicons name="close-circle" size={24} color="#FF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.uploadingText, { color: colors.primary }]}>Uploading {uploadProgress}%</Text>
            </View>
          )}
          {photos.length < 4 && !uploading && (
            <TouchableOpacity
              style={[styles.addPhotoButton, { borderColor: colors.border, backgroundColor: colors.white }]}
              onPress={pickImage}
              disabled={uploading}
            >
              <Ionicons name="camera-outline" size={32} color={colors.primary} />
              <Text style={[styles.addPhotoText, { color: colors.textSecondary }]}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.photoHint, { color: colors.textLight }]}>
          Upload photos of your lost item (up to 4 Photos)
        </Text>
      </View>

      <View style={[styles.rewardToggle, { backgroundColor: colors.white }]}>
        <View>
          <Text style={[styles.rewardToggleLabel, { color: colors.textPrimary }]}>Offer Reward</Text>
          <Text style={[styles.rewardToggleSubtext, { color: colors.textSecondary }]}>
            Optional - Offer a reward for finder
          </Text>
        </View>
        <Switch
          value={offerReward}
          onValueChange={setOfferReward}
          trackColor={{ false: "#D0D0D0", true: colors.primary }}
          thumbColor="#FFFFFF"
          disabled={uploading}
        />
      </View>

      {offerReward && (
        <View style={styles.rewardSection}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Reward Amount</Text>
          <View style={[styles.rewardInput, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <Text style={[styles.currencySymbol, { color: colors.textPrimary }]}>GH₵</Text>
            <TextInput
              style={[styles.rewardAmount, { color: colors.textPrimary }]}
              value={reward}
              onChangeText={setReward}
              placeholder="300"
              placeholderTextColor={colors.textLight}
              keyboardType="numeric"
              editable={!uploading}
            />
          </View>
        </View>
      )}

      <View style={[styles.tipBox, { backgroundColor: colors.gray }]}>
        <Ionicons name="bulb-outline" size={20} color={colors.primary} />
        <View style={styles.tipContent}>
          <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>Photo Tips</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            {"\u2022"} Take clear and well-lit photos from multiple angles{"\n"}
            {"\u2022"} Include any unique features that will help in identifying your item{"\n"}
            {"\u2022"} Verify images are good before submission{"\n"}
            {"\u2022"} Avoid adding pictures with faces
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }, uploading && styles.buttonDisabled]}
        onPress={handleContinueStep3}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderStep4 = () => (
    <>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Review & Submit</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Please verify all information is accurate
      </Text>
      <View style={[styles.reviewCard, { backgroundColor: colors.white }]}>
        <Text style={[styles.reviewTitle, { color: colors.textPrimary }]}>{itemName}</Text>
        {brand && <Text style={[styles.reviewBrand, { color: colors.textSecondary }]}>{brand}</Text>}
        <View style={styles.photosPreview}>
          {photos.map((photo, index) => (
            <Image key={index} source={{ uri: photo }} style={styles.previewImage} />
          ))}
        </View>
        <View style={styles.reviewDetailsSection}>
          {[
            { label: "Color", value: color },
            { label: "Category", value: categories.find((c) => c.id === selectedCategory)?.name },
          ].map(({ label, value }) => (
            <View key={label} style={styles.reviewDetailRow}>
              <Text style={[styles.reviewDetailLabel, { color: colors.textSecondary }]}>{label}</Text>
              <Text style={[styles.reviewDetailValue, { color: colors.textPrimary }]}>{value}</Text>
            </View>
          ))}
          <View style={styles.reviewDetailRow}>
            <Text style={[styles.reviewDetailLabel, { color: colors.textSecondary }]}>Date/Time</Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.reviewDetailValue, { color: colors.textPrimary }]}>{location}</Text>
              <Text style={[styles.reviewDetailValueSmall, { color: colors.textLight }]}>
                {formatDate(selectedDate)} • {formatTime(selectedTime)}
              </Text>
            </View>
          </View>
          <View style={styles.reviewDetailRow}>
            <Text style={[styles.reviewDetailLabel, { color: colors.textSecondary }]}>Location</Text>
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.primary }]}>{location}</Text>
            </View>
          </View>
          {description && (
            <View style={styles.reviewDetailRow}>
              <Text style={[styles.reviewDetailLabel, { color: colors.textSecondary }]}>Description</Text>
              <Text style={[styles.reviewDetailValue, { color: colors.textPrimary }]}>{description}</Text>
            </View>
          )}
        </View>
        {offerReward && reward && (
          <View style={[styles.rewardReviewSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.rewardDisplayLabel, { color: colors.textSecondary }]}>Offer Reward</Text>
            <Text style={[styles.rewardDisplayAmount, { color: colors.textPrimary }]}>GH₵ {reward}</Text>
            <View style={styles.importantBox}>
              <Ionicons name="warning-outline" size={20} color="#FF9800" />
              <View style={styles.importantContent}>
                <Text style={styles.importantTitle}>Important</Text>
                <Text style={[styles.importantText, { color: colors.textSecondary }]}>
                  {"\u2022"} Any report will be visible to verified finders only{"\n"}
                  {"\u2022"} Verified finder(s) will be listed on your report{"\n"}
                  {"\u2022"} Reward will only be given once the item ownership is verified
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }, apiCallState.isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={apiCallState.isLoading}
      >
        <Text style={styles.buttonText}>
          {apiCallState.isLoading ? "Submitting..." : "Submit Report"}
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => (step > 1 ? setStep(step - 1) : router.back())}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${(step / 4) * 100}%`, backgroundColor: colors.primary }]} />
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    gap: 15,
  },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  progressFill: { height: "100%", borderRadius: 2 },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  stepTitle: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  stepSubtitle: { fontSize: 14, marginBottom: 20 },
  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  categoryCard: {
    width: "47%", borderRadius: 12, padding: 16,
    alignItems: "center", borderWidth: 2,
  },
  categoryIconContainer: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(10, 22, 40, 0.05)",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  categoryIconContainerActive: { backgroundColor: "rgba(255, 255, 255, 0.2)" },
  categoryName: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  tipBox: { flexDirection: "row", borderRadius: 12, padding: 16, marginBottom: 20, gap: 12 },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  tipText: { fontSize: 12, lineHeight: 18 },
  form: { marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15 },
  textArea: { height: 100, paddingTop: 12 },
  inputWithIcon: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12,
  },
  inputWithIconText: { fontSize: 15 },
  locationInputContainer: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 15,
  },
  locationInput: { flex: 1, fontSize: 15, paddingVertical: 12 },
  photosSection: { marginBottom: 20 },
  photosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
  photoItem: { width: 100, height: 100, borderRadius: 8, position: "relative" },
  photoImage: { width: "100%", height: "100%", borderRadius: 8 },
  removePhotoButton: { position: "absolute", top: -8, right: -8 },
  addPhotoButton: {
    width: 100, height: 100, borderRadius: 8,
    borderWidth: 2, borderStyle: "dashed",
    justifyContent: "center", alignItems: "center",
  },
  addPhotoText: { fontSize: 12, marginTop: 4 },
  photoHint: { fontSize: 12 },
  rewardToggle: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, borderRadius: 12, marginBottom: 16,
  },
  rewardToggleLabel: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  rewardToggleSubtext: { fontSize: 12 },
  rewardSection: { marginBottom: 20 },
  rewardInput: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12,
  },
  currencySymbol: { fontSize: 18, fontWeight: "600", marginRight: 8 },
  rewardAmount: { flex: 1, fontSize: 18, fontWeight: "600" },
  reviewCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  reviewTitle: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  reviewBrand: { fontSize: 14, marginBottom: 16 },
  photosPreview: { flexDirection: "row", gap: 10, marginBottom: 24 },
  previewImage: { width: 90, height: 90, borderRadius: 8 },
  reviewDetailsSection: { gap: 16 },
  reviewDetailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  reviewDetailLabel: { fontSize: 14, flex: 1 },
  reviewDetailValue: { fontSize: 14, fontWeight: "600", flex: 1, textAlign: "right" },
  reviewDetailValueSmall: { fontSize: 12, textAlign: "right", marginTop: 2 },
  locationBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 14, fontWeight: "600" },
  rewardReviewSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1 },
  rewardDisplayLabel: { fontSize: 14, marginBottom: 4 },
  rewardDisplayAmount: { fontSize: 28, fontWeight: "700", marginBottom: 16 },
  importantBox: { flexDirection: "row", backgroundColor: "rgba(255, 152, 0, 0.1)", borderRadius: 12, padding: 16, gap: 12 },
  importantContent: { flex: 1 },
  importantTitle: { fontSize: 14, fontWeight: "600", color: "#FF9800", marginBottom: 6 },
  importantText: { fontSize: 12, lineHeight: 20 },
  button: { paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 10 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  uploadingOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center", alignItems: "center", zIndex: 10,
  },
  uploadingText: { marginTop: 10, fontSize: 14, fontWeight: "600" },
});