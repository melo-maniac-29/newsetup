import React, { useState, useEffect } from 'react';
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
import { Shield, Mail, Phone, User } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { theme } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'civilian' | 'rescuer'>('civilian');
  const [isLoading, setIsLoading] = useState(false);

  // Watch for user changes and redirect
  useEffect(() => {
    if (user) {
      console.log('User detected in login screen, redirecting...');
      // Small delay to ensure state is properly set
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    }
  }, [user, router]);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Starting login from UI...');
      const user = await login(email, name, phone, role);
      console.log('Login successful, user:', user);
      // Navigation will be handled automatically by the authentication routing
      
    } catch (error) {
      console.error('Login failed:', error);
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            Create your account or login
          </Text>
        </View>

        {/* Login/Signup Form */}
        <Card style={styles.formCard}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address *</Text>
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

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <View style={styles.inputWrapper}>
              <User color={theme.colors.onSurfaceVariant} size={20} />
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                autoComplete="name"
              />
            </View>
          </View>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
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

          {/* Role Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'civilian' && styles.roleButtonActive]}
                onPress={() => setRole('civilian')}
              >
                <User color={role === 'civilian' ? theme.colors.surface : theme.colors.onSurfaceVariant} size={16} />
                <Text style={[styles.roleText, role === 'civilian' && styles.roleTextActive]}>Civilian</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'rescuer' && styles.roleButtonActive]}
                onPress={() => setRole('rescuer')}
              >
                <Shield color={role === 'rescuer' ? theme.colors.surface : theme.colors.onSurfaceVariant} size={16} />
                <Text style={[styles.roleText, role === 'rescuer' && styles.roleTextActive]}>Rescuer</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title={isLoading ? 'Creating Account...' : 'Login / Sign Up'}
            onPress={handleLogin}
            variant="accent"
            size="large"
            disabled={isLoading}
            style={styles.submitButton}
          />
        </Card>

        {/* App Information */}
        <Card style={styles.demoCard}>
          <Text style={styles.demoTitle}>How It Works</Text>
          <View style={styles.demoInfo}>
            <Text style={styles.demoText}>• Enter your email and name to create an account</Text>
            <Text style={styles.demoText}>• Choose Civilian for emergency assistance</Text>
            <Text style={styles.demoText}>• Choose Rescuer for emergency response duties</Text>
            <Text style={styles.demoText}>• Your unique DigiPIN will be generated automatically</Text>
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
  roleContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.xs,
  },
  roleButtonActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  roleText: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  roleTextActive: {
    color: theme.colors.surface,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});