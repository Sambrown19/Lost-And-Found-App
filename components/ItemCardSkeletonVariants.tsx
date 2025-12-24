import React from 'react';
import { StyleSheet, View } from 'react-native';
import Colors from '../constants/Colors';

export const ItemCardSkeletonCompact = () => (
  <View style={styles.compactContainer}>
    <View style={styles.compactImage} />
    <View style={styles.compactContent}>
      <View style={styles.compactTitle} />
      <View style={styles.compactCategory} />
      <View style={styles.compactLocation} />
    </View>
  </View>
);

export const ItemCardSkeletonGrid = () => (
  <View style={styles.gridContainer}>
    <View style={styles.gridImage} />
    <View style={styles.gridContent}>
      <View style={styles.gridTitle} />
      <View style={styles.gridCategory} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compactImage: {
    width: 80,
    height: 80,
    backgroundColor: Colors.border,
    borderRadius: 8,
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
    justifyContent: 'center',
  },
  compactTitle: {
    height: 16,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  compactCategory: {
    height: 14,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginBottom: 6,
    width: '40%',
  },
  compactLocation: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 4,
    width: '50%',
  },
  
  gridContainer: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  gridImage: {
    height: 120,
    backgroundColor: Colors.border,
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    height: 14,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginBottom: 6,
    width: '80%',
  },
  gridCategory: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 4,
    width: '60%',
  },
});