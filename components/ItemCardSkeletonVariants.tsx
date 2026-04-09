import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export const ItemCardSkeletonCompact = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[
      styles.compactContainer, 
      { 
        backgroundColor: colors.white,
        borderColor: colors.border,
      }
    ]}>
      <View style={[styles.compactImage, { backgroundColor: colors.border }]} />
      <View style={styles.compactContent}>
        <View style={[styles.compactTitle, { backgroundColor: colors.border }]} />
        <View style={[styles.compactCategory, { backgroundColor: colors.border }]} />
        <View style={[styles.compactLocation, { backgroundColor: colors.border }]} />
      </View>
    </View>
  );
};

export const ItemCardSkeletonGrid = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[
      styles.gridContainer, 
      { 
        backgroundColor: colors.white,
        borderColor: colors.border,
      }
    ]}>
      <View style={[styles.gridImage, { backgroundColor: colors.border }]} />
      <View style={styles.gridContent}>
        <View style={[styles.gridTitle, { backgroundColor: colors.border }]} />
        <View style={[styles.gridCategory, { backgroundColor: colors.border }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  compactImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
    justifyContent: 'center',
  },
  compactTitle: {
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  compactCategory: {
    height: 14,
    borderRadius: 4,
    marginBottom: 6,
    width: '40%',
  },
  compactLocation: {
    height: 12,
    borderRadius: 4,
    width: '50%',
  },
  
  gridContainer: {
    width: '48%',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gridImage: {
    height: 120,
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    height: 14,
    borderRadius: 4,
    marginBottom: 6,
    width: '80%',
  },
  gridCategory: {
    height: 12,
    borderRadius: 4,
    width: '60%',
  },
});