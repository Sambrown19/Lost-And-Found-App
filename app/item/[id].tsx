// app/item/itemDetail/[id].tsx

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
import Colors from "../../constants/Colors";
import { getOrCreateConversation } from "../../services/messagesService";
import { getItemById } from "../../services/itemsService";
import { account } from "../../config/appwrite";
import ItemDetailSkeleton from "../../components/loader/ItemDetailSkeleton";

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // Fixed: useLocalSearchParams instead of useSearchParams
  const router = useRouter();
  const [contacting, setContacting] = useState(false);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Parse images, handle both array and string formats
  const imageArray = Array.isArray(item?.images)
    ? item?.images
    : typeof item?.images === "string"
      ? item.images.split(",").map((img) => img.trim())
      : [];

  // Fetch current user
  useEffect(() => {
    getCurrentUser();
  }, []);

  // Fetch item details from database using the ID
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

  // Update isOwner when both item and currentUserId are loaded
  useEffect(() => {
    if (item && currentUserId) {
      setIsOwner(item.userId === currentUserId);
    }
  }, [item, currentUserId]);

  console.log("item", item);

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
      <View style={styles.centerContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={60}
          color={Colors.textSecondary}
        />
        <Text style={styles.errorText}>Item not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.errorButton}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
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
                    <TouchableOpacity
                      style={[styles.navButton, styles.prevButton]}
                      onPress={previousImage}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={30}
                        color={Colors.white}
                      />
                    </TouchableOpacity>
                  )}

                  {currentImageIndex < imageArray.length - 1 && (
                    <TouchableOpacity
                      style={[styles.navButton, styles.nextButton]}
                      onPress={nextImage}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={30}
                        color={Colors.white}
                      />
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
                  {imageArray.map((image, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setCurrentImageIndex(index)}
                      style={[
                        styles.thumbnailButton,
                        currentImageIndex === index && styles.activeThumbnail,
                      ]}
                    >
                      <Image
                        source={{ uri: image }}
                        style={styles.thumbnailImage}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons
                name="image-outline"
                size={50}
                color={Colors.textSecondary}
              />
              <Text style={styles.noImageText}>No image available</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{item.title || "Untitled"}</Text>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.category || "Uncategorized"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>
              {item.location || "Location not specified"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>
              {item.date || "Date not specified"}
            </Text>
          </View>

          {item.status && (
            <View style={styles.infoRow}>
              <Ionicons
                name="information-circle"
                size={16}
                color={Colors.primary}
              />
              <Text style={styles.infoText}>Status: {item.status}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {item.description || "No description provided"}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Posted by</Text>
          <View style={styles.userInfoContainer}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {item.userName?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>
                {item.userName || "Anonymous"}
              </Text>
              {isOwner && (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>You</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Only show contact button if user is NOT the owner */}
      {!isOwner && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactOwner}
            disabled={contacting}
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={Colors.white}
            />
            <Text style={styles.contactButtonText}>
              {contacting ? "Loading..." : "Contact Owner"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: 20,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 300,
    backgroundColor: "#f0f0f0",
  },
  mainImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  navButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  prevButton: {
    left: 10,
  },
  nextButton: {
    right: 10,
  },
  imageCounter: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  imageCounterText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  thumbnailStrip: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    maxHeight: 60,
  },
  thumbnailContent: {
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  thumbnailButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
    overflow: "hidden",
  },
  activeThumbnail: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  noImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 300,
    backgroundColor: "#f5f5f5",
  },
  noImageText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.white,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  ownerBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.white,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  contactButton: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorButtonText: {
    color: Colors.white,
    fontWeight: "600",
  },
});
