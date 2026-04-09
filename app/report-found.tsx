import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

export default function ReportFoundScreen() {
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
  const [foundLocation, setFoundLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

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
    if (selected) setSelectedDate(selected);
  };

  const onTimeChange = (event: any, selected: Date | undefined) => {
    setShowTimePicker(false);
    if (selected) setSelectedTime(selected);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uploadedUrls = (
        await Promise.all(result.assets.map((asset) => uploadImage(asset)))
      ).flat();
      setPhotos([...photos, ...uploadedUrls]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (step === 1 && !selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }
    if (step === 2 && photos.length === 0) {
      Alert.alert("Error", "Please add at least one photo");
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    try {
      const response = await createItem({
        type: "found",
        title: itemName,
        description: description || "No additional description",
        category: categories.find((c) => c.id === selectedCategory)?.name || selectedCategory,
        location: foundLocation,
        date: `${formatDate(selectedDate)} ${formatTime(selectedTime)}`,
        images: photos.join(","),
        status: "active",
      });
      if (response) {
        Alert.alert("Success", "Found item reported successfully!", [
          { text: "OK", onPress: () => router.replace("/(tabs)/home") },
        ]);
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      Alert.alert("Error", "Failed to submit report. Please try again.");
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>What did you find?</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Specify the category that best describes the item you found
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
            Choose the category that you feel best describes the item you found.
            You&apos;ll be able to add more details in the next step.
          </Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Take photos of the item</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Upload/Add Photo</Text>
      <View style={styles.photosSection}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Upload/Add Photo</Text>
        <View style={styles.photosGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoItem}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              <TouchableOpacity style={styles.removePhotoButton} onPress={() => removePhoto(index)}>
                <Ionicons name="close-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 4 && (
            <TouchableOpacity
              style={[styles.addPhotoButton, { borderColor: colors.border, backgroundColor: colors.white }]}
              onPress={pickImage}
            >
              <Ionicons name="camera-outline" size={32} color={colors.primary} />
              <Text style={[styles.addPhotoText, { color: colors.textSecondary }]}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.photoHint, { color: colors.textLight }]}>
          We need clear photos of your item before finding matches
        </Text>
      </View>
      <View style={[styles.tipBox, { backgroundColor: colors.gray }]}>
        <Ionicons name="bulb-outline" size={20} color={colors.primary} />
        <View style={styles.tipContent}>
          <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>Photo Tips</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            {"\u2022"} Take clear and well-lit photos from multiple angles{"\n"}
            {"\u2022"} Include any unique features that will help in identifying the item{"\n"}
            {"\u2022"} Verify images are good before submission{"\n"}
            {"\u2022"} Avoid adding pictures with faces
          </Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Privacy Protection</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        We prioritize your safety and privacy
      </Text>
      <View style={styles.privacySection}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Item Photos</Text>
        <View style={[styles.privacyPreview, { backgroundColor: colors.white }]}>
          <View style={styles.privacyPhotosGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.privacyImageContainer}>
                <Image source={{ uri: photo }} style={styles.privacyImage} blurRadius={10} />
              </View>
            ))}
          </View>
          <View style={styles.privacyBadges}>
            {[
              { icon: "eye-off", label: "Blurred" },
              { icon: "shield-checkmark", label: "Verified" },
            ].map(({ icon, label }) => (
              <View key={label} style={[styles.privacyBadge, { backgroundColor: colors.gray }]}>
                <Ionicons name={icon as any} size={16} color={colors.primary} />
                <Text style={[styles.privacyBadgeText, { color: colors.primary }]}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={[styles.tipBox, { backgroundColor: colors.gray }]}>
        <Ionicons name="bulb-outline" size={20} color={colors.primary} />
        <View style={styles.tipContent}>
          <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>Ready Tip</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            We're going to blur the photos of the found item and only verified
            students can view the non-blurred version. This is done for privacy purposes.
          </Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep4 = () => (
    <>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Item Details</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>Provide details about the item</Text>
      <View style={styles.form}>
        {[
          { label: "Item Name/Title", value: itemName, setter: setItemName, placeholder: "Black Leather Bag" },
          { label: "Brand (If Applicable)", value: brand, setter: setBrand, placeholder: "Brand name" },
          { label: "Color", value: color, setter: setColor, placeholder: "Black" },
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
          <Text style={[styles.label, { color: colors.textPrimary }]}>Date/Found</Text>
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
          <Text style={[styles.label, { color: colors.textPrimary }]}>Time/Found</Text>
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
          <Text style={[styles.label, { color: colors.textPrimary }]}>Found Location</Text>
          <View style={[styles.inputWithIcon, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <TextInput
              style={[styles.inputWithIconText, { color: colors.textPrimary }]}
              value={foundLocation}
              onChangeText={setFoundLocation}
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
            placeholder="I can describe what's inside to verify ownership"
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep5 = () => (
    <>
      <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Item Location</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
        Help the owner locate the item easily. Click on desired location
      </Text>
      <View style={styles.locationOptions}>
        {[
          { icon: "person", label: "I have it with me" },
          { icon: "business", label: "Left at campus security office" },
          { icon: "location-outline", label: "Left at location found" },
          { icon: "school", label: "Left at student support unit" },
        ].map(({ icon, label }) => (
          <TouchableOpacity
            key={label}
            style={[
              styles.locationOption,
              { backgroundColor: colors.white, borderColor: colors.border },
              foundLocation === label && { borderColor: colors.primary, backgroundColor: colors.gray },
            ]}
            onPress={() => setFoundLocation(label)}
          >
            <Ionicons name={icon as any} size={24} color={colors.primary} />
            <Text style={[styles.locationOptionText, { color: colors.textPrimary }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep6 = () => (
    <View style={styles.thankYouContainer}>
      <View style={styles.thankYouIcon}>
        <Image source={require("../assets/images/Thank-you.png")} style={styles.thankYouImage} resizeMode="contain" />
      </View>
      <Text style={[styles.thankYouTitle, { color: colors.textPrimary }]}>Thank You!! 🎉</Text>
      <Text style={[styles.thankYouMessage, { color: colors.textSecondary }]}>
        Your report has been submitted. You&apos;re helping someone get their item back!
      </Text>
      <View style={[styles.reportDetails, { backgroundColor: colors.white }]}>
        <View style={styles.reportDetailItem}>
          <Text style={[styles.reportDetailLabel, { color: colors.textSecondary }]}>OBJECT ID</Text>
          <Text style={[styles.reportDetailValue, { color: colors.textPrimary }]}>HFJD654524S</Text>
        </View>
        <View style={[styles.reportDetailDivider, { backgroundColor: colors.border }]} />
        <View style={styles.reportDetailItem}>
          <Text style={[styles.reportDetailLabel, { color: colors.textSecondary }]}>Date</Text>
          <Text style={[styles.reportDetailValue, { color: colors.textPrimary }]}>{formatDate(selectedDate)}</Text>
        </View>
        <View style={[styles.reportDetailDivider, { backgroundColor: colors.border }]} />
        <View style={styles.reportDetailItem}>
          <Text style={[styles.reportDetailLabel, { color: colors.textSecondary }]}>Location</Text>
          <Text style={[styles.reportDetailValue, { color: colors.textPrimary }]}>Dormitory</Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Back to Homepage</Text>
      </TouchableOpacity>
    </View>
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
          <View style={[styles.progressFill, { width: `${(step / 6) * 100}%`, backgroundColor: colors.primary }]} />
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, gap: 15,
  },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  progressFill: { height: "100%", borderRadius: 2 },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  stepTitle: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  stepSubtitle: { fontSize: 14, marginBottom: 20 },
  categoriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  categoryCard: { width: "47%", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 2 },
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
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  privacySection: { marginBottom: 20 },
  privacyPreview: { borderRadius: 12, padding: 20, alignItems: "center", marginBottom: 20 },
  privacyPhotosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16, justifyContent: "center" },
  privacyImageContainer: { width: 90, height: 90, borderRadius: 12, overflow: "hidden" },
  privacyImage: { width: "100%", height: "100%" },
  privacyBadges: { flexDirection: "row", gap: 10 },
  privacyBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  privacyBadgeText: { fontSize: 12, fontWeight: "600" },
  form: { marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15 },
  textArea: { height: 100, paddingTop: 12 },
  inputWithIcon: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12,
  },
  inputWithIconText: { flex: 1, fontSize: 15 },
  locationOptions: { gap: 12, marginBottom: 20 },
  locationOption: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  locationOptionText: { fontSize: 15, fontWeight: "500", flex: 1 },
  thankYouContainer: { alignItems: "center", paddingVertical: 40 },
  thankYouIcon: { width: 120, height: 120, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  thankYouImage: { width: 100, height: 100 },
  thankYouTitle: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  thankYouMessage: { fontSize: 15, textAlign: "center", marginBottom: 30, paddingHorizontal: 20 },
  reportDetails: { flexDirection: "row", borderRadius: 12, padding: 20, marginBottom: 20, width: "100%" },
  reportDetailItem: { flex: 1, alignItems: "center" },
  reportDetailLabel: { fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  reportDetailValue: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  reportDetailDivider: { width: 1, marginHorizontal: 10 },
  button: { paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 100, width: "100%" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});