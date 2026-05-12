// app/change-password.tsx

import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { account } from "../config/appwrite";

export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async () => {
    setError("");

    if (!currentPassword) { setError("Please enter your current password."); return; }
    if (!newPassword) { setError("Please enter a new password."); return; }
    if (newPassword.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPassword === currentPassword) { setError("New password must be different from your current password."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await account.updatePassword(newPassword, currentPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      if (err.code === 401) {
        setError("Current password is incorrect. Please try again.");
      } else {
        setError(err.message || "Failed to update password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.white }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={loading}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        {/* Success state */}
        {success ? (
          <View style={[styles.successCard, { backgroundColor: colors.white }]}>
            <View style={[styles.successIconWrap, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Password Updated!</Text>
            <Text style={[styles.successBody, { color: colors.textSecondary }]}>
              Your password has been changed successfully.
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.buttonText, { color: colors.white }]}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.white }]}>
            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
              Enter your current password and choose a new one.
            </Text>

            {/* Error banner */}
            {!!error && (
              <View style={[styles.errorBanner, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }]}>
                <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Current Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Current Password</Text>
              <View style={[styles.passwordRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.passwordInput, { color: colors.textPrimary }]}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.textLight}
                  value={currentPassword}
                  onChangeText={(t) => { setCurrentPassword(t); if (error) setError(""); }}
                  secureTextEntry={!showCurrent}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeIcon}>
                  <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>New Password</Text>
              <View style={[styles.passwordRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.passwordInput, { color: colors.textPrimary }]}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.textLight}
                  value={newPassword}
                  onChangeText={(t) => { setNewPassword(t); if (error) setError(""); }}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeIcon}>
                  <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Confirm New Password</Text>
              <View style={[styles.passwordRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.passwordInput, { color: colors.textPrimary }]}
                  placeholder="Repeat new password"
                  placeholderTextColor={colors.textLight}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); if (error) setError(""); }}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                  <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={[styles.buttonText, { color: colors.white }]}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  body: { padding: 20 },
  card: { borderRadius: 16, padding: 20 },
  sectionHint: { fontSize: 13, lineHeight: 20, marginBottom: 20 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  passwordRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10 },
  passwordInput: { flex: 1, paddingHorizontal: 15, paddingVertical: 13, fontSize: 15 },
  eyeIcon: { padding: 12 },
  button: { paddingVertical: 15, borderRadius: 12, alignItems: "center", marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: "600" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: "#EF4444", flex: 1, lineHeight: 18 },
  // Success
  successCard: { borderRadius: 16, padding: 32, alignItems: "center" },
  successIconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  successBody: { fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 28 },
});
