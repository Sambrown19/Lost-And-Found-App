import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import {
  account,
  DATABASE_ID,
  databases,
  USERS_COLLECTION_ID,
} from "../../config/appwrite";

export default function EmailVerifiedScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = params.userId as string;
    const secret = params.secret as string;

    console.log("Verification params:", { userId, secret });

    if (userId && secret) {
      verifyEmail(userId, secret);
    } else {
      setError("Invalid verification link");
      setVerifying(false);
    }
  }, [params]);

  const verifyEmail = async (userId: string, secret: string) => {
    try {
      setVerifying(true);

      // Update verification using Appwrite SDK
      await account.updateVerification(userId, secret);

      // Update user document in database
      await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
        is_verified: true,
        is_new_user: false,
        email_verified_at: new Date().toISOString(),
      });

      setVerificationSuccess(true);
      setVerifying(false);
    } catch (error: any) {
      console.error("Verification error:", error);
      setError(
        error.message ||
          "Failed to verify email. The link may have expired or is invalid.",
      );
      setVerifying(false);
    }
  };

  const handleContinue = () => {
    router.replace("/(auth)/login");
  };

  if (verifying) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Verifying your email...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, styles.errorCircle, { backgroundColor: "rgba(255, 82, 82, 0.1)" }]}>
            <Ionicons name="alert-circle" size={80} color="#FF5252" />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Verification Failed</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{error}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleContinue}>
            <Text style={[styles.buttonText, { color: colors.white }]}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: "rgba(76, 175, 80, 0.1)" }]}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        </View>
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Email Verified!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your email has been successfully verified.
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          You can now login to your account.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleContinue}>
          <Text style={[styles.buttonText, { color: colors.white }]}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  errorCircle: {
    // backgroundColor handled inline
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
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
    marginBottom: 8,
  },
  buttonContainer: {
    width: "100%",
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