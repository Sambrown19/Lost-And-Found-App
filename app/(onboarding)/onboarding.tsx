// app/(onboarding)/onboarding.tsx

import { useTheme } from "@/context/ThemeContext";
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    ImageBackground,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Report Lost Items\nEffortlessly',
    description: 'Lost something? Report it fast with photos and location. We will do the searching for you.',
    image: require('../../assets/images/screen1.png'),
  },
  {
    id: '2',
    title: 'Discover Found\nItems Near You',
    description: 'Your lost item might already be here. Browse what others have found nearby.',
    image: require('../../assets/images/screen2.png'),
  },
  {
    id: '3',
    title: 'Connect Securely\n& Get Notified',
    description: 'Verified students only. Chat securely and reunite with your belongings safely.',
    image: require('../../assets/images/screen3.png'),
  },
];

export default function OnboardingScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const handleContinue = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.push('/(auth)/signup');
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/signup');
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => (
    <View style={styles.slide}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>

        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.image} resizeMode="contain" />
        </View>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={require('../../assets/images/background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Dark mode overlay */}
      {isDark && (
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />
      )}
      
      <View style={styles.container}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
        />

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && [styles.activeDot, { backgroundColor: colors.primary }],
                ]}
              />
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={handleContinue}
          >
            <Text style={[styles.buttonText, { color: colors.white }]}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingTop: 50,
    paddingRight: 20,
    paddingBottom: 20,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    width,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    marginBottom: 30,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  footer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
    marginHorizontal: 5,
  },
  activeDot: {
    width: 24,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});