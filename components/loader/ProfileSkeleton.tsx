import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonBase, SkeletonLine, SkeletonCircle } from "./SkeletonBase";
import { useTheme } from "@/context/ThemeContext";

export default function ProfileSkeleton() {
  const { colors } = useTheme();
  
  return (
    <SkeletonBase style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <SkeletonLine width={100} height={28} />
      </View>

      <View style={styles.profileImageContainer}>
        <SkeletonCircle size={100} />
      </View>

      <View style={styles.userInfo}>
        <SkeletonLine width={150} height={24} style={styles.mb2} />
        <SkeletonLine width={180} height={16} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <SkeletonLine width={40} height={24} style={styles.mb1} />
          <SkeletonLine width={60} height={14} />
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <SkeletonLine width={40} height={24} style={styles.mb1} />
          <SkeletonLine width={60} height={14} />
        </View>
      </View>

      <View style={styles.editButton}>
        <SkeletonLine width="100%" height={44} borderRadius={10} />
      </View>

      <View style={styles.menuContainer}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <View style={[styles.menuIcon, { backgroundColor: colors.border }]} />
            <SkeletonLine width="70%" height={16} />
            <View style={[styles.menuChevron, { backgroundColor: colors.border }]} />
          </View>
        ))}
      </View>
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
    paddingBottom: 20,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  statItem: {
    alignItems: "center",
  },
  statDivider: {
    width: 1,
  },
  editButton: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    gap: 12,
  },
  menuIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  menuChevron: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: "auto",
  },
  mb1: {
    marginBottom: 4,
  },
  mb2: {
    marginBottom: 8,
  },
});