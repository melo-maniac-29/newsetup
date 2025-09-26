import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Mail, Phone, Lock } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { theme } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sendOTP = async () => {
    if (!email.trim() && !phone.trim()) {
      Alert.alert('Error', 'Please enter email or phone number');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate OTP sending
      setTimeout(() => {
        setOtpSent(true);
        setIsLoading(false);
        Alert.alert(
          'OTP Sent',
          'A verification code has been sent to your email/phone. Use "123456" for demo purposes.',
          [{ text: 'OK' }]
        );
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    }
  };

  const verifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    // Demo OTP verification
    if (otp !== '123456') {
      Alert.alert('Error', 'Invalid OTP. Use "123456" for demo.');
      return;
    }

    setIsLoading(true);
    
    try {
      await login(email || 'user@example.com', phone || '+1234567890', otp);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPhone('');
    setOtp('');
    setOtpSent(false);
    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Shield color={theme.colors.accent} size={48} />
          </View>
          <Text style={styles.title}>Emergency Response</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </Text>
        </View>

        {/* Login/Signup Form */}
        <Card style={styles.formCard}>
          {!otpSent ? (
            <>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Mail color={theme.colors.onSurfaceVariant} size={20} />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Phone color={theme.colors.onSurfaceVariant} size={20} />
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                </View>
              </View>

              <Text style={styles.orText}>
                Enter either email or phone number to receive OTP
              </Text>

              <Button
                title={isLoading ? 'Sending...' : 'Send OTP'}
                onPress={sendOTP}
                variant="accent"
                size="large"
                disabled={isLoading}
                style={styles.submitButton}
              />
            </>
          ) : (
            <>
              {/* OTP Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Verification Code</Text>
                <View style={styles.inputWrapper}>
                  <Lock color={theme.colors.onSurfaceVariant} size={20} />
                  <TextInput
                    style={styles.textInput}
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    keyboardType="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </View>
              </View>

              <Text style={styles.otpNote}>
                We've sent a verification code to{'\n'}
                {email && <Text style={styles.contactInfo}>{email}</Text>}
                {email && phone && ' or '}
                {phone && <Text style={styles.contactInfo}>{phone}</Text>}
                {'\n\n'}
                <Text style={styles.demoNote}>For demo: use code "123456"</Text>
              </Text>

              <Button
                title={isLoading ? 'Verifying...' : 'Verify & Continue'}
                onPress={verifyOTP}
                variant="accent"
                size="large"
                disabled={isLoading}
                style={styles.submitButton}
              />

              <TouchableOpacity onPress={resetForm} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back to login</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>

        {/* Demo Information */}
        <Card style={styles.demoCard}>
          <Text style={styles.demoTitle}>Demo Information</Text>
          <View style={styles.demoInfo}>
            <Text style={styles.demoText}>• Use any email/phone to register</Text>
            <Text style={styles.demoText}>• OTP code: 123456</Text>
            <Text style={styles.demoText}>• Default role: Civilian</Text>
            <Text style={styles.demoText}>• Rescuer features available in app</Text>
          </View>
        </Card>

        {/* Emergency Features */}
        <Card style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Emergency Features</Text>
          <View style={styles.features}>
            <Text style={styles.feature}>🚨 One-tap SOS with DigiPIN</Text>
            <Text style={styles.feature}>🏠 Safe house check-in with QR codes</Text>
            <Text style={styles.feature}>⚠️ Hazard reporting with photos</Text>
            <Text style={styles.feature}>👨‍👩‍👧‍👦 Family safety tracking</Text>
            <Text style={styles.feature}>🔊 Voice assistance support</Text>
          </View>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: `${theme.colors.accent}15`,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  textInput: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    flex: 1,
    paddingVertical: theme.spacing.md,
    marginLeft: theme.spacing.sm,
  },
  orText: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontStyle: 'italic',
  },
  otpNote: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  contactInfo: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  demoNote: {
    color: theme.colors.accent,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  submitButton: {
    marginBottom: theme.spacing.md,
  },
  backButton: {
    alignSelf: 'center',
  },
  backButtonText: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '500',
  },
  demoCard: {
    backgroundColor: `${theme.colors.accent}08`,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
    marginBottom: theme.spacing.md,
  },
  demoTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.sm,
  },
  demoInfo: {},
  demoText: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  featuresCard: {
    marginBottom: theme.spacing.lg,
  },
  featuresTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.sm,
  },
  features: {},
  feature: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.xs,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});