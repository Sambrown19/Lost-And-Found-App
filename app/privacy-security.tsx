// app/privacy-security.tsx

import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PrivacySecurityScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const menuItems = [
    {
      id: "change-password",
      icon: "key-outline" as const,
      label: "Change Password",
      sub: "Update your account password",
      onPress: () => router.push("/change-password"),
    },
  ];

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.white }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Privacy &amp; Security</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Card */}
      <View style={[styles.card, { backgroundColor: colors.white }]}>
        <Text style={[styles.sectionLabel, { color: colors.textLight }]}>Account Security</Text>

        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuRow,
              index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
            onPress={item.onPress}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + "18" }]}>
              <Ionicons name={item.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
              <Text style={[styles.menuSub, { color: colors.textSecondary }]}>{item.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  card: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingVertical: 12,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  menuSub: { fontSize: 12 },
});
