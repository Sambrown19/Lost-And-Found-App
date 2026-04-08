import React from "react";
import { View, StyleSheet } from "react-native";
import { SkeletonCircle, SkeletonLine } from "./SkeletonBase";
import Colors from "../../constants/Colors";

export default function ItemCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonLine width="100%" height={160} borderRadius={12} />

      <View style={styles.content}>
        <SkeletonLine width="80%" height={20} style={styles.mb2} />

        <SkeletonLine
          width={80}
          height={24}
          borderRadius={6}
          style={styles.mb2}
        />

        <View style={styles.row}>
          <View style={styles.icon} />
          <SkeletonLine width="60%" height={14} />
        </View>

        <View style={styles.row}>
          <View style={styles.icon} />
          <SkeletonLine width="40%" height={14} />
        </View>

        <View style={styles.footer}>
          <SkeletonLine width={100} height={14} />
          <SkeletonCircle size={30} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    padding: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  icon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#e1e9ee",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  mb2: {
    marginBottom: 8,
  },
});
