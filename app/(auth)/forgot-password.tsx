// app/(auth)/forgot-password.tsx
// 3-step in-app password reset: Email → OTP → New Password

import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Functions } from "react-native-appwrite";
import { client } from "../../config/appwrite";

const functions = new Functions(client);

const FUNCTION_SEND_OTP = process.env.EXPO_PUBLIC_FUNCTION_SEND_OTP || "";
const FUNCTION_VERIFY_OTP = process.env.EXPO_PUBLIC_FUNCTION_VERIFY_OTP || "";

type Step = "email" | "otp" | "newPassword" | "done";

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const validateEmail = (value: string) =>
    /^[^\s@]+@pentvars\.edu\.gh$/.test(value.toLowerCase());

  const goBack = () => {
    if (step === "email") router.back();
    else if (step === "otp") setStep("email");
    else if (step === "newPassword") setStep("otp");
    else router.back();
  };

  // ─── Step 1: Send OTP ────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!validateEmail(email)) { setError("Please use your @pentvars.edu.gh email."); return; }

    setLoading(true);
    try {
      const result = await functions.createExecution(
        FUNCTION_SEND_OTP,
        JSON.stringify({ email: email.toLowerCase() }),
        false,
      );
      const body = JSON.parse(result.responseBody);
      if (body.userId) setUserId(body.userId);
      setStep("otp");
    } catch (err: any) {
      setStep("otp"); // still advance to prevent enumeration
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ──────────────────────────────────────────────────
  const handleVerifyOtp = () => {
    setError("");
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the full 6-digit code."); return; }
    if (!userId) { setError("Invalid or expired code. Please try again."); return; }
    setStep("newPassword");
  };

  // ─── Step 3: Reset Password ───────────────────────────────────────────────
  const handleResetPassword = async () => {
    setError("");
    if (!newPassword) { setError("Please enter a new password."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const result = await functions.createExecution(
        FUNCTION_VERIFY_OTP,
        JSON.stringify({ userId, code: otp.join(""), mode: "reset", newPassword }),
        false,
      );
      const body = JSON.parse(result.responseBody);
      if (!body.success) {
        setError(body.message || "Failed to reset password. Please try again.");
        return;
      }
      setStep("done");
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP input helpers ───────────────────────────────────────────────────
  const handleOtpChange = (value: string, index: number) => {
    const digits = value.replace(/[^0-9]/g, "");
    const newOtp = [...otp];
    newOtp[index] = digits.slice(-1);
    setOtp(newOtp);
    if (digits && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ─── Shared header (back + logo) ──────────────────────────────────────────
  const renderHeader = () => (
    <>
      <TouchableOpacity style={styles.backButton} onPress={goBack} disabled={loading}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </>
  );

  // ─── Error banner ─────────────────────────────────────────────────────────
  const renderError = () =>
    error ? (
      <View style={[styles.errorBanner, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }]}>
        <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    ) : null;

  // ════════════════════════════════════════════════════════════════════════════
  // STEP: Done
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "done") {
    return (
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {renderHeader()}
          <View style={styles.successCard}>
            <View style={[styles.successIconWrap, { backgroundColor: colors.primary + "20" }]}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Password Updated!</Text>
            <Text style={[styles.successBody, { color: colors.textSecondary }]}>
              Your password has been reset successfully. You can now log in with your new password.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={[styles.buttonText, { color: colors.white }]}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP: New Password
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "newPassword") {
    return (
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {renderHeader()}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>New Password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Choose a strong password for your account.
            </Text>
          </View>

          {renderError()}

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>New Password</Text>
            <View style={[styles.passwordRow, { backgroundColor: colors.white, borderColor: colors.border }]}>
              <TextInput
                style={[styles.passwordInput, { color: colors.textPrimary }]}
                placeholder="At least 8 characters"
                placeholderTextColor={colors.textLight}
                value={newPassword}
                onChangeText={(t) => { setNewPassword(t); if (error) setError(""); }}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Confirm Password</Text>
            <View style={[styles.passwordRow, { backgroundColor: colors.white, borderColor: colors.border }]}>
              <TextInput
                style={[styles.passwordInput, { color: colors.textPrimary }]}
                placeholder="Repeat your password"
                placeholderTextColor={colors.textLight}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); if (error) setError(""); }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={[styles.buttonText, { color: colors.white }]}>Reset Password</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP: OTP
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "otp") {
    return (
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {renderHeader()}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Check Your Email</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We sent a 6-digit code to{" "}
              <Text style={{ fontWeight: "700", color: colors.textPrimary }}>{email}</Text>.
              {"\n"}Enter it below to continue.
            </Text>
          </View>

          {renderError()}

          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { otpRefs.current[i] = r; }}
                style={[
                  styles.otpBox,
                  {
                    backgroundColor: colors.white,
                    borderColor: digit ? colors.primary : colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={digit}
                onChangeText={(v) => handleOtpChange(v, i)}
                onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={[styles.buttonText, { color: colors.white }]}>Verify Code</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendLink}
            onPress={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); }}
            disabled={loading}
          >
            <Text style={[styles.resendText, { color: colors.textSecondary }]}>
              Didn't receive it?{" "}
              <Text style={{ color: colors.primary, fontWeight: "700" }}>Resend code</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP: Email (default)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        {renderHeader()}

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Forgot Password?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your student email and we'll send you a 6-digit code to reset your password.
          </Text>
        </View>

        {renderError()}

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Student Email</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.white,
                borderColor: error ? "#EF4444" : colors.border,
                color: colors.textPrimary,
              },
            ]}
            placeholder="youremail@pentvars.edu.gh"
            placeholderTextColor={colors.textLight}
            value={email}
            onChangeText={(t) => { setEmail(t); if (error) setError(""); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={colors.white} />
            : <Text style={[styles.buttonText, { color: colors.white }]}>Send Code</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.resendLink} disabled={loading}>
          <Text style={[styles.resendText, { color: colors.textSecondary }]}>
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 10, alignSelf: "flex-start", padding: 4 },
  logoContainer: { alignItems: "flex-start", marginBottom: 30 },
  logo: { width: 60, height: 60 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 8, fontWeight: "500" },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
  passwordRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 8 },
  passwordInput: { flex: 1, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
  eyeIcon: { padding: 10 },
  button: { paddingVertical: 15, borderRadius: 10, alignItems: "center", marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: "600" },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: "#EF4444", flex: 1, lineHeight: 18 },
  resendLink: { alignItems: "center", marginTop: 20 },
  resendText: { fontSize: 14 },
  otpRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, gap: 8 },
  otpBox: { flex: 1, height: 56, borderWidth: 2, borderRadius: 10, fontSize: 22, fontWeight: "700" },
  successCard: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 16 },
  successIconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: "700", marginBottom: 12, textAlign: "center" },
  successBody: { fontSize: 14, lineHeight: 22, textAlign: "center" },
});
