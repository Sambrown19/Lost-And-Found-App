// app/(auth)/login.tsx

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Login() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Login Screen - Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
  },
});