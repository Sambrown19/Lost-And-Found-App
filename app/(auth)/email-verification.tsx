import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated,
  TextInput,
  Keyboard,
} from "react-native";
import { account, client, FUNCTION_SEND_OTP, FUNCTION_VERIFY_OTP } from "@/config/appwrite";
import { Functions } from "react-native-appwrite";

export default function EmailVerificationScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getUserInfo();
    startPulse();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((p) => p - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  const getUserInfo = async () => {
    try {
      const user = await account.get();
      setUserEmail(user.email);
      setUserId(user.$id);
    } catch (e) {}
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all filled, auto-verify
    if (newOtp.every(digit => digit !== "") && value !== "") {
        Keyboard.dismiss();
        handleVerify(newOtp.join(""));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (submittedCode?: string) => {
    const finalCode = submittedCode || otp.join("");
    if (finalCode.length < 6 || verifying) return;

    try {
      setVerifying(true);
      const functions = new Functions(client);
      
      // Call our verify-otp cloud function
      const response = await functions.createExecution(
        FUNCTION_VERIFY_OTP,
        JSON.stringify({ userId, code: finalCode })
      );

      const result = JSON.parse(response.responseBody);

      if (result.success) {
        router.replace("/(auth)/email-verified");
      } else {
        Alert.alert("Verification Failed", result.message || "Invalid code.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || loading) return;
    try {
      setLoading(true);
      const functions = new Functions(client);
      
      // Call our send-otp cloud function manually
      await functions.createExecution(
        FUNCTION_SEND_OTP,
        JSON.stringify({ userId })
      );

      setTimer(60);
      setCanResend(false);
      Alert.alert("Sent!", "A new 6-digit code has been sent to your email.");
    } catch (error: any) {
      Alert.alert("Error", "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.iconContainer}>
        <Animated.View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(10,22,40,0.07)",
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name="shield-checkmark-outline" size={64} color={colors.primary} />
        </Animated.View>
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Verify Account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter the 6-digit code we sent to
        </Text>
        {userEmail ? (
          <Text style={[styles.emailText, { color: colors.primary }]}>{userEmail}</Text>
        ) : null}
      </View>

      {/* OTP Input Fields */}
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[
              styles.otpInput,
              { 
                borderColor: digit ? colors.primary : colors.border,
                color: colors.textPrimary,
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#fff"
              }
            ]}
            maxLength={1}
            keyboardType="number-pad"
            value={digit}
            onChangeText={(v) => handleOtpChange(v, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.verifyButton, { backgroundColor: colors.primary }]}
        onPress={() => handleVerify()}
        disabled={verifying || otp.join("").length < 6}
      >
        {verifying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.verifyButtonText}>Verify & Continue</Text>
        )}
      </TouchableOpacity>

      <View style={styles.resendRow}>
        <Text style={[styles.resendLabel, { color: colors.textSecondary }]}>
          Didn't receive it?{"  "}
        </Text>
        {canResend ? (
          <TouchableOpacity onPress={handleResend} disabled={loading}>
            <Text style={[styles.resendLink, { color: loading ? colors.textLight : colors.primary }]}>
              {loading ? "Sending…" : "Resend Code"}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.timerText, { color: colors.textLight }]}>
            Resend in {formatTime(timer)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  iconContainer: { alignItems: "center", marginBottom: 32 },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    justifyContent: "center", alignItems: "center",
  },
  header: { alignItems: "center", marginBottom: 40, gap: 4 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: "center" },
  emailText: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
  },
  verifyButton: {
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  verifyButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  resendLabel: { fontSize: 14 },
  resendLink: { fontSize: 14, fontWeight: "700" },
  timerText: { fontSize: 14, fontWeight: "600" },
});