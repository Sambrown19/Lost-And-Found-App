// app/index.tsx

import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { account } from "../config/appwrite";

export default function WelcomeScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Check if user is already logged in
      const user = await account.get();
      // if (!user.emailVerification) {
      //   router.replace("/(auth)/email-verification");
      //   return;
      // }
      // User is logged in, redirect to home
      router.replace("/(tabs)/home");
    } catch (error) {
      // No active session, show splash screen
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/images/background.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Dark mode overlay */}
      {isDark && (
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />
      )}
      
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Find it. Report it. Return it.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(onboarding)/onboarding")}
          >
            <Text style={[styles.buttonText, { color: colors.white }]}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            style={styles.loginLink}
          >
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              Already have an account?{" "}
              <Text style={[styles.loginTextBold, { color: colors.primary }]}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  background: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 180,
  },
  tagline: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 20,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loginLink: {
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
  },
  loginTextBold: {
    fontWeight: "700",
  },
});