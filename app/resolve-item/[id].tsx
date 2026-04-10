import { useTheme } from "@/context/ThemeContext";
import { updateItemStatus } from "@/services/itemsService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function ResolveItemScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [resolverType, setResolverType] = useState<"self" | "other" | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!resolverType) {
      Alert.alert("Error", "Please tell us how this was resolved.");
      return;
    }
    if (rating === 0) {
      Alert.alert("Error", "Please leave a rating.");
      return;
    }

    setSubmitting(true);
    try {
      // Update item status in Appwrite
      if (id) {
        await updateItemStatus(id as string, "resolved");
      }

      // Here you would typically also save the review to a 'reviews' database table!
      
      Alert.alert(
        "Success! 🎉",
        "Your item has been marked as resolved and your review has been submitted.",
        [
          {
            text: "Back to Home",
            onPress: () => router.replace("/(tabs)/my-items"),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to mark item as resolved.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Resolve & Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconWrapper}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark-done-circle" size={50} color="#FFFFFF" />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>Case Closed!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We're so glad this item's journey has come to an end. How was this resolved?
        </Text>

        <View style={styles.radioGroup}>
          <TouchableOpacity 
            style={[
              styles.radioOption, 
              { borderColor: colors.border, backgroundColor: colors.white },
              resolverType === "other" && { borderColor: colors.primary, backgroundColor: colors.gray }
            ]}
            onPress={() => setResolverType("other")}
          >
            <View style={[styles.radioIcon, { backgroundColor: resolverType === "other" ? colors.primary : colors.gray }]}>
              <Ionicons name="people" size={24} color={resolverType === "other" ? "#FFFFFF" : colors.textSecondary} />
            </View>
            <View style={styles.radioTextContainer}>
              <Text style={[styles.radioTitle, { color: colors.textPrimary }]}>Another user helped me</Text>
              <Text style={[styles.radioSubtitle, { color: colors.textSecondary }]}>Someone contacted me and helped resolve this.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.radioOption, 
              { borderColor: colors.border, backgroundColor: colors.white },
              resolverType === "self" && { borderColor: colors.primary, backgroundColor: colors.gray }
            ]}
            onPress={() => setResolverType("self")}
          >
            <View style={[styles.radioIcon, { backgroundColor: resolverType === "self" ? colors.primary : colors.gray }]}>
              <Ionicons name="person" size={24} color={resolverType === "self" ? "#FFFFFF" : colors.textSecondary} />
            </View>
            <View style={styles.radioTextContainer}>
              <Text style={[styles.radioTitle, { color: colors.textPrimary }]}>I found/resolved it myself</Text>
              <Text style={[styles.radioSubtitle, { color: colors.textSecondary }]}>No other users were involved in this.</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.reviewSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {resolverType === "other" ? "Rate the user & the system" : "Rate the system"}
          </Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons 
                  name={rating >= star ? "star" : "star-outline"} 
                  size={40} 
                  color={rating >= star ? "#FFB800" : colors.textLight} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Leave a review (Optional)</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.white, borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Share your experience..."
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={4}
            value={review}
            onChangeText={setReview}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit & Mark Resolved</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  iconWrapper: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  radioGroup: {
    gap: 12,
    marginBottom: 35,
  },
  radioOption: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  radioIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  radioTextContainer: {
    flex: 1,
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  radioSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  reviewSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  inputSection: {
    marginBottom: 30,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    minHeight: 120,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
