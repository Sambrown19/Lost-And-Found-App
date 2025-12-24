// components/AnimatedItemCardSkeleton.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Colors from '../constants/Colors';

const AnimatedItemCardSkeleton = () => {
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

  return (
    <View style={styles.container}>
      <View style={styles.imageSkeleton}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
      
      <View style={styles.content}>
        <View style={styles.skeletonWrapper}>
          <View style={[styles.titleSkeleton, styles.skeletonBase]} />
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        </View>
        
        <View style={styles.skeletonWrapper}>
          <View style={[styles.categorySkeleton, styles.skeletonBase]} />
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        </View>
        
        <View style={styles.row}>
          <View style={styles.skeletonWrapper}>
            <View style={[styles.locationSkeleton, styles.skeletonBase]} />
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX }],
                },
              ]}
            />
          </View>
          
          <View style={styles.skeletonWrapper}>
            <View style={[styles.dateSkeleton, styles.skeletonBase]} />
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX }],
                },
              ]}
            />
          </View>
        </View>
        
        <View style={styles.skeletonWrapper}>
          <View style={[styles.descriptionSkeleton, styles.skeletonBase]} />
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        </View>
        
        <View style={styles.skeletonWrapper}>
          <View style={[styles.descriptionSkeletonShort, styles.skeletonBase]} />
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        </View>
        
        <View style={styles.userRow}>
          <View style={styles.skeletonWrapper}>
            <View style={[styles.avatarSkeleton, styles.skeletonBase]} />
            <Animated.View
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX }],
                },
              ]}
            />
          </View>
          
          <View style={styles.userInfo}>
            <View style={styles.skeletonWrapper}>
              <View style={[styles.userNameSkeleton, styles.skeletonBase]} />
              <Animated.View
                style={[
                  styles.shimmer,
                  {
                    transform: [{ translateX }],
                  },
                ]}
              />
            </View>
            
            <View style={styles.skeletonWrapper}>
              <View style={[styles.userSubSkeleton, styles.skeletonBase]} />
              <Animated.View
                style={[
                  styles.shimmer,
                  {
                    transform: [{ translateX }],
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
      
      <View style={[styles.typeSkeleton, styles.skeletonBase]}>
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  
  skeletonWrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  
  skeletonBase: {
    backgroundColor: Colors.border,
  },
  
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  imageSkeleton: {
    height: 180,
    backgroundColor: Colors.border,
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
    borderTopColor: Colors.border,
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