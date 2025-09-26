import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Shield, MapPin, Clock, Phone, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSOS } from '@/hooks/useSOS';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { theme } from '@/constants/theme';

export default function SOSScreen() {
  const { user } = useAuth();
  const { sosRequest, isLoading, sendSOS: sendSOSRequest, cancelSOS, getAllSOSRequests } = useSOS(user?.id);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Get SOS history (completed or cancelled requests)
  const allRequests = getAllSOSRequests();
  const sosHistory = allRequests.filter(sos => 
    sos.status === 'rescued' || sos.status === 'cancelled'
  ).slice(0, 5); // Show last 5 completed requests

  useEffect(() => {
    if (sosRequest?.status === 'sent') {
      startPulseAnimation();
    }
  }, [sosRequest]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleSendSOS = async () => {
    if (!user) return;
    
    // Check if there's already an active SOS
    if (sosRequest && (sosRequest.status === 'sent' || sosRequest.status === 'in-progress')) {
      Alert.alert(
        'SOS Already Active',
        'You already have an active SOS request. Please wait for rescue or cancel the current request first.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Send Emergency SOS?',
      'This will send an emergency request to rescue services with your current location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await sendSOSRequest(user.id, user.digiPin);
              Alert.alert(
                'SOS Sent Successfully',
                `Emergency request sent with your current location.\nDigiPIN: ${result.digiPin}\nLocation: ${result.location.address || `${result.location.latitude.toFixed(4)}, ${result.location.longitude.toFixed(4)}`}`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send SOS. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleCancelSOS = () => {
    if (!sosRequest) return;
    
    Alert.alert(
      'Cancel SOS Request',
      'Are you sure you want to cancel your emergency request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelSOS(sosRequest.id),
        },
      ]
    );
  };

  const getStatusMessage = () => {
    switch (sosRequest?.status) {
      case 'sent':
        return 'Your SOS has been sent to rescue services. Help is on the way!';
      case 'in-progress':
        return 'A rescuer has been assigned and is heading to your location.';
      case 'rescued':
        return 'Rescue completed! Stay safe.';
      default:
        return '';
    }
  };

  if (!user) {
    return (
      <View style={styles.authRequired}>
        <Text style={styles.authText}>Please log in to use SOS services</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Emergency SOS</Text>
        <Text style={styles.subtitle}>
          Tap the button below in case of emergency
        </Text>
      </View>

      {sosRequest ? (
        // Active SOS Request
        <View style={styles.activeSOSContainer}>
          <Card style={styles.statusCard} shadow="medium">
            <View style={styles.statusHeader}>
              <StatusIndicator status={sosRequest.status} size="medium" />
              <Text style={styles.statusTime}>
                {new Date(sosRequest.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            
            <Text style={styles.statusMessage}>
              {getStatusMessage()}
            </Text>

            <View style={styles.sosDetails}>
              <View style={styles.sosDetail}>
                <Shield color={theme.colors.accent} size={16} />
                <Text style={styles.sosDetailText}>DigiPIN: {sosRequest.digiPin}</Text>
              </View>
              
              <View style={styles.sosDetail}>
                <MapPin color={theme.colors.accent} size={16} />
                <Text style={styles.sosDetailText}>
                  {sosRequest.location.address || 'Location shared'}
                </Text>
              </View>
              
              <View style={styles.sosDetail}>
                <Clock color={theme.colors.accent} size={16} />
                <Text style={styles.sosDetailText}>
                  Sent {new Date(sosRequest.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>

            {sosRequest.rescuerId && (
              <View style={styles.rescuerInfo}>
                <Text style={styles.rescuerTitle}>Assigned Rescuer</Text>
                <View style={styles.rescuerDetail}>
                  <Phone color={theme.colors.accent} size={16} />
                  <Text style={styles.rescuerContact}>
                    Rescuer ID: {sosRequest.rescuerId}
                  </Text>
                </View>
              </View>
            )}

            {sosRequest.status === 'sent' && (
              <Button
                title="Cancel SOS"
                onPress={handleCancelSOS}
                variant="secondary"
                style={styles.cancelButton}
              />
            )}
          </Card>

          {/* Timeline */}
          <Card style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Status Timeline</Text>
            <View style={styles.timeline}>
              <TimelineItem
                title="SOS Sent"
                time={new Date(sosRequest.timestamp).toLocaleTimeString()}
                completed
                icon={Shield}
              />
              <TimelineItem
                title="Rescuer Assigned"
                time={sosRequest.rescuerId ? 'Completed' : 'Pending'}
                completed={!!sosRequest.rescuerId}
                icon={Phone}
              />
              <TimelineItem
                title="Rescue Complete"
                time={sosRequest.status === 'rescued' ? 'Completed' : 'Pending'}
                completed={sosRequest.status === 'rescued'}
                icon={CheckCircle}
              />
            </View>
          </Card>
        </View>
      ) : (
        // SOS Button
        <View style={styles.sosButtonContainer}>
          <TouchableOpacity
            style={[styles.sosButton, isLoading && styles.sosButtonDisabled]}
            onPress={handleSendSOS}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Animated.View style={[styles.sosButtonInner, { transform: [{ scale: pulseAnim }] }]}>
              <Shield color={theme.colors.secondary} size={64} />
              <Text style={styles.sosButtonText}>
                {isLoading ? 'SENDING...' : 'SOS'}
              </Text>
            </Animated.View>
          </TouchableOpacity>

          <Text style={styles.sosInstructions}>
            Press the SOS button to send an emergency alert to rescue services.
            Your location and DigiPIN will be shared automatically.
          </Text>
        </View>
      )}

      {/* DigiPIN Display */}
      <Card style={styles.digiPinCard}>
        <Text style={styles.digiPinTitle}>Your Emergency DigiPIN</Text>
        <Text style={styles.digiPin}>{user.digiPin}</Text>
        <Text style={styles.digiPinNote}>
          Share this code with rescuers to verify your identity
        </Text>
      </Card>

      {/* SOS History */}
      {sosHistory.length > 0 && (
        <Card style={styles.historyCard}>
          <Text style={styles.historyTitle}>Recent SOS History</Text>
          {sosHistory.map((request, index) => (
            <View key={request.id} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <View style={styles.historyStatus}>
                  <StatusIndicator 
                    status={request.status} 
                    size="small" 
                  />
                  <Text style={styles.historyStatusText}>
                    {request.status === 'rescued' ? 'Rescued' : 'Cancelled'}
                  </Text>
                </View>
                <Text style={styles.historyTime}>
                  {new Date(request.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.historyDetails}>
                <View style={styles.historyDetail}>
                  <MapPin color={theme.colors.onSurfaceVariant} size={14} />
                  <Text style={styles.historyDetailText}>
                    {request.location.address || `${request.location.latitude.toFixed(4)}, ${request.location.longitude.toFixed(4)}`}
                  </Text>
                </View>
                <View style={styles.historyDetail}>
                  <Shield color={theme.colors.onSurfaceVariant} size={14} />
                  <Text style={styles.historyDetailText}>
                    DigiPIN: {request.digiPin}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Emergency Tips */}
      <Card style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Emergency Tips</Text>
        <View style={styles.tips}>
          <Text style={styles.tip}>• Stay calm and move to a safe location if possible</Text>
          <Text style={styles.tip}>• Keep your phone charged and accessible</Text>
          <Text style={styles.tip}>• Share your DigiPIN with rescuers for quick identification</Text>
          <Text style={styles.tip}>• Follow official emergency guidance</Text>
        </View>
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

interface TimelineItemProps {
  title: string;
  time: string;
  completed: boolean;
  icon: any;
}

function TimelineItem({ title, time, completed, icon: Icon }: TimelineItemProps) {
  return (
    <View style={styles.timelineItem}>
      <View style={[styles.timelineIcon, completed && styles.timelineIconCompleted]}>
        <Icon 
          color={completed ? theme.colors.secondary : theme.colors.onSurfaceVariant} 
          size={16} 
        />
      </View>
      <View style={styles.timelineContent}>
        <Text style={[styles.timelineItemTitle, completed && styles.timelineItemCompleted]}>
          {title}
        </Text>
        <Text style={styles.timelineItemTime}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  authRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  authText: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
  },
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.onBackground,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  activeSOSContainer: {
    padding: theme.spacing.md,
  },
  statusCard: {
    backgroundColor: `${theme.colors.accent}08`,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusTime: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
  },
  statusMessage: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
    fontWeight: '500',
  },
  sosDetails: {
    marginBottom: theme.spacing.md,
  },
  sosDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  sosDetailText: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    marginLeft: theme.spacing.xs,
  },
  rescuerInfo: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  rescuerTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.xs,
  },
  rescuerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rescuerContact: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    marginLeft: theme.spacing.xs,
  },
  cancelButton: {
    marginTop: theme.spacing.md,
  },
  timelineCard: {
    marginTop: theme.spacing.md,
  },
  timelineTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  timeline: {
    paddingLeft: theme.spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  timelineIconCompleted: {
    backgroundColor: theme.colors.success,
  },
  timelineContent: {
    flex: 1,
    paddingTop: theme.spacing.xs,
  },
  timelineItemTitle: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  timelineItemCompleted: {
    color: theme.colors.onBackground,
  },
  timelineItemTime: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  sosButtonContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.large,
    marginBottom: theme.spacing.xl,
  },
  sosButtonDisabled: {
    backgroundColor: theme.colors.onSurfaceVariant,
  },
  sosButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButtonText: {
    ...theme.typography.h2,
    color: theme.colors.secondary,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
  },
  sosInstructions: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },
  digiPinCard: {
    margin: theme.spacing.md,
    alignItems: 'center',
  },
  digiPinTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.sm,
  },
  digiPin: {
    ...theme.typography.h1,
    color: theme.colors.accent,
    fontFamily: 'monospace',
    letterSpacing: 4,
    marginBottom: theme.spacing.sm,
  },
  digiPinNote: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  tipsCard: {
    margin: theme.spacing.md,
  },
  tipsTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  tips: {},
  tip: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.xs,
    lineHeight: 22,
  },
  historyCard: {
    margin: theme.spacing.lg,
  },
  historyTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  historyItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
    marginBottom: theme.spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  historyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  historyStatusText: {
    ...theme.typography.caption,
    color: theme.colors.onBackground,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  historyTime: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
  },
  historyDetails: {
    gap: theme.spacing.xs,
  },
  historyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDetailText: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginLeft: theme.spacing.xs,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});