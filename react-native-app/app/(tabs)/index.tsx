import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, MapPin, AlertTriangle, Bell, RefreshCw } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/hooks/useFamily';
import { useLocation } from '@/hooks/useLocation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import WeatherDashboard from '@/components/weather/WeatherDashboard';
import { useWeatherConditions } from '@/hooks/useWeatherConditions';
import { theme } from '@/constants/theme';
import { getCurrentDigiPin } from '@/utils/digipin';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { familyMembers } = useFamily(user?.id);
  const { getCurrentLocation } = useLocation();
  const [isRefreshingDigiPin, setIsRefreshingDigiPin] = useState(false);
  const [currentDigiPin, setCurrentDigiPin] = useState(user?.digiPin || 'PENDING-LOCATION');
  
  // Get weather conditions for current location
  const { conditions, loading: weatherLoading, fetchConditionsByCoordinates } = useWeatherConditions();
  
  const updateUserLocation = useMutation(api.users.updateUserLocation);
  
  // Emergency alerts would come from a real alert system
  const alerts: Array<{
    id: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    timestamp: string;
  }> = [];

  const quickActions = [
    {
      icon: Shield,
      title: 'Send SOS',
      description: 'Emergency assistance',
      color: theme.colors.danger,
      onPress: () => router.push('/(tabs)/sos'),
    },
    {
      icon: AlertTriangle,
      title: 'Report Hazard',
      description: 'Report dangerous conditions',
      color: theme.colors.warning,
      onPress: () => router.push('/(tabs)/hazards'),
    },
    {
      icon: MapPin,
      title: 'Find Safe House',
      description: 'Locate nearest shelter',
      color: theme.colors.accent,
      onPress: () => router.push('/(tabs)/safehouses'),
    },
  ];

  useEffect(() => {
    getCurrentLocation();
    // Update local state when user changes
    if (user?.digiPin) {
      setCurrentDigiPin(user.digiPin);
    }
  }, [user?.digiPin]);

  useEffect(() => {
    // Fetch weather data when DigiPIN is available
    if (currentDigiPin && currentDigiPin !== 'PENDING-LOCATION') {
      // For now, use demo coordinates - Mumbai, India
      fetchConditionsByCoordinates(19.0760, 72.8777);
    }
  }, [currentDigiPin, fetchConditionsByCoordinates]);

  const refreshDigiPin = async () => {
    if (!user?.id) return;
    
    setIsRefreshingDigiPin(true);
    
    try {
      const result = await getCurrentDigiPin();
      
      if (result.error) {
        Alert.alert('Location Error', result.error);
        return;
      }
      
      if (result.digiPin) {
        // Update the DigiPIN in backend
        await updateUserLocation({
          userId: user.id as any,
          latitude: result.latitude,
          longitude: result.longitude,
        });
        
        // Update local state immediately
        setCurrentDigiPin(result.digiPin);
        
        Alert.alert(
          'DigiPIN Updated!', 
          `Your new DigiPIN: ${result.digiPin}\nLocation: ${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`
        );
      }
    } catch (error) {
      console.error('DigiPIN refresh error:', error);
      Alert.alert('Error', 'Failed to refresh DigiPIN. Please try again.');
    } finally {
      setIsRefreshingDigiPin(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.authTitle}>Welcome to Emergency Response</Text>
        <Button
          title="Login / Signup"
          onPress={() => router.push('/(auth)/login')}
          variant="accent"
          size="large"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar name={user.name} size="medium" />
          <View style={styles.userDetails}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
        </View>
        <Badge
          label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          variant={user.role === 'rescuer' ? 'accent' : 'primary'}
        />
      </View>

      {/* Live Alerts */}
      {alerts.length > 0 && (
        <Card style={styles.alertsCard}>
          <View style={styles.alertsHeader}>
            <Bell color={theme.colors.accent} size={20} />
            <Text style={styles.alertsTitle}>Live Alerts</Text>
          </View>
          {alerts.slice(0, 2).map((alert) => (
            <View key={alert.id} style={styles.alert}>
              <View style={styles.alertContent}>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Badge
                  label={alert.priority}
                  variant={alert.priority === 'high' ? 'danger' : 'warning'}
                  size="small"
                />
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                <action.icon color={action.color} size={24} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* DigiPIN Card */}
      <Card style={styles.digiPinCard}>
        <View style={styles.digiPinHeader}>
          <View style={styles.digiPinInfo}>
            <Text style={styles.digiPinTitle}>Your DigiPIN</Text>
            <Text style={styles.digiPinSubtitle}>
              Share this with rescuers during emergencies
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshButton, isRefreshingDigiPin && styles.refreshButtonDisabled]}
            onPress={refreshDigiPin}
            disabled={isRefreshingDigiPin}
            activeOpacity={0.7}
          >
            <RefreshCw 
              color={isRefreshingDigiPin ? theme.colors.onSurfaceVariant : theme.colors.accent} 
              size={20} 
              style={[isRefreshingDigiPin && styles.spinning]}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.digiPinContainer}>
          <Text style={styles.digiPin}>{currentDigiPin}</Text>
          {currentDigiPin === 'PENDING-LOCATION' && (
            <Text style={styles.digiPinPending}>
              Tap refresh to generate your DigiPIN
            </Text>
          )}
        </View>
        <Text style={styles.digiPinNote}>
          ✓ Works offline • Updates based on your current location
        </Text>
      </Card>

      {/* Family Status */}
      {familyMembers.length > 0 && (
        <Card style={styles.familyCard}>
          <Text style={styles.familyTitle}>Family Status</Text>
          <View style={styles.familyStats}>
            <View style={styles.familyStat}>
              <Text style={styles.familyStatNumber}>
                {familyMembers.filter(m => m.isAtSafeHouse).length}
              </Text>
              <Text style={styles.familyStatLabel}>At Safe House</Text>
            </View>
            <View style={styles.familyStat}>
              <Text style={styles.familyStatNumber}>
                {familyMembers.length}
              </Text>
              <Text style={styles.familyStatLabel}>Total Members</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Environmental Conditions */}
      <Card style={styles.weatherCard}>
        <Text style={styles.cardTitle}>Environmental Conditions</Text>
        {conditions ? (
          <WeatherDashboard conditions={conditions} />
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {weatherLoading ? '🌤️ Loading weather conditions...' : '❌ Weather data unavailable'}
            </Text>
          </View>
        )}
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  authTitle: {
    ...theme.typography.h2,
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    backgroundColor: theme.colors.secondary,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: theme.spacing.sm,
  },
  welcomeText: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
  },
  userName: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
  },
  alertsCard: {
    margin: theme.spacing.md,
    backgroundColor: `${theme.colors.accent}08`,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  alertsTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginLeft: theme.spacing.xs,
  },
  alert: {
    marginBottom: theme.spacing.sm,
  },
  alertContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alertMessage: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  section: {
    padding: theme.spacing.lg,
  },
  quickActionsCard: {
    margin: theme.spacing.lg,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    width: '48%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  actionDescription: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  digiPinCard: {
    margin: theme.spacing.lg,
    backgroundColor: theme.colors.secondary,
  },
  digiPinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  digiPinInfo: {
    flex: 1,
  },
  digiPinTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
  },
  digiPinSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  refreshButton: {
    backgroundColor: `${theme.colors.accent}15`,
    borderRadius: theme.borderRadius.lg,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonDisabled: {
    backgroundColor: theme.colors.surfaceVariant,
    opacity: 0.6,
  },
  spinning: {
    transform: [{ rotateZ: '360deg' }],
  },
  digiPinContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  digiPin: {
    ...theme.typography.h1,
    color: theme.colors.accent,
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  digiPinPending: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  digiPinNote: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  familyCard: {
    margin: theme.spacing.lg,
  },
  familyTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  familyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  familyStat: {
    alignItems: 'center',
  },
  familyStatNumber: {
    ...theme.typography.h1,
    color: theme.colors.accent,
  },
  familyStatLabel: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  weatherCard: {
    margin: theme.spacing.lg,
  },
  loadingContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});