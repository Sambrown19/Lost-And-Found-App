import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  ActivityIndicator,
} from "react-native";
import { account, DATABASE_ID, databases, USERS_COLLECTION_ID } from "../../config/appwrite";
import { useLocalSearchParams } from "expo-router";

export default function EmailVerifiedScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const params = useLocalSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Animate checkmark in then fade in content
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    
    const { userId, secret } = params;
    if (userId && secret) {
      hasFired.current = true; // Lock it instantly
      verifyEmail(userId as string, secret as string);
    } else {
      // Don't error out instantly if params aren't loaded yet on first tick
      if (Object.keys(params).length > 0) {
        setError("No valid verification link parameters found.");
        setVerifying(false);
      }
    }
  }, [params]);

  const verifyEmail = async (userId: string, secret: string) => {
    try {
      setVerifying(true);
      await account.updateVerification(userId, secret);
      
      setVerifying(false);
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Failed to verify email. The link may have expired or is invalid.");
      setVerifying(false);
    }
  };

  const handleContinue = () => {
    router.replace("/(auth)/complete-profile");
  };

  if (verifying) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 20, color: colors.textSecondary }}>Verifying your email securely...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(255, 82, 82, 0.1)" }]}>
            <Ionicons name="alert-circle" size={80} color="#FF5252" />
          </View>
        </View>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Verification Failed</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{error}</Text>
        </View>

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => router.replace("/(auth)/login")}>
          <Text style={[styles.buttonText, { color: colors.white }]}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Success icon */}
      <View style={styles.iconContainer}>
        <Animated.View
          style={[
            styles.iconCircle,
            {
              backgroundColor: "rgba(76, 175, 80, 0.12)",
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={90} color="#4CAF50" />
        </Animated.View>
      </View>

      {/* Text content */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Email Verified!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your email has been successfully verified. You're all set — let's complete your profile to get started!
        </Text>
      </Animated.View>

      {/* Feature highlights */}
      <Animated.View style={[styles.highlights, { opacity: fadeAnim }]}>
        {[
          { icon: "search-outline", text: "Browse lost & found items" },
          { icon: "chatbubbles-outline", text: "Chat with other users" },
          { icon: "shield-checkmark-outline", text: "Trusted community member" },
        ].map((item, i) => (
          <View key={i} style={[styles.highlightRow, { borderColor: colors.border }]}>
            <View style={[styles.highlightIcon, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(10,22,40,0.06)" }]}>
              <Ionicons name={item.icon as any} size={20} color={colors.primary} />
            </View>
            <Text style={[styles.highlightText, { color: colors.textSecondary }]}>{item.text}</Text>
          </View>
        ))}
      </Animated.View>

      {/* CTA */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
        >
          <Text style={[styles.buttonText, { color: colors.white }]}>Complete Your Profile</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    gap: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  highlights: {
    gap: 12,
    marginBottom: 36,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  highlightIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  highlightText: {
    fontSize: 14,
    fontWeight: "500",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});