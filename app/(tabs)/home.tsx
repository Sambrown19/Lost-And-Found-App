import ItemCard from "@/components/ItemCard";
import ItemCardSkeleton from "@/components/ItemCardSkeleton";
import HomeScreenSkeleton from "@/components/loader/HomeScreenSkeleton";
import { useTheme } from "@/context/ThemeContext";
import { getAllItems, getItemsByType, Item } from "@/services/itemsService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import debounce from "lodash.debounce";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getInitials, getUserProfile } from "../../services/userService";

interface SearchHistory {
  query: string;
  timestamp: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<"recent" | "lost" | "found">("recent");
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const searchInputRef = useRef<TextInput>(null);
  const searchQueryRef = useRef("");
  const itemsRef = useRef<Item[]>([]);
  const MAX_HISTORY_ITEMS = 5;

  useEffect(() => { searchQueryRef.current = searchQuery; }, [searchQuery]);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem("searchHistory");
      if (history) setSearchHistory(JSON.parse(history));
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
  };

  const saveToSearchHistory = async (query: string) => {
    if (!query.trim()) return;
    try {
      const newHistory: SearchHistory[] = [
        { query, timestamp: Date.now() },
        ...searchHistory.filter((item) => item.query.toLowerCase() !== query.toLowerCase()),
      ].slice(0, MAX_HISTORY_ITEMS);
      setSearchHistory(newHistory);
      await AsyncStorage.setItem("searchHistory", JSON.stringify(newHistory));
    } catch (error) {
      console.error("Failed to save search history:", error);
    }
  };

  const loadItems = async () => {
    setLoadingItems(true);
    try {
      let data: Item[] = [];
      if (activeTab === "recent") {
        data = (await getAllItems()) as unknown as Item[];
      } else if (activeTab === "lost") {
        data = (await getItemsByType("lost")) as unknown as Item[];
      } else {
        data = (await getItemsByType("found")) as unknown as Item[];
      }
      setItems(data);
      itemsRef.current = data;
      setFilteredItems(data);
      if (searchQueryRef.current) performSearch(searchQueryRef.current, data);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoadingItems(false);
      setInitialLoading(false);
    }
  };

  const performSearch = (query: string, itemsToSearch: Item[]) => {
    if (!query.trim()) {
      setFilteredItems(itemsToSearch);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const lowerQuery = query.toLowerCase().trim();
    const results = itemsToSearch.filter((item) => {
      return (
        item.title?.toLowerCase().includes(lowerQuery) ||
        item.category?.toLowerCase().includes(lowerQuery) ||
        item.location?.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery)
      );
    });
    setFilteredItems(results);
    if (results.length > 0) saveToSearchHistory(query);
  };

  const searchItems = useCallback((query: string) => {
    performSearch(query, itemsRef.current);
  }, []);

  const debouncedSearch = useRef(
    debounce((query: string) => { searchItems(query); }, 300),
  ).current;

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setShowHistory(text.length > 0);
    debouncedSearch(text);
  };

  const clearSearch = () => {
    setSearchQuery("");
    searchQueryRef.current = "";
    setFilteredItems(itemsRef.current);
    setIsSearching(false);
    setShowHistory(false);
    Keyboard.dismiss();
  };

  const focusSearch = () => {
    searchInputRef.current?.focus();
    if (searchQuery) setShowHistory(true);
  };

  const selectHistoryItem = (query: string) => {
    setSearchQuery(query);
    searchQueryRef.current = query;
    performSearch(query, itemsRef.current);
    setShowHistory(false);
    Keyboard.dismiss();
  };

  const clearHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem("searchHistory");
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const profile = await getUserProfile();
      if (profile) setUserProfile(profile);
    } catch (error) {
      console.error("Load profile error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUserProfile(); loadSearchHistory(); }, []);
  useEffect(() => { loadItems(); }, [activeTab]);
  useEffect(() => { if (!searchQuery) setFilteredItems(items); }, [items, searchQuery]);

  if (initialLoading) return <HomeScreenSkeleton />;

  const firstName = userProfile?.fullName?.split(" ")[0] || "User";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.white}
      />


      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.white }]}>
        <View style={styles.headerLeft}>
          {userProfile?.profileImage ? (
            <Image source={{ uri: userProfile.profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {getInitials(userProfile?.fullName || "")}
              </Text>
            </View>
          )}
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={[styles.greeting, { color: colors.textPrimary }]}>
                Hello, {firstName} 👋
              </Text>
              {userProfile?.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              )}
            </View>
            <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
              Find your lost items
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <TouchableOpacity
          style={[styles.searchContainer, { backgroundColor: colors.white, borderColor: colors.border }]}
          activeOpacity={0.9}
          onPress={focusSearch}
        >
          <Ionicons name="search" size={20} color={colors.textLight} />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by title, category, or location"
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={() => searchQuery && setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            returnKeyType="search"
            onSubmitEditing={() => { performSearch(searchQuery, itemsRef.current); setShowHistory(false); }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={colors.textLight} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setShowHistory(!showHistory)}>
              <Ionicons name="time-outline" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showHistory && searchHistory.length > 0 && (
          <View style={[styles.historyDropdown, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <View style={[styles.historyHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.historyTitle, { color: colors.textSecondary }]}>Recent Searches</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={[styles.clearHistoryText, { color: colors.textLight }]}>Clear All</Text>
              </TouchableOpacity>
            </View>
            {searchHistory.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.historyItem, { borderBottomColor: colors.border }]}
                onPress={() => selectHistoryItem(item.query)}
              >
                <Ionicons name="time-outline" size={16} color={colors.textLight} />
                <Text style={[styles.historyQuery, { color: colors.textPrimary }]}>{item.query}</Text>
                <TouchableOpacity
                  style={styles.historyDelete}
                  onPress={(e) => {
                    e.stopPropagation();
                    const newHistory = searchHistory.filter((_, i) => i !== index);
                    setSearchHistory(newHistory);
                    AsyncStorage.setItem("searchHistory", JSON.stringify(newHistory));
                  }}
                >
                  <Ionicons name="close" size={14} color={colors.textLight} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {isSearching && searchQuery && (
        <View style={styles.searchResultsHeader}>
          <Text style={[styles.searchResultsText, { color: colors.textSecondary }]}>
            {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""} found
          </Text>
          <Text style={[styles.searchQueryText, { color: colors.textLight }]}>
            for &quot;{searchQuery}&quot;
          </Text>
          <TouchableOpacity onPress={clearSearch} style={[styles.clearSearchButton, { backgroundColor: colors.border }]}>
            <Text style={[styles.clearSearchText, { color: colors.textSecondary }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Report Buttons */}
      <View style={styles.reportButtons}>
        <TouchableOpacity
          style={[styles.reportButton, { backgroundColor: colors.white, borderColor: colors.border }]}
          onPress={() => router.push("/report-lost")}
        >
          <View style={styles.reportIconContainer}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.reportButtonText, { color: colors.textPrimary }]}>Report Lost</Text>
          <Text style={[styles.reportButtonSubtext, { color: colors.textSecondary }]}>Lost something?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reportButton, { backgroundColor: colors.white, borderColor: colors.border }]}
          onPress={() => router.push("/report-found")}
        >
          <View style={[styles.reportIconContainer, styles.reportFoundIconContainer]}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
          </View>
          <Text style={[styles.reportButtonText, { color: colors.textPrimary }]}>Report Found</Text>
          <Text style={[styles.reportButtonSubtext, { color: colors.textSecondary }]}>Found something?</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(["recent", "lost", "found"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              { backgroundColor: colors.white, borderColor: colors.border },
              activeTab === tab && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                activeTab === tab && { color: "#FFFFFF" },
              ]}
            >
              {tab === "recent" ? "Recent Posts" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loadingItems ? (
          <>
            <ItemCardSkeleton />
            <ItemCardSkeleton />
            <ItemCardSkeleton />
            <ItemCardSkeleton />
          </>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            {searchQuery ? (
              <>
                <Ionicons name="search-outline" size={64} color={colors.textLight} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No results found</Text>
                <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
                  No items match &quot;{searchQuery}&quot;
                </Text>
                {searchHistory.length > 0 && (
                  <View style={styles.suggestions}>
                    <Text style={[styles.suggestionsTitle, { color: colors.textSecondary }]}>
                      Try searching for:
                    </Text>
                    {searchHistory.slice(0, 3).map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.suggestionItem, { backgroundColor: colors.border }]}
                        onPress={() => selectHistoryItem(item.query)}
                      >
                        <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>
                          {item.query}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.clearSearchButtonLarge, { backgroundColor: colors.primary }]}
                  onPress={clearSearch}
                >
                  <Text style={styles.clearSearchTextLarge}>Clear Search</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons name="search-outline" size={64} color={colors.textLight} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No items found</Text>
                <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
                  Lost items will appear here
                </Text>
              </>
            )}
          </View>
        ) : (
          filteredItems.map((item) => (
            <ItemCard key={item.$id} item={item} highlightText={searchQuery} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  greeting: { fontSize: 20, fontWeight: "700" },
  subGreeting: { fontSize: 12, marginTop: 2 },
  notificationButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center", position: "relative" },
  notificationBadge: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF4444" },
  searchWrapper: { position: "relative", marginHorizontal: 20, marginTop: 15, zIndex: 1000 },
  searchContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, gap: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 16, padding: 0, margin: 0 },
  historyDropdown: {
    position: "absolute", top: "100%", left: 0, right: 0,
    borderRadius: 10, borderWidth: 1, marginTop: 5,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 5, zIndex: 1001,
  },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1 },
  historyTitle: { fontSize: 14, fontWeight: "600" },
  clearHistoryText: { fontSize: 12 },
  historyItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 12, gap: 10, borderBottomWidth: 1 },
  historyQuery: { flex: 1, fontSize: 14 },
  historyDelete: { padding: 4 },
  searchResultsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 10, marginBottom: 5 },
  searchResultsText: { fontSize: 14, fontWeight: "600" },
  searchQueryText: { fontSize: 12, fontStyle: "italic", flex: 1, marginLeft: 8 },
  clearSearchButton: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  clearSearchText: { fontSize: 12, fontWeight: "600" },
  reportButtons: { flexDirection: "row", paddingHorizontal: 20, marginTop: 15, gap: 12 },
  reportButton: { flex: 1, borderRadius: 12, padding: 15, borderWidth: 1 },
  reportIconContainer: { width: 45, height: 45, borderRadius: 12, backgroundColor: "rgba(10, 22, 40, 0.05)", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  reportFoundIconContainer: { backgroundColor: "rgba(76, 175, 80, 0.1)" },
  reportButtonText: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  reportButtonSubtext: { fontSize: 11 },
  tabsContainer: { flexDirection: "row", paddingHorizontal: 20, marginTop: 20, marginBottom: 15, gap: 15 },
  tab: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1 },
  tabText: { fontSize: 14, fontWeight: "600" },
  content: { flex: 1, paddingHorizontal: 20 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: "600", marginTop: 15 },
  emptySubtext: { fontSize: 14, marginTop: 5, textAlign: "center" },
  suggestions: { marginTop: 20, alignItems: "center" },
  suggestionsTitle: { fontSize: 14, marginBottom: 10 },
  suggestionItem: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginVertical: 4 },
  suggestionText: { fontSize: 14 },
  clearSearchButtonLarge: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  clearSearchTextLarge: { fontSize: 14, color: "#FFFFFF", fontWeight: "600" },
});