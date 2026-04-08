import { Ionicons } from "@expo/vector-icons";
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
import Colors from "../../constants/Colors";

export default function EmailVerificationScreen() {
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
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-outline" size={60} color={Colors.primary} />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification link to your email address. Please check
            your inbox and click the link to verify your account.
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Ionicons
            name="mail-unread-outline"
            size={24}
            color={Colors.primary}
          />
          <Text style={styles.infoText}>
            Didn't receive the email? Check your spam folder or request a new
            one.
          </Text>
        </View>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            {!canResend ? (
              <>Resend available in {formatTime(timer)}</>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={loading}>
                <Text
                  style={[
                    styles.resendLink,
                    loading && styles.resendLinkDisabled,
                  ]}
                >
                  {loading ? "Sending..." : "Resend Verification Email"}
                </Text>
              </TouchableOpacity>
            )}
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Back to Login</Text>
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
    backgroundColor: Colors.background,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(10, 22, 40, 0.1)",
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
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(10, 22, 40, 0.05)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    gap: 12,
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  resendText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resendLink: {
    color: Colors.primary,
    fontWeight: "600",
  },
  resendLinkDisabled: {
    opacity: 0.6,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
