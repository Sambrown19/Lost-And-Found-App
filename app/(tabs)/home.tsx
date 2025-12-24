import ItemCard from '@/components/ItemCard';
import AnimatedItemCardSkeleton from '@/components/ItemCardSkeleton';
import { getAllItems, getItemsByType, Item } from '@/services/itemsService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../../constants/Colors';
import { getInitials, getUserProfile } from '../../services/userService';

interface SearchHistory {
  query: string;
  timestamp: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<'recent' | 'lost' | 'found'>('recent');
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  
  const searchInputRef = useRef<TextInput>(null);
  const searchQueryRef = useRef('');
  const itemsRef = useRef<Item[]>([]);
  const MAX_HISTORY_ITEMS = 5;

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const saveToSearchHistory = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      const newHistory: SearchHistory[] = [
        { query, timestamp: Date.now() },
        ...searchHistory.filter(item => item.query.toLowerCase() !== query.toLowerCase())
      ].slice(0, MAX_HISTORY_ITEMS);
      
      setSearchHistory(newHistory);
      await AsyncStorage.setItem('searchHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  const loadItems = async () => {
    setLoadingItems(true);
    try {
      let data: Item[] = [];

      if (activeTab === 'recent') {
        data = await getAllItems();
      } else if (activeTab === 'lost') {
        data = await getItemsByType('lost');
      } else {
        data = await getItemsByType('found');
      }

      console.log('📥 Loaded items:', data.length);
      if (data.length > 0) {
        console.log('Sample item:', {
          title: data[0].title,
          category: data[0].category,
          location: data[0].location,
          description: data[0].description?.substring(0, 50)
        });
      }
      
      setItems(data);
      itemsRef.current = data;
      setFilteredItems(data);
      
      if (searchQueryRef.current) {
        performSearch(searchQueryRef.current, data);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoadingItems(false);
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
    
    const results = itemsToSearch.filter(item => {
      const matchesTitle = item.title?.toLowerCase().includes(lowerQuery) || false;
      const matchesCategory = item.category?.toLowerCase().includes(lowerQuery) || false;
      const matchesLocation = item.location?.toLowerCase().includes(lowerQuery) || false;
      const matchesDescription = item.description?.toLowerCase().includes(lowerQuery) || false;
      
      return matchesTitle || matchesCategory || matchesLocation || matchesDescription;
    });

    console.log('✅ Search results:', results.length);
    setFilteredItems(results);
    
    if (results.length > 0) {
      saveToSearchHistory(query);
    }
  };

  const searchItems = useCallback((query: string) => {
    performSearch(query, itemsRef.current);
  }, []);

  const debouncedSearch = useRef(
    debounce((query: string) => {
      searchItems(query);
    }, 300)
  ).current;

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setShowHistory(text.length > 0);
    debouncedSearch(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
    searchQueryRef.current = '';
    setFilteredItems(itemsRef.current);
    setIsSearching(false);
    setShowHistory(false);
    Keyboard.dismiss();
  };

  const focusSearch = () => {
    searchInputRef.current?.focus();
    if (searchQuery) {
      setShowHistory(true);
    }
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
      await AsyncStorage.removeItem('searchHistory');
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  useEffect(() => {
    loadUserProfile();
    loadSearchHistory();
  }, []);

  useEffect(() => {
    loadItems();
  }, [activeTab]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredItems(items);
    }
  }, [items]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const profile = await getUserProfile();
      if(profile){
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const firstName = userProfile?.fullName?.split(' ')[0] || 'User';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {userProfile?.profileImage ? (
            <Image
              source={{ uri: userProfile.profileImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(userProfile?.fullName || '')}
              </Text>
            </View>
          )}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.greeting}>Hello, {firstName} 👋</Text>
                {userProfile?.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                )}
            </View>
            <Text style={styles.subGreeting}>Find your lost items</Text>
            </View>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <TouchableOpacity 
          style={styles.searchContainer}
          activeOpacity={0.9}
          onPress={focusSearch}
        >
          <Ionicons name="search" size={20} color={Colors.textLight} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search by title, category, or location"
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={() => searchQuery && setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            returnKeyType="search"
            onSubmitEditing={() => {
              performSearch(searchQuery, itemsRef.current);
              setShowHistory(false);
            }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setShowHistory(!showHistory)}>
              <Ionicons name="time-outline" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showHistory && searchHistory.length > 0 && (
          <View style={styles.historyDropdown}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearHistoryText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            {searchHistory.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => selectHistoryItem(item.query)}
              >
                <Ionicons name="time-outline" size={16} color={Colors.textLight} />
                <Text style={styles.historyQuery}>{item.query}</Text>
                <TouchableOpacity 
                  style={styles.historyDelete}
                  onPress={(e) => {
                    e.stopPropagation();
                    const newHistory = searchHistory.filter((_, i) => i !== index);
                    setSearchHistory(newHistory);
                    AsyncStorage.setItem('searchHistory', JSON.stringify(newHistory));
                  }}
                >
                  <Ionicons name="close" size={14} color={Colors.textLight} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {isSearching && searchQuery && (
        <View style={styles.searchResultsHeader}>
          <Text style={styles.searchResultsText}>
            {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} found
          </Text>
          {searchQuery && (
            <Text style={styles.searchQueryText}>
              for &quot;{searchQuery}&quot;
            </Text>
          )}
          <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
            <Text style={styles.clearSearchText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.reportButtons}>
        <TouchableOpacity 
            style={styles.reportButton}
            onPress={() => router.push('/report-lost')}
        >
            <View style={styles.reportIconContainer}>
            <Ionicons name="alert-circle-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.reportButtonText}>Report Lost</Text>
            <Text style={styles.reportButtonSubtext}>Lost something?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.reportButton, styles.reportFoundButton]}
            onPress={() => router.push('/report-found')}
        >
            <View style={[styles.reportIconContainer, styles.reportFoundIconContainer]}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.reportButtonText}>Report Found</Text>
            <Text style={styles.reportButtonSubtext}>Found something?</Text>
        </TouchableOpacity>
        </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
            Recent Posts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'lost' && styles.tabActive]}
          onPress={() => setActiveTab('lost')}
        >
          <Text style={[styles.tabText, activeTab === 'lost' && styles.tabTextActive]}>
            Lost
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'found' && styles.tabActive]}
          onPress={() => setActiveTab('found')}
        >
          <Text style={[styles.tabText, activeTab === 'found' && styles.tabTextActive]}>
            Found
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loadingItems ? (
           <>
            <AnimatedItemCardSkeleton />
            <AnimatedItemCardSkeleton />
            <AnimatedItemCardSkeleton />
            <AnimatedItemCardSkeleton />
          </>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            {searchQuery ? (
              <>
                <Ionicons name="search-outline" size={64} color={Colors.textLight} />
                <Text style={styles.emptyText}>No results found</Text>
                <Text style={styles.emptySubtext}>
                  No items match &quot;{searchQuery}&quot;
                </Text>
                {searchHistory.length > 0 && (
                  <View style={styles.suggestions}>
                    <Text style={styles.suggestionsTitle}>Try searching for:</Text>
                    {searchHistory.slice(0, 3).map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionItem}
                        onPress={() => selectHistoryItem(item.query)}
                      >
                        <Text style={styles.suggestionText}>{item.query}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.clearSearchButtonLarge}
                  onPress={clearSearch}
                >
                  <Text style={styles.clearSearchTextLarge}>Clear Search</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons name="search-outline" size={64} color={Colors.textLight} />
                <Text style={styles.emptyText}>No items found</Text>
                <Text style={styles.emptySubtext}>Lost items will appear here</Text>
              </>
            )}
          </View>
        ) : (
          filteredItems.map((item) => (
            <ItemCard
              key={item.$id}
              item={item}
              onPress={() =>
                router.push({
                  pathname: '/item/[id]',
                  params: { id: item?.$id },
                })
              }
              highlightText={searchQuery}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: Colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subGreeting: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  searchWrapper: {
    position: 'relative',
    marginHorizontal: 20,
    marginTop: 15,
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    padding: 0,
    margin: 0,
  },
  historyDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1001,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  clearHistoryText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyQuery: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  historyDelete: {
    padding: 4,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
  },
  searchResultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  searchQueryText: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
    flex: 1,
    marginLeft: 8,
  },
  clearSearchButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.border,
    borderRadius: 12,
  },
  clearSearchText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  reportButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 15,
    gap: 12,
  },
  reportButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reportFoundButton: {},
  reportIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 22, 40, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportFoundIconContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  reportButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  reportButtonSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
    gap: 15,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 5,
    textAlign: 'center',
  },
  suggestions: {
    marginTop: 20,
    alignItems: 'center',
  },
  suggestionsTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  suggestionItem: {
    backgroundColor: Colors.border,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 4,
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  clearSearchButtonLarge: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  clearSearchTextLarge: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
});