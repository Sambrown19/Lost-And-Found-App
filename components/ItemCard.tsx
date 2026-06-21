import { useTheme } from "@/context/ThemeContext";
import { Item } from "@/services/itemsService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  item: Item;
  onPress?: () => void;
  highlightText?: string;
  currentUserId?: string | null;
}

export default function ItemCard({ item, currentUserId }: Props) {
  const { colors } = useTheme();
  const statusColor = item.type === "lost" ? "#FF4444" : "#4CAF50";
  const router = useRouter();

  const isOwner = currentUserId !== undefined ? item.userId === currentUserId : true;
  const shouldBlur = item.type === "found" && !isOwner;

  const getFirstImage = () => {
    if (!item.images) return null;
    if (typeof item.images === "string") {
      const images = item.images.split(",");
      return images[0]?.trim();
    }
    if (Array.isArray(item.images) && (item.images as string[]).length > 0) {
      return item.images[0];
    }
    return null;
  };

  const imageUrl = getFirstImage();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.white, borderColor: colors.border }]}
      onPress={() => router.push(`/item/${item.$id}`)}
      activeOpacity={0.85}
    >
      {imageUrl ? (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageUrl }}
            style={[styles.image, { backgroundColor: colors.border }]}
            blurRadius={shouldBlur ? 20 : 0}
          />
          {shouldBlur && (
            <View style={styles.blurOverlay}>
              <View style={styles.blurIconBox}>
                <Ionicons name="eye-off" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.blurText}>Photos are hidden</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.gray }]}>
          <Ionicons
            name={item.type === "lost" ? "help-circle-outline" : "checkmark-circle-outline"}
            size={48}
            color={colors.textLight}
          />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.type, { color: statusColor }]}>
            {item.type?.toUpperCase() || "LOST"}
          </Text>
        </View>

        <Text style={[styles.category, { color: colors.textSecondary }]}>
          {item.category}
        </Text>

        <View style={styles.meta}>
          <Ionicons name="location-outline" size={14} color={colors.textLight} />
          <Text style={[styles.location, { color: colors.textLight }]} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        {item.type === "lost" && item.reward ? (
          <View style={styles.rewardBadge}>
            <Ionicons name="gift-outline" size={12} color="#FFFFFF" />
            <Text style={styles.rewardBadgeText}>GH₵ {item.reward} Reward</Text>
          </View>
        ) : null}

        <Text style={[styles.date, { color: colors.textLight }]}>
          {item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : "Date not available"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  image: {
    width: "100%",
    height: 160,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 160,
    overflow: "hidden",
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  blurIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  blurText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  imagePlaceholder: {
    width: "100%",
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { padding: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  type: { fontSize: 12, fontWeight: "700" },
  category: { fontSize: 12, marginVertical: 4 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  location: { fontSize: 12, flex: 1 },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#22C55E",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 5,
  },
  rewardBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  date: { fontSize: 11, marginTop: 6 },
});