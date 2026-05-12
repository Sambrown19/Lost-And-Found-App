// app/(auth)/login.tsx

import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import { account } from "../../config/appwrite";

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validateEmail = (email: string) => {
    // Must end with @pentvars.edu.gh
    const emailRegex = /^[^\s@]+@pentvars\.edu\.gh$/;
    return emailRegex.test(email.toLowerCase());
  };

  const handleLogin = async () => {
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage("Please use your Pentecost University email address (@pentvars.edu.gh).");
      return;
    }

    setLoading(true);

    try {
      try {
        await account.deleteSession("current");
      } catch (error) {
        // No active session
      }

      await account.createEmailPasswordSession(email.toLowerCase(), password);

      const user = await account.get();

      // If email is not verified, send them to the verification waiting screen
      if (!user.emailVerification) {
        router.replace("/(auth)/email-verification");
        return;
      }

      // Check if the user has completed their profile
      try {
        const { getUserProfile } = await import("../../services/userService");
        const profile = await getUserProfile();
        if (!profile || !profile.fullName) {
          router.replace("/(auth)/complete-profile");
          return;
        }
      } catch (_) {
        router.replace("/(auth)/complete-profile");
        return;
      }

      console.log("Login successful");

      try {
        const { sendLocalNotification } = await import("../../services/notificationsService");
        const { getUserProfile } = await import("../../services/userService");
        const profile = await getUserProfile();
        const firstName = profile?.fullName?.split(" ")[0] || "";
        await sendLocalNotification("Welcome Back! 👋", `It's great to see you again, ${firstName}.`);
      } catch (err) {
        // ignore
      }

      // Fully verified and profile complete
      setTimeout(() => {
        router.replace("/(tabs)/home");
      }, 100);
    } catch (error: any) {
      if (error.code === 401) {
        setErrorMessage("Incorrect email or password. Please try again.");
      } else if (error.code === 429) {
        setErrorMessage("Too many login attempts. Please wait a moment and try again.");
      } else {
        // Only log truly unexpected errors
        console.error("Unexpected login error:", error);
        setErrorMessage(error.message || "Something went wrong. Please try again.");
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
    >
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Fill in the details to log in to your account
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Student Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.white,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="youremail@pentvars.edu.gh"
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={(t) => { setEmail(t); if (errorMessage) setErrorMessage(""); }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Password</Text>
            <View
              style={[
                styles.passwordContainer,
                {
                  backgroundColor: colors.white,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { color: colors.textPrimary }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textLight}
                value={password}
                onChangeText={(t) => { setPassword(t); if (errorMessage) setErrorMessage(""); }}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Inline error message */}
          {!!errorMessage && (
            <View style={[styles.errorBanner, { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" }]}>
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.white }]}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot-password")}
            style={styles.forgotLink}
            disabled={loading}
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textLight }]}>Or continue with</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Sign Up Link */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/signup")}
            style={styles.signupLink}
            disabled={loading}
          >
            <Text style={[styles.signupText, { color: colors.textSecondary }]}>
              Don't have an account?{" "}
              <Text style={[styles.signupTextBold, { color: colors.primary }]}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "flex-start",
    marginBottom: 30,
  },
  logo: {
    width: 60,
    height: 60,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  forgotLink: {
    alignItems: "center",
    marginTop: 14,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 13,
    color: "#EF4444",
    flex: 1,
    lineHeight: 18,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
  },
  signupLink: {
    alignItems: "center",
  },
  signupText: {
    fontSize: 14,
  },
  signupTextBold: {
    fontWeight: "700",
  },
});