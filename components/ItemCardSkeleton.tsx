// components/AnimatedItemCardSkeleton.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const AnimatedItemCardSkeleton = () => {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  // Determine shimmer color based on theme
  const shimmerColor = colors.white === '#FFFFFF' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.1)';

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.white,
        borderColor: colors.border,
      }
    ]}>
      <View style={[styles.imageSkeleton, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
              backgroundColor: shimmerColor,
            },
          ]}
        />
      </View>
      
      <View style={styles.content}>
        <View style={styles.skeletonWrapper}>
          <View style={[styles.titleSkeleton, { backgroundColor: colors.border }]} />
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
                backgroundColor: shimmerColor,
              },
            ]}
          />
        </View>
        
        <View style={styles.skeletonWrapper}>
          <View style={[styles.categorySkeleton, { backgroundColor: colors.border }]} />
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
                backgroundColor: shimmerColor,
              },
            ]}
          />
        </View>
        
        <View style={styles.row}>
          <View style={styles.skeletonWrapper}>
            <View style={[styles.locationSkeleton, { backgroundColor: colors.border }]} />
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX }],
                  backgroundColor: shimmerColor,
                },
              ]}
            />
          </View>
          
          <View style={styles.skeletonWrapper}>
            <View style={[styles.dateSkeleton, { backgroundColor: colors.border }]} />
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX }],
                  backgroundColor: shimmerColor,
                },
              ]}
            />
          </View>
        </View>
        
        <View style={styles.skeletonWrapper}>
          <View style={[styles.descriptionSkeleton, { backgroundColor: colors.border }]} />
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
                backgroundColor: shimmerColor,
              },
            ]}
          />
        </View>
        
        <View style={styles.skeletonWrapper}>
          <View style={[styles.descriptionSkeletonShort, { backgroundColor: colors.border }]} />
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
                backgroundColor: shimmerColor,
              },
            ]}
          />
        </View>
        
        <View style={[styles.userRow, { borderTopColor: colors.border }]}>
          <View style={styles.skeletonWrapper}>
            <View style={[styles.avatarSkeleton, { backgroundColor: colors.border }]} />
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX }],
                  backgroundColor: shimmerColor,
                },
              ]}
            />
          </View>
          
          <View style={styles.userInfo}>
            <View style={styles.skeletonWrapper}>
              <View style={[styles.userNameSkeleton, { backgroundColor: colors.border }]} />
              <Animated.View
                style={[
                  styles.shimmer,
                  {
                    transform: [{ translateX }],
                    backgroundColor: shimmerColor,
                  },
                ]}
              />
            </View>
            
            <View style={styles.skeletonWrapper}>
              <View style={[styles.userSubSkeleton, { backgroundColor: colors.border }]} />
              <Animated.View
                style={[
                  styles.shimmer,
                  {
                    transform: [{ translateX }],
                    backgroundColor: shimmerColor,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
      
      <View style={[styles.typeSkeleton, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
              backgroundColor: shimmerColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  
  skeletonWrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  imageSkeleton: {
    height: 180,
    overflow: 'hidden',
    position: 'relative',
  },
  
  content: {
    padding: 16,
  },
  
  titleSkeleton: {
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  
  categorySkeleton: {
    height: 16,
    borderRadius: 4,
    marginBottom: 12,
    width: '30%',
  },
  
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  locationSkeleton: {
    height: 14,
    borderRadius: 4,
    width: '40%',
  },
  
  dateSkeleton: {
    height: 14,
    borderRadius: 4,
    width: '25%',
  },
  
  descriptionSkeleton: {
    height: 12,
    borderRadius: 4,
    marginBottom: 6,
    width: '100%',
  },
  
  descriptionSkeletonShort: {
    height: 12,
    borderRadius: 4,
    marginBottom: 6,
    width: '80%',
  },
  
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  
  avatarSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  
  userInfo: {
    flex: 1,
  },
  
  userNameSkeleton: {
    height: 14,
    borderRadius: 4,
    marginBottom: 4,
    width: '40%',
  },
  
  userSubSkeleton: {
    height: 12,
    borderRadius: 4,
    width: '60%',
  },
  
  typeSkeleton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 60,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default AnimatedItemCardSkeleton;