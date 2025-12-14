// app/(auth)/email-verification.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { account } from '../../config/appwrite';
import Colors from '../../constants/Colors';

export default function EmailVerificationScreen() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [secret, setSecret] = useState('');
  
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    // Send verification email when component mounts
    sendVerificationEmail();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const sendVerificationEmail = async () => {
    try {
      // Get current user
      const user = await account.get();
      setUserId(user.$id);

      // Create email verification
      const verification = await account.createVerification(
        'http://localhost:8081' // This URL doesn't matter for now
      );
      setSecret(verification.secret);
      
      console.log('Verification email sent');
    } catch (error: any) {
      console.error('Send verification error:', error);
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }

      if (index === 3 && value) {
        Keyboard.dismiss();
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 4) {
      Alert.alert('Error', 'Please enter the complete verification code');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      // Note: Appwrite sends a long verification code via email
      // For development, we'll simulate verification
      // In production, you'd verify with: await account.updateVerification(userId, verificationCode);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, accept any 4-digit code for testing
      console.log('Verification code:', verificationCode);
      
      router.replace('/(auth)/email-verified');
    } catch (error: any) {
      console.error('Verification error:', error);
      
      if (error.code === 401) {
        Alert.alert('Invalid Code', 'The verification code is incorrect. Please try again.');
      } else {
        Alert.alert('Error', error.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (canResend) {
      Keyboard.dismiss();
      setLoading(true);
      
      try {
        await sendVerificationEmail();
        setTimer(60);
        setCanResend(false);
        setCode(['', '', '', '']);
        Alert.alert('Success', 'Verification code has been resent to your email.');
      } catch (error) {
        Alert.alert('Error', 'Failed to resend code. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-outline" size={60} color={Colors.primary} />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Email Verification</Text>
            <Text style={styles.subtitle}>
              We have sent an email verification code to your registered email
            </Text>
          </View>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {(inputRefs.current[index] = ref)}}
                style={styles.codeInput}
                value={digit}
                onChangeText={(value) => handleCodeChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                returnKeyType={index === 3 ? 'done' : 'next'}
                blurOnSubmit={index === 3}
                editable={!loading}
              />
            ))}
          </View>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn't receive the code?{' '}
              <Text
                style={[styles.resendLink, canResend && styles.resendLinkActive]}
                onPress={handleResend}
              >
                Resend
              </Text>
            </Text>
            {!canResend && (
              <View style={styles.timerContainer}>
                <Ionicons name="time-outline" size={16} color={Colors.textLight} />
                <Text style={styles.timerText}>{formatTime(timer)}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Verify Your Email</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(10, 22, 40, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 30,
  },
  codeInput: {
    width: 65,
    height: 65,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    fontSize: 32,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  resendText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  resendLink: {
    color: Colors.textLight,
    fontWeight: '600',
  },
  resendLinkActive: {
    color: Colors.primary,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timerText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});