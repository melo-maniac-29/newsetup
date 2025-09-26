import { Tabs, Redirect } from 'expo-router';
import { Home, MapPin, AlertTriangle, User, Shield, Users } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';
import { useEffect } from 'react';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const isRescuer = user?.role === 'rescuer';

  useEffect(() => {
    console.log('TabLayout - loading:', loading, 'user:', user ? `${user.name} exists` : 'null');
  }, [loading, user]);

  if (loading) {
    console.log('TabLayout showing loading');
    return null; // Or a loading spinner
  }

  if (!user) {
    console.log('TabLayout: No user, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }

  console.log('TabLayout: User exists, showing tabs');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.secondary,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: 'SOS',
          tabBarIcon: ({ color, size }) => (
            <Shield color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="safehouses"
        options={{
          title: 'Safe Houses',
          tabBarIcon: ({ color, size }) => (
            <MapPin color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="hazards"
        options={{
          title: 'Hazards',
          tabBarIcon: ({ color, size }) => (
            <AlertTriangle color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size} />
          ),
        }}
      />
      {isRescuer && (
        <Tabs.Screen
          name="rescue"
          options={{
            title: 'Rescue',
            tabBarIcon: ({ color, size }) => (
              <Users color={color} size={size} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}