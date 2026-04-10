import ItemCard from "@/components/ItemCard";
import ItemCardSkeleton from "@/components/ItemCardSkeleton";
import { useTheme } from "@/context/ThemeContext";
import { getUserItems, Item } from "@/services/itemsService";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MyItemsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "resolved">("pending");

  const loadItems = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const userItems = await getUserItems();
      setItems(userItems);
    } catch (error) {
      console.error("Error loading user items:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  const pendingItems = items.filter(
    (item) => item.status !== "resolved" && item.status !== "claimed"
  );
  
  const resolvedItems = items.filter(
    (item) => item.status === "resolved" || item.status === "claimed"
  );
  
  const currentItems = activeTab === "pending" ? pendingItems : resolvedItems;

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.gray }]}>
        <Ionicons name="cube-outline" size={60} color={colors.textLight} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No items {activeTab === "pending" ? "pending" : "resolved"}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {activeTab === "pending" 
          ? "Items you report as lost or found will appear here." 
          : "Items that have been successfully returned will appear here."}
      </Text>
      {activeTab === "pending" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/report-lost")}
          >
            <Text style={styles.actionButtonText}>Report Lost</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary, { borderColor: colors.primary }]}
            onPress={() => router.push("/report-found")}
          >
            <Text style={[styles.actionButtonTextSecondary, { color: colors.primary }]}>Report Found</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.white}
      />

      <View style={[styles.header, { backgroundColor: colors.white }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Items</Text>
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: colors.white }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === "pending" ? colors.primary : colors.textLight },
            activeTab === "pending" && { fontWeight: "700" }
          ]}>
            Active ({pendingItems.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "resolved" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab("resolved")}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === "resolved" ? colors.primary : colors.textLight },
            activeTab === "resolved" && { fontWeight: "700" }
          ]}>
            Resolved ({resolvedItems.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ItemCardSkeleton />
          <ItemCardSkeleton />
          <ItemCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={currentItems}
          keyExtractor={(item, index) => item.$id || index.toString()}
          renderItem={({ item }) => <ItemCard item={item as Item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadItems(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
  },
  headerTitle: { fontSize: 24, fontWeight: "700" },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
  },
  loadingContainer: {
    padding: 20,
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: "center", alignItems: "center", marginBottom: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 30, paddingHorizontal: 20 },
  actionButtons: {
    width: "100%",
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  actionButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  actionButtonTextSecondary: {
    fontSize: 15,
    fontWeight: "600",
  },
});
