import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { SkeletonBase, SkeletonLine, SkeletonCircle } from "./SkeletonBase";
import { useTheme } from "@/context/ThemeContext";

const ConversationItemSkeleton = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.conversationItem, { 
      backgroundColor: colors.white,
      borderBottomColor: colors.border 
    }]}>
      <SkeletonCircle size={60} />
      <View style={styles.conversationInfo}>
        <View style={styles.headerRow}>
          <SkeletonLine width={150} height={18} />
          <SkeletonLine width={50} height={14} />
        </View>
        <SkeletonLine width={200} height={14} style={styles.mt1} />
        <SkeletonLine width={120} height={12} style={styles.mt1} />
      </View>
    </View>
  );
};

export default function ConversationSkeleton() {
  const { colors } = useTheme();
  
  return (
    <SkeletonBase style={styles.container}>
      <View style={[styles.header, { 
        backgroundColor: colors.white,
        borderBottomColor: colors.border 
      }]}>
        <SkeletonLine width={120} height={32} />
      </View>
      <FlatList
        data={[1, 2, 3, 4, 5]}
        renderItem={() => <ConversationItemSkeleton />}
        keyExtractor={(item) => item.toString()}
        showsVerticalScrollIndicator={false}
      />
    </SkeletonBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    gap: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mt1: {
    marginTop: 4,
  },
});