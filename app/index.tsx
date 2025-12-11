import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SplashScreen() {
  return (
    <ImageBackground
    source={require('../assets/images/background.jpg')}
    style={styles.background}
    resizeMode='cover'
    >
  <View style={styles.container}>
    <StatusBar style="dark" />

    {/* Top section */}
    <View style={styles.topSection}>
      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logo}
      />
      <Text style={styles.tagline}>Find it. Report it. Return it.</Text>
    </View>

    {/* Bottom section */}
    <View style={styles.bottomSection}>
      <Link href="/(onboarding)/onboarding" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </Link>

      <TouchableOpacity>
        <Text style={styles.loginText}>
          Already have an account? <Text style={{ fontWeight: 'bold' }}>Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  </View>
  </ImageBackground>
);
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  logo: {
    width: 200,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#444',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0A1D37',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  loginText: {
    color: '#0A1D37',
    fontSize: 18,
  },
  topSection: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},

bottomSection: {
  width: '100%',
  paddingBottom: 40,
  alignItems: 'center',
  gap: 15,
},

});
