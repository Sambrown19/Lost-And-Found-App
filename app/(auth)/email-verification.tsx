// app/(auth)/email-verification.tsx

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import Colors from '../../constants/Colors';

export default function EmailVerificationScreen() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '']); 
  const [timer, setTimer] = useState(15);
  const [canResend, setCanResend] = useState(false);
  
  // Refs for each input
  const inputRefs = useRef<Array<TextInput | null>>([]);

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

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 3) { // Changed to 3
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-dismiss keyboard when all fields are filled
      if (index === 3 && value) { // Changed to 3
        Keyboard.dismiss();
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    // Handle backspace - move to previous input
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    Keyboard.dismiss();
    // TODO: Implement verification logic
    console.log('Verify code:', code.join(''));
    router.push('/(auth)/email-verified');
  };

  const handleResend = () => {
    if (canResend) {
      Keyboard.dismiss();
      // TODO: Implement resend logic
      console.log('Resend verification code');
      setTimer(15);
      setCanResend(false);
      setCode(['', '', '', '']); // Changed to 4 empty strings
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
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-outline" size={60} color={Colors.primary} />
            </View>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Email Verification</Text>
            <Text style={styles.subtitle}>
              We have sent an email verification code to{'\n'}******@pentvars.edu.gh
            </Text>
          </View>

          {/* Code Input */}
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
                returnKeyType={index === 3 ? 'done' : 'next'} // Changed to 3
                blurOnSubmit={index === 3} // Changed to 3
              />
            ))}
          </View>

          {/* Resend */}
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

          {/* Verify Button */}
          <TouchableOpacity style={styles.button} onPress={handleVerify}>
            <Text style={styles.buttonText}>Verify Your Email</Text>
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
    gap: 12, // Slightly reduced gap for 4 inputs
    marginBottom: 30,
  },
  codeInput: {
    width: 65, // Slightly smaller width for 4 inputs
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
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});