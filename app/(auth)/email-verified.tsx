import { Ionicons } from "@expo/vector-icons";
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
import Colors from "../../constants/Colors";
import {
  account,
  DATABASE_ID,
  databases,
  USERS_COLLECTION_ID,
} from "../../config/appwrite";

export default function EmailVerifiedScreen() {
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
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.background}
        />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Verifying your email...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.background}
        />

        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, styles.errorCircle]}>
            <Ionicons name="alert-circle" size={80} color="#FF5252" />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Verification Failed</Text>
          <Text style={styles.subtitle}>{error}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Email Verified!</Text>
        <Text style={styles.subtitle}>
          Your email has been successfully verified.
        </Text>
        <Text style={styles.subtitle}>You can now login to your account.</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    color: Colors.textSecondary,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorCircle: {
    backgroundColor: "rgba(255, 82, 82, 0.1)",
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
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
    marginBottom: 8,
  },
  buttonContainer: {
    width: "100%",
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
