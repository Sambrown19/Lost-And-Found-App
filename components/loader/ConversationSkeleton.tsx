import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { SkeletonBase, SkeletonLine, SkeletonCircle } from "./SkeletonBase";
import Colors from "../../constants/Colors";

const ConversationItemSkeleton = () => (
  <View style={styles.conversationItem}>
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

export default function ConversationSkeleton() {
  return (
    <SkeletonBase style={styles.container}>
      <View style={styles.header}>
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
