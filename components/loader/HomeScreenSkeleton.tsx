import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SkeletonBase, SkeletonLine, SkeletonCircle } from "./SkeletonBase";
import Colors from "../../constants/Colors";

export default function HomeScreenSkeleton() {
  return (
    <SkeletonBase style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SkeletonCircle size={50} />
          <View>
            <SkeletonLine width={120} height={20} style={styles.mb1} />
            <SkeletonLine width={100} height={12} />
          </View>
        </View>
        <SkeletonCircle size={40} />
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <SkeletonLine width={20} height={20} borderRadius={10} />
          <SkeletonLine width="80%" height={20} />
        </View>
      </View>

      <View style={styles.reportButtons}>
        <View style={styles.reportButton}>
          <SkeletonCircle size={45} />
          <SkeletonLine width={100} height={16} style={styles.mt2} />
          <SkeletonLine width={80} height={12} style={styles.mt1} />
        </View>
        <View style={styles.reportButton}>
          <SkeletonCircle size={45} />
          <SkeletonLine width={100} height={16} style={styles.mt2} />
          <SkeletonLine width={80} height={12} style={styles.mt1} />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <SkeletonLine width={100} height={36} borderRadius={20} />
        <SkeletonLine width={80} height={36} borderRadius={20} />
        <SkeletonLine width={80} height={36} borderRadius={20} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {[1, 2, 3, 4, 5].map((_, index) => (
          <View key={index} style={styles.itemCard}>
            <SkeletonLine width="100%" height={180} borderRadius={12} />
            <View style={styles.cardContent}>
              <SkeletonLine width="80%" height={20} style={styles.mb2} />
              <SkeletonLine width="60%" height={16} style={styles.mb2} />
              <View style={styles.cardFooter}>
                <SkeletonLine width={80} height={14} />
                <SkeletonLine width={60} height={14} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SkeletonBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: Colors.white,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchWrapper: {
    marginHorizontal: 20,
    marginTop: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reportButtons: {
    flexDirection: "row",
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
    alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
    gap: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemCard: {
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardContent: {
    padding: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  mb1: {
    marginBottom: 4,
  },
  mb2: {
    marginBottom: 8,
  },
  mt1: {
    marginTop: 4,
  },
  mt2: {
    marginTop: 8,
  },
});
