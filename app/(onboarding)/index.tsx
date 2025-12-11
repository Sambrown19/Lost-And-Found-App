// app/(onboarding)/index.tsx

import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.tagline}>Find it. Report it. Return it.</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(onboarding)/onboarding')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/')}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginTextBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 180,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 20,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginTextBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
});