import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';

export default function ConfirmScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { confirmRegistration, resendConfirmationCode } = useAuth();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const colors = {
    background: isDark ? '#0D1117' : '#F8FAFC',
    card: isDark ? '#161B22' : '#FFFFFF',
    text: isDark ? '#E6EDF3' : '#1E293B',
    textSecondary: isDark ? '#8B949E' : '#64748B',
    accent: '#10B981',
    accentDark: '#059669',
    border: isDark ? '#30363D' : '#E2E8F0',
    inputBg: isDark ? '#21262D' : '#F1F5F9',
  };

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = async () => {
    const confirmationCode = code.join('');
    if (confirmationCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email not found. Please try signing up again.');
      router.replace('/(auth)/signup');
      return;
    }

    setIsLoading(true);
    try {
      await confirmRegistration(email, confirmationCode);
      Alert.alert('Success', 'Your account has been verified! Please sign in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error: any) {
      const message = error?.message || 'Failed to verify code';
      Alert.alert('Verification Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Email not found. Please try signing up again.');
      return;
    }

    setIsResending(true);
    try {
      await resendConfirmationCode(email);
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error: any) {
      const message = error?.message || 'Failed to resend code';
      Alert.alert('Error', message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        {/* Back Button */}
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.inputBg }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
            <Mail size={40} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Verify Email</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We've sent a 6-digit code to
          </Text>
          <Text style={[styles.email, { color: colors.text }]}>{email}</Text>
        </View>

        {/* Code Input */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: digit ? colors.accent : colors.border,
                  color: colors.text,
                },
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Confirm Button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: pressed ? colors.accentDark : colors.accent },
          ]}
          onPress={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </Pressable>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            Didn't receive the code?
          </Text>
          <Pressable onPress={handleResendCode} disabled={isResending}>
            <Text style={[styles.resendText, { color: colors.accent, opacity: isResending ? 0.5 : 1 }]}>
              {isResending ? 'Sending...' : 'Resend Code'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
  },
  resendText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

