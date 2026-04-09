import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { account } from "../../config/appwrite";

export default function EmailVerificationScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    // Send verification email when component mounts
    sendVerificationEmail();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const sendVerificationEmail = async () => {
    try {
      setLoading(true);

      // Get current user
      const user = await account.get();
      setUserId(user.$id);

      // Create email verification - Appwrite will send the email
      // The URL should point to your email-verified screen
      const verificationUrl = "LostAndFound_App://email-verified"; // Update with your actual URL

      await account.createVerification(verificationUrl);

      console.log("Verification email sent successfully");
      Alert.alert(
        "Success",
        "Verification email has been sent to your email address",
      );
    } catch (error: any) {
      console.error("Send verification error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to send verification email. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (canResend && !loading) {
      try {
        await sendVerificationEmail();
        setTimer(60);
        setCanResend(false);
      } catch (error) {
        console.error("Resend error:", error);
      }
    }
  };

  const handleContinue = () => {
    // Navigate to login or home screen
    router.replace("/(auth)/login");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.iconContainer}>
          <View style={[
            styles.iconCircle, 
            { 
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(10, 22, 40, 0.1)',
            }
          ]}>
            <Ionicons name="mail-outline" size={60} color={colors.primary} />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Check Your Email</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We've sent a verification link to your email address. Please check
            your inbox and click the link to verify your account.
          </Text>
        </View>

        <View style={[
          styles.infoContainer, 
          { 
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(10, 22, 40, 0.05)',
          }
        ]}>
          <Ionicons
            name="mail-unread-outline"
            size={24}
            color={colors.primary}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Didn't receive the email? Check your spam folder or request a new
            one.
          </Text>
        </View>

        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: colors.textSecondary }]}>
            {!canResend ? (
              <>Resend available in {formatTime(timer)}</>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={loading}>
                <Text
                  style={[
                    styles.resendLink,
                    { color: colors.primary },
                    loading && styles.resendLinkDisabled,
                  ]}
                >
                  {loading ? "Sending..." : "Resend Verification Email"}
                </Text>
              </TouchableOpacity>
            )}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]} 
          onPress={handleContinue}
        >
          <Text style={[styles.buttonText, { color: colors.white }]}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  infoContainer: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    gap: 12,
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontWeight: "600",
  },
  resendLinkDisabled: {
    opacity: 0.6,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});