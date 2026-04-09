import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonBase, SkeletonLine, SkeletonCircle } from "./SkeletonBase";
import { useTheme } from "@/context/ThemeContext";

export default function ItemDetailSkeleton() {
  const { colors } = useTheme();
  
  return (
    <SkeletonBase style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.backButtonSkeleton, { backgroundColor: "rgba(255, 255, 255, 0.9)" }]} />
      </View>

      <View style={[styles.imageSkeleton, { backgroundColor: colors.border }]} />

      <View style={styles.content}>
        <SkeletonLine width="80%" height={32} style={styles.mb2} />

        <SkeletonLine
          width={100}
          height={28}
          borderRadius={6}
          style={styles.mb4}
        />

        <View style={styles.infoRow}>
          <View style={[styles.iconSkeleton, { backgroundColor: colors.border }]} />
          <SkeletonLine width="60%" height={16} />
        </View>

        <View style={styles.infoRow}>
          <View style={[styles.iconSkeleton, { backgroundColor: colors.border }]} />
          <SkeletonLine width="50%" height={16} />
        </View>

        <View style={styles.infoRow}>
          <View style={[styles.iconSkeleton, { backgroundColor: colors.border }]} />
          <SkeletonLine width="40%" height={16} />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <SkeletonLine width="35%" height={20} style={styles.mb3} />

        <SkeletonLine width="100%" height={16} style={styles.mb2} />
        <SkeletonLine width="95%" height={16} style={styles.mb2} />
        <SkeletonLine width="80%" height={16} style={styles.mb4} />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <SkeletonLine width="30%" height={20} style={styles.mb3} />

        <View style={styles.userInfoRow}>
          <SkeletonCircle size={50} />
          <View>
            <SkeletonLine width={120} height={18} style={styles.mb1} />
            <SkeletonLine width={60} height={14} />
          </View>
        </View>
      </View>

      <View style={[
        styles.footer, 
        { 
          backgroundColor: colors.white,
          borderTopColor: colors.border,
        }
      ]}>
        <View style={[styles.buttonSkeleton, { backgroundColor: colors.border }]} />
      </View>
    </SkeletonBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButtonSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  imageSkeleton: {
    width: "100%",
    height: 300,
  },
  content: {
    padding: 20,
  },
  mb1: {
    marginBottom: 4,
  },
  mb2: {
    marginBottom: 8,
  },
  mb3: {
    marginBottom: 12,
  },
  mb4: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  iconSkeleton: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  buttonSkeleton: {
    height: 56,
    borderRadius: 12,
  },
});