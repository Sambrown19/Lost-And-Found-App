import { Item } from "@/services/itemsService";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "../constants/Colors";
import { useRouter } from "expo-router";

interface Props {
  item: Item;
  onPress?: () => void;
  highlightText?: string;
}

export default function ItemCard({ item }: Props) {
  const statusColor = item.type === "lost" ? "#FF4444" : "#4CAF50";

  console.log("item Card", item);

  const router = useRouter();

  // Helper function to get the first image URL
  const getFirstImage = () => {
    if (!item.images) return null;

    if (typeof item.images === "string") {
      const images = item.images.split(",");
      return images[0]?.trim();
    }

    if (Array.isArray(item.images) && item.images.length > 0) {
      return item.images[0];
    }

    return null;
  };

  const imageUrl = getFirstImage();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/item/${item.$id}`)}
      activeOpacity={0.85}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          // defaultSource={require("../../assets/placeholder.png")}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons
            name={
              item.type === "lost"
                ? "help-circle-outline"
                : "checkmark-circle-outline"
            }
            size={48}
            color={Colors.textLight}
          />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>

          <Text style={[styles.type, { color: statusColor }]}>
            {item.type?.toUpperCase() || "LOST"}
          </Text>
        </View>

        <Text style={styles.category}>{item.category}</Text>

        <View style={styles.meta}>
          <Ionicons
            name="location-outline"
            size={14}
            color={Colors.textLight}
          />
          <Text style={styles.location} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        <Text style={styles.date}>
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
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: "100%",
    height: 160,
    backgroundColor: Colors.border,
  },
  imagePlaceholder: {
    width: "100%",
    height: 160,
    backgroundColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  type: {
    fontSize: 12,
    fontWeight: "700",
  },
  category: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginVertical: 4,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: Colors.textLight,
    flex: 1,
  },
  date: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 6,
  },
});
