import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated,
  TextInput,
} from "react-native";
import { account } from "../../config/appwrite";

export default function EmailVerificationScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [pastedLink, setPastedLink] = useState("");
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    getUserEmail();
    startPulse();
    startPolling();

    // When user switches back from browser → instantly check
    const sub = AppState.addEventListener("change", (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        checkVerification(false); // silent — auto redirect if verified
      }
      appState.current = nextState;
    });

    return () => {
      sub.remove();
      stopPolling();
    };
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((p) => p - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const startPolling = () => {
    stopPolling();
    // Check every 4 seconds silently
    pollInterval.current = setInterval(() => checkVerification(false), 4000);
  };

  const stopPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const getUserEmail = async () => {
    try {
      const user = await account.get();
      setUserEmail(user.email);
    } catch (e) {}
  };

  const checkVerification = async (showAlert: boolean) => {
    try {
      const user = await account.get();
      if (user.emailVerification) {
        stopPolling();
        router.replace("/(auth)/email-verified");
      } else if (showAlert) {
        Alert.alert(
          "Not Verified Yet",
          "We haven't detected your verification. Please click the link in your email first.",
        );
      }
    } catch (e) {}
  };

  const handleResend = async () => {
    if (!canResend || loading) return;
    try {
      setLoading(true);
      await account.createVerification("https://myapp.local/email-verified");
      setTimer(60);
      setCanResend(false);
      Alert.alert("Sent!", "A new verification email has been sent to your inbox.");
    } catch (error: any) {
      if (!error?.message?.includes("Invalid `url` param")) {
        Alert.alert("Error", error.message || "Failed to resend.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = () => {
    if (!pastedLink) return;
    try {
      // The link looks like: https://myapp.local/email-verified?userId=XXX&secret=YYY
      const urlParams = new URLSearchParams(pastedLink.split("?")[1]);
      const userId = urlParams.get("userId");
      const secret = urlParams.get("secret");

      if (userId && secret) {
        router.replace({
          pathname: "/(auth)/email-verified",
          params: { userId, secret }
        });
      } else {
        Alert.alert("Invalid Link", "Could not find the verification tokens in that link. Please make sure you copied the entire link.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to parse the link.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated icon */}
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
          <Ionicons name="mail-outline" size={64} color={colors.primary} />
        </Animated.View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Check Your Email</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We've sent a verification link to
        </Text>
        {userEmail ? (
          <Text style={[styles.emailText, { color: colors.primary }]}>{userEmail}</Text>
        ) : null}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Click the link in the email. Once verified, you'll be brought back here automatically.
        </Text>
      </View>

      {/* Info box */}
      <View
        style={[
          styles.infoBox,
          { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(10,22,40,0.05)" },
        ]}
      >
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Waiting for verification...
        </Text>
      </View>

      {/* Manual Paste Fallback */}
      <View style={styles.pasteContainer}>
        <Text style={[styles.pasteLabel, { color: colors.textSecondary }]}>
          Expo Go limitation: Long-press the button in your email, copy the link, and paste it below to verify:
        </Text>
        <View style={[styles.pasteInputRow, { borderColor: colors.border, backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF" }]}>
          <TextInput
            style={[styles.pasteInput, { color: colors.textPrimary }]}
            placeholder="Paste your link here..."
            placeholderTextColor={colors.textLight}
            value={pastedLink}
            onChangeText={setPastedLink}
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={[styles.pasteButton, { backgroundColor: pastedLink ? colors.primary : colors.textLight }]} 
            onPress={handleManualVerify}
            disabled={!pastedLink}
          >
            <Text style={styles.pasteButtonText}>Verify</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Resend */}
      <View style={styles.resendRow}>
        <Text style={[styles.resendLabel, { color: colors.textSecondary }]}>
          Didn't receive it?{"  "}
        </Text>
        {canResend ? (
          <TouchableOpacity onPress={handleResend} disabled={loading}>
            <Text style={[styles.resendLink, { color: loading ? colors.textLight : colors.primary }]}>
              {loading ? "Sending…" : "Resend Email"}
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
    width: 130, height: 130, borderRadius: 65,
    justifyContent: "center", alignItems: "center",
  },
  header: { alignItems: "center", marginBottom: 28, gap: 6 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emailText: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  infoBox: {
    flexDirection: "row", alignItems: "center",
    padding: 14, borderRadius: 12, gap: 10, marginBottom: 28,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  primaryButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 15, borderRadius: 12, marginBottom: 20,
  },
  primaryButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  resendLabel: { fontSize: 14 },
  resendLink: { fontSize: 14, fontWeight: "700" },
  timerText: { fontSize: 14, fontWeight: "600" },
  pasteContainer: { marginBottom: 20 },
  pasteLabel: { fontSize: 12, marginBottom: 8, lineHeight: 18 },
  pasteInputRow: {
    flexDirection: "row", borderWidth: 1, borderRadius: 8, overflow: "hidden",
  },
  pasteInput: {
    flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14,
  },
  pasteButton: {
    justifyContent: "center", paddingHorizontal: 16,
  },
  pasteButtonText: { color: "#FFFFFF", fontWeight: "600" },
});