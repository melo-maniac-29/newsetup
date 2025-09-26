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
import { Shield, MapPin, AlertTriangle, Bell } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/hooks/useFamily';
import { useLocation } from '@/hooks/useLocation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { theme } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { familyMembers } = useFamily(user?.id);
  const { getCurrentLocation } = useLocation();
  
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
  }, []);

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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
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
      </View>

      {/* DigiPIN Card */}
      <Card style={styles.digiPinCard}>
        <View style={styles.digiPinHeader}>
          <Text style={styles.digiPinTitle}>Your DigiPIN</Text>
          <Text style={styles.digiPinSubtitle}>
            Share this with rescuers during emergencies
          </Text>
        </View>
        <View style={styles.digiPinContainer}>
          <Text style={styles.digiPin}>{user.digiPin}</Text>
        </View>
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
    marginBottom: theme.spacing.md,
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
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});