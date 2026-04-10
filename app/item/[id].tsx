import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Dimensions,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { getOrCreateConversation } from "../../services/messagesService";
import { getItemById } from "../../services/itemsService";
import { account } from "../../config/appwrite";
import ItemDetailSkeleton from "../../components/loader/ItemDetailSkeleton";

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const [contacting, setContacting] = useState(false);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const imageArray = Array.isArray(item?.images)
    ? item?.images
    : typeof item?.images === "string"
      ? item.images.split(",").map((img: string) => img.trim())
      : [];

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (id) {
      fetchItemDetails();
    } else {
      console.error("No ID provided");
      Alert.alert("Error", "Invalid item ID");
      router.back();
    }
  }, [id]);

  const getCurrentUser = async () => {
    try {
      const user = await account.get();
      setCurrentUserId(user.$id);
    } catch (error) {
      console.error("Error getting current user:", error);
    }
  };

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      console.log("Fetching item with ID:", id);
      const itemData = await getItemById(id as string);
      console.log("Item data received:", itemData);
      setItem(itemData);
    } catch (error) {
      console.error("Error fetching item:", error);
      Alert.alert("Error", "Failed to load item details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (item && currentUserId) {
      setIsOwner(item.userId === currentUserId);
    }
  }, [item, currentUserId]);

  const handleContactOwner = async () => {
    if (!item) return;

    setContacting(true);
    try {
      console.log("Creating conversation with:", item.userId);
      const conversation = await getOrCreateConversation(
        item.userId,
        item.userName,
        item.$id,
        item.title,
        imageArray[0] || "",
      );

      console.log("Conversation created:", conversation.$id);

      router.push({
        pathname: "/chat/[id]",
        params: {
          id: conversation.$id,
          otherUserId: item.userId,
          otherUserName: item.userName,
          itemId: item.$id,
          itemTitle: item.title,
          itemImage: item.images?.[0] || "",
        },
      });
    } catch (error) {
      console.error("Contact owner error:", error);
      Alert.alert("Error", "Failed to start conversation. Please try again.");
    } finally {
      setContacting(false);
    }
  };

  const nextImage = () => {
    if (currentImageIndex < imageArray.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  if (loading) {
    return <ItemDetailSkeleton />;
  }

  if (!item) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={colors.textSecondary} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Item not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.errorButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.imageContainer}>
          {imageArray.length > 0 ? (
            <>
              <Image
                source={{ uri: imageArray[currentImageIndex] }}
                style={styles.mainImage}
              />

              {imageArray.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <TouchableOpacity style={[styles.navButton, styles.prevButton]} onPress={previousImage}>
                      <Ionicons name="chevron-back" size={30} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}

                  {currentImageIndex < imageArray.length - 1 && (
                    <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={nextImage}>
                      <Ionicons name="chevron-forward" size={30} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </>
              )}

              {imageArray.length > 1 && (
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {currentImageIndex + 1} / {imageArray.length}
                  </Text>
                </View>
              )}

              {imageArray.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.thumbnailStrip}
                  contentContainerStyle={styles.thumbnailContent}
                >
                  {imageArray.map((image: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setCurrentImageIndex(index)}
                      style={[
                        styles.thumbnailButton,
                        currentImageIndex === index && { borderColor: colors.primary, borderWidth: 2 },
                      ]}
                    >
                      <Image source={{ uri: image }} style={styles.thumbnailImage} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={[styles.noImageContainer, { backgroundColor: isDark ? '#2C2C2E' : '#f5f5f5' }]}>
              <Ionicons name="image-outline" size={50} color={colors.textSecondary} />
              <Text style={[styles.noImageText, { color: colors.textSecondary }]}>No image available</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title || "Untitled"}</Text>

          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{item.category || "Uncategorized"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {item.location || "Location not specified"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {item.date || "Date not specified"}
            </Text>
          </View>

          {item.status && (
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>Status: {item.status}</Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Description</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {item.description || "No description provided"}
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Posted by</Text>
          <View style={styles.userInfoContainer}>
            <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.userAvatarText}>
                {item.userName?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
            <View>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>
                {item.userName || "Anonymous"}
              </Text>
              {isOwner && (
                <View style={[styles.ownerBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.ownerBadgeText}>You</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Only show contact button if user is NOT the owner */}
      {!isOwner && item.status !== 'resolved' && (
        <View style={[styles.footer, { backgroundColor: colors.white, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.primary }]}
            onPress={handleContactOwner}
            disabled={contacting}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>
              {contacting ? "Loading..." : item.type === 'lost' ? "Contact Owner" : "Contact Finder"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Show Resolve button if user IS the owner */}
      {isOwner && item.status !== 'resolved' && (
        <View style={[styles.footer, { backgroundColor: colors.white, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/resolve-item/${item.$id}` as any)}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Mark as Resolved</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Show disabled resolved state */}
      {item.status === 'resolved' && (
        <View style={[styles.footer, { backgroundColor: colors.white, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: '#9E9E9E' }]}
            disabled={true}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>This item has been resolved</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  header: { position: "absolute", top: 50, left: 20, zIndex: 10 },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  imageContainer: { position: "relative", width: "100%", height: 300 },
  mainImage: { width: "100%", height: 300, resizeMode: "cover" },
  navButton: {
    position: "absolute", top: "50%", transform: [{ translateY: -25 }],
    width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center", alignItems: "center", zIndex: 10,
  },
  prevButton: { left: 10 },
  nextButton: { right: 10 },
  imageCounter: {
    position: "absolute", top: 12, right: 12, backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, zIndex: 10,
  },
  imageCounterText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  thumbnailStrip: { position: "absolute", bottom: 12, left: 0, right: 0, maxHeight: 60 },
  thumbnailContent: { alignItems: "center", paddingHorizontal: 12, gap: 8 },
  thumbnailButton: {
    width: 50, height: 50, borderRadius: 8, borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)", overflow: "hidden",
  },
  thumbnailImage: { width: "100%", height: "100%", resizeMode: "cover" },
  noImageContainer: { flex: 1, justifyContent: "center", alignItems: "center", height: 300 },
  noImageText: { marginTop: 10, fontSize: 14 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignSelf: "flex-start", marginBottom: 16 },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  infoText: { fontSize: 14, flex: 1 },
  divider: { height: 1, marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 22 },
  userInfoContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  userAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center" },
  userAvatarText: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  userName: { fontSize: 16, fontWeight: "600" },
  ownerBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4, alignSelf: "flex-start" },
  ownerBadgeText: { fontSize: 10, fontWeight: "600", color: "#FFFFFF" },
  footer: { padding: 20, borderTopWidth: 1 },
  contactButton: {
    flexDirection: "row", paddingVertical: 16, borderRadius: 12,
    justifyContent: "center", alignItems: "center", gap: 8,
  },
  contactButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  errorText: { fontSize: 18, marginTop: 12, marginBottom: 20 },
  errorButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  errorButtonText: { color: "#FFFFFF", fontWeight: "600" },
});
