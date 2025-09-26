import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/constants/theme';

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('Index page - loading:', loading, 'user:', user ? 'exists' : 'null');
  }, [loading, user]);

  if (loading) {
    console.log('Showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (user) {
    console.log('User exists, redirecting to tabs');
    return <Redirect href="/(tabs)" />;
  }

  console.log('No user, redirecting to login');
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
  },
});