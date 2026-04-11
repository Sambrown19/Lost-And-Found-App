// app/(auth)/signup.tsx

import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ID } from "react-native-appwrite";
import { account } from "../../config/appwrite";

export default function SignUpScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@pentvars\.edu\.gh$/;
    return emailRegex.test(email.toLowerCase());
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert(
        "Invalid Email",
        "Please use your Pentecost University email address (@pentvars.edu.gh)",
      );
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 8 characters long",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "Passwords do not match. Please try again.",
      );
      return;
    }

    setLoading(true);

    try {
      // Check if there's an existing session and delete it
      try {
        await account.deleteSession("current");
        console.log("Existing session deleted");
      } catch (error) {
        console.log("No existing session");
      }

      const user = await account.create(
        ID.unique(),
        email.toLowerCase(),
        password,
        email.split("@")[0],
      );
      console.log("User created:", user);

      // Create session so we can send the verification email
      await account.createEmailPasswordSession(email.toLowerCase(), password);
      console.log("Session created");

      try {
        await account.createVerification("https://myapp.local/email-verified");
        console.log("Verification email sent");
      } catch (verifyError: any) {
        if (!verifyError?.message?.includes("Invalid `url` param")) {
          console.error("Verification email failed, deleting session:", verifyError);
          try { await account.deleteSession("current"); } catch (_) {}
          Alert.alert("Verification Failed", verifyError.message || "We couldn't send a verification email.");
          return;
        }
      }

      // Only reach here if everything succeeded
      router.replace("/(auth)/email-verification");
    } catch (error: any) {
      console.error("Sign up error:", error);

      // Clean up any partial session if one was created
      try { await account.deleteSession("current"); } catch (_) {}

      if (error.code === 409) {
        Alert.alert(
          "Account Exists",
          "An account with this email already exists. Please login.",
        );
      } else if (error.code === 429) {
        Alert.alert(
          "Too Many Attempts",
          "Rate limit exceeded. Please wait a few minutes and try again.",
        );
      } else if (error.code === 400) {
        Alert.alert(
          "Invalid Input",
          error.message || "Please check your email and password and try again.",
        );
      } else {
        Alert.alert(
          "Error",
          error.message || "Failed to create account. Please try again.",
        );
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
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Fill in the form to create your account. Get started with your journey
          </Text>
        </View>

        <View style={styles.form}>
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
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Create Password</Text>
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
                placeholder="Min. 8 characters"
                placeholderTextColor={colors.textLight}
                value={password}
                onChangeText={setPassword}
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

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Confirm Password</Text>
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
                placeholder="Re-enter password"
                placeholderTextColor={colors.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
                disabled={loading}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.termsContainer}>
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              By creating an account you agree to our{" "}
              <Text style={[styles.termsLink, { color: colors.primary }]}>Terms of Service</Text> and{" "}
              <Text style={[styles.termsLink, { color: colors.primary }]}>Privacy Policy</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.white }]}>Continue</Text>
            )}
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
  termsContainer: {
    marginBottom: 30,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: "600",
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});