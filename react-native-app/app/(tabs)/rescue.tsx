import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Shield,
  Users,
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  CheckCircle,
  QrCode,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { theme } from '@/constants/theme';

export default function RescueScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sos' | 'hazards' | 'safehouses'>('sos');

  // Mock data for rescue tasks
  const [sosRequests] = useState([
    {
      id: '1',
      userId: 'user-123',
      digiPin: 'ABCD1234',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St, Downtown',
      },
      status: 'sent' as const,
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      priority: 'high',
      notes: '',
    },
    {
      id: '2',
      userId: 'user-456',
      digiPin: 'EFGH5678',
      location: {
        latitude: 40.7589,
        longitude: -73.9851,
        address: '456 Oak Ave, North District',
      },
      status: 'in-progress' as const,
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      priority: 'critical',
      rescuerId: user?.id,
      notes: 'Person located, providing first aid',
    },
  ]);

  const [hazardTasks] = useState([
    {
      id: '1',
      title: 'Clear Fallen Tree',
      description: 'Large tree blocking Main Street',
      location: 'Main Street, Downtown',
      priority: 'high',
      status: 'assigned' as const,
      assignedTimestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      title: 'Fix Power Line',
      description: 'Damaged power line near school',
      location: 'School District, North',
      priority: 'critical',
      status: 'verified' as const,
      reportedTimestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
  ]);

  const [safeHouseTasks] = useState([
    {
      id: '1',
      name: 'Central Community Center',
      currentOccupancy: 45,
      capacity: 200,
      needsSupplies: ['Medical supplies', 'Food'],
      lastUpdate: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
  ]);

  if (!user || user.role !== 'rescuer') {
    return (
      <View style={styles.authRequired}>
        <Text style={styles.authText}>Rescuer access required</Text>
      </View>
    );
  }

  const acceptSOSTask = (sosId: string) => {
    Alert.alert(
      'Accept SOS Task',
      'Are you sure you want to accept this rescue task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            Alert.alert('Task Accepted', 'You have been assigned to this rescue.');
          },
        },
      ]
    );
  };

  const markSOSCompleted = (sosId: string) => {
    Alert.alert(
      'Complete Rescue',
      'Mark this rescue as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            Alert.alert('Rescue Completed', 'Great work! The rescue has been marked as completed.');
          },
        },
      ]
    );
  };

  const acceptHazardTask = (hazardId: string) => {
    Alert.alert('Task Accepted', 'You have been assigned to resolve this hazard.');
  };

  const openQRScanner = () => {
    Alert.alert('QR Scanner', 'Opening QR code scanner for safe house check-ins...');
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Rescue Dashboard</Text>
        <Text style={styles.subtitle}>Manage rescue operations and tasks</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sos' && styles.tabActive]}
          onPress={() => setActiveTab('sos')}
        >
          <Shield color={activeTab === 'sos' ? theme.colors.accent : theme.colors.onSurfaceVariant} size={20} />
          <Text style={[styles.tabText, activeTab === 'sos' && styles.tabTextActive]}>
            SOS Tasks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'hazards' && styles.tabActive]}
          onPress={() => setActiveTab('hazards')}
        >
          <AlertTriangle color={activeTab === 'hazards' ? theme.colors.accent : theme.colors.onSurfaceVariant} size={20} />
          <Text style={[styles.tabText, activeTab === 'hazards' && styles.tabTextActive]}>
            Hazards
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'safehouses' && styles.tabActive]}
          onPress={() => setActiveTab('safehouses')}
        >
          <MapPin color={activeTab === 'safehouses' ? theme.colors.accent : theme.colors.onSurfaceVariant} size={20} />
          <Text style={[styles.tabText, activeTab === 'safehouses' && styles.tabTextActive]}>
            Safe Houses
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* SOS Tasks */}
        {activeTab === 'sos' && (
          <View style={styles.section}>
            {sosRequests.map((sos) => (
              <Card key={sos.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskInfo}>
                    <StatusIndicator status={sos.status} size="medium" />
                    <Badge
                      label={sos.priority}
                      variant={sos.priority === 'critical' ? 'danger' : 'warning'}
                      size="small"
                    />
                  </View>
                  <Text style={styles.taskTime}>{getTimeAgo(sos.timestamp)}</Text>
                </View>

                <View style={styles.taskDetails}>
                  <View style={styles.taskDetail}>
                    <Shield color={theme.colors.accent} size={16} />
                    <Text style={styles.taskDetailText}>DigiPIN: {sos.digiPin}</Text>
                  </View>
                  
                  <View style={styles.taskDetail}>
                    <MapPin color={theme.colors.accent} size={16} />
                    <Text style={styles.taskDetailText}>{sos.location.address}</Text>
                  </View>
                  
                  <View style={styles.taskDetail}>
                    <Clock color={theme.colors.accent} size={16} />
                    <Text style={styles.taskDetailText}>
                      Reported {getTimeAgo(sos.timestamp)}
                    </Text>
                  </View>
                </View>

                {sos.notes && (
                  <View style={styles.taskNotes}>
                    <Text style={styles.taskNotesLabel}>Notes:</Text>
                    <Text style={styles.taskNotesText}>{sos.notes}</Text>
                  </View>
                )}

                <View style={styles.taskActions}>
                  {sos.status === 'sent' && (
                    <Button
                      title="Accept Task"
                      onPress={() => acceptSOSTask(sos.id)}
                      variant="accent"
                      size="small"
                      style={styles.taskActionButton}
                    />
                  )}
                  
                  {sos.status === 'in-progress' && sos.rescuerId === user.id && (
                    <Button
                      title="Mark Completed"
                      onPress={() => markSOSCompleted(sos.id)}
                      variant="success"
                      size="small"
                      style={styles.taskActionButton}
                    />
                  )}

                  <TouchableOpacity style={styles.contactButton}>
                    <Phone color={theme.colors.accent} size={16} />
                    <Text style={styles.contactButtonText}>Contact</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}

            {sosRequests.length === 0 && (
              <Card style={styles.emptyState}>
                <Shield color={theme.colors.onSurfaceVariant} size={48} />
                <Text style={styles.emptyStateText}>No active SOS requests</Text>
              </Card>
            )}
          </View>
        )}

        {/* Hazard Tasks */}
        {activeTab === 'hazards' && (
          <View style={styles.section}>
            {hazardTasks.map((hazard) => (
              <Card key={hazard.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{hazard.title}</Text>
                    <Badge
                      label={hazard.priority}
                      variant={hazard.priority === 'critical' ? 'danger' : 'warning'}
                      size="small"
                    />
                  </View>
                  <StatusIndicator status={hazard.status} size="medium" />
                </View>

                <Text style={styles.taskDescription}>{hazard.description}</Text>

                <View style={styles.taskDetail}>
                  <MapPin color={theme.colors.accent} size={16} />
                  <Text style={styles.taskDetailText}>{hazard.location}</Text>
                </View>

                <View style={styles.taskActions}>
                  {hazard.status === 'verified' && (
                    <Button
                      title="Accept Task"
                      onPress={() => acceptHazardTask(hazard.id)}
                      variant="accent"
                      size="small"
                      style={styles.taskActionButton}
                    />
                  )}
                </View>
              </Card>
            ))}

            {hazardTasks.length === 0 && (
              <Card style={styles.emptyState}>
                <AlertTriangle color={theme.colors.onSurfaceVariant} size={48} />
                <Text style={styles.emptyStateText}>No hazard tasks available</Text>
              </Card>
            )}
          </View>
        )}

        {/* Safe House Management */}
        {activeTab === 'safehouses' && (
          <View style={styles.section}>
            {/* QR Scanner Card */}
            <Card style={styles.qrScannerCard}>
              <View style={styles.qrScannerHeader}>
                <QrCode color={theme.colors.accent} size={24} />
                <Text style={styles.qrScannerTitle}>Check-in Scanner</Text>
              </View>
              <Text style={styles.qrScannerSubtitle}>
                Scan civilian QR codes to check them into safe houses
              </Text>
              <Button
                title="Open QR Scanner"
                onPress={openQRScanner}
                variant="accent"
                size="medium"
                style={styles.qrScannerButton}
              />
            </Card>

            {/* Safe House Status */}
            {safeHouseTasks.map((safeHouse) => (
              <Card key={safeHouse.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>{safeHouse.name}</Text>
                  <Text style={styles.taskTime}>
                    Updated {getTimeAgo(safeHouse.lastUpdate)}
                  </Text>
                </View>

                <View style={styles.occupancyInfo}>
                  <View style={styles.occupancyStats}>
                    <Text style={styles.occupancyNumber}>
                      {safeHouse.currentOccupancy}/{safeHouse.capacity}
                    </Text>
                    <Text style={styles.occupancyLabel}>Occupancy</Text>
                  </View>
                  
                  <View style={styles.occupancyBar}>
                    <View
                      style={[
                        styles.occupancyFill,
                        {
                          width: `${(safeHouse.currentOccupancy / safeHouse.capacity) * 100}%`,
                          backgroundColor: safeHouse.currentOccupancy / safeHouse.capacity > 0.8
                            ? theme.colors.danger
                            : theme.colors.accent,
                        },
                      ]}
                    />
                  </View>
                </View>

                {safeHouse.needsSupplies.length > 0 && (
                  <View style={styles.suppliesNeeded}>
                    <Text style={styles.suppliesTitle}>Supplies Needed:</Text>
                    <View style={styles.suppliesList}>
                      {safeHouse.needsSupplies.map((supply, index) => (
                        <Badge key={index} label={supply} variant="warning" size="small" />
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.taskActions}>
                  <Button
                    title="Manage"
                    onPress={() => Alert.alert('Safe House Management', 'Opening management interface...')}
                    variant="primary"
                    size="small"
                    style={styles.taskActionButton}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.onBackground,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.accent,
  },
  tabText: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: theme.spacing.md,
  },
  taskCard: {
    marginBottom: theme.spacing.md,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  taskTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
  },
  taskTime: {
    ...theme.typography.small,
    color: theme.colors.onSurfaceVariant,
  },
  taskDetails: {
    marginBottom: theme.spacing.sm,
  },
  taskDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  taskDetailText: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    marginLeft: theme.spacing.xs,
  },
  taskDescription: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm,
  },
  taskNotes: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  taskNotesLabel: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  taskNotesText: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  taskActionButton: {
    flex: 1,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  contactButtonText: {
    ...theme.typography.body,
    color: theme.colors.accent,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyStateText: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.md,
  },
  qrScannerCard: {
    backgroundColor: `${theme.colors.accent}08`,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
    marginBottom: theme.spacing.md,
  },
  qrScannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  qrScannerTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginLeft: theme.spacing.xs,
  },
  qrScannerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.md,
  },
  qrScannerButton: {
    alignSelf: 'flex-start',
  },
  occupancyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  occupancyStats: {
    marginRight: theme.spacing.md,
  },
  occupancyNumber: {
    ...theme.typography.h3,
    color: theme.colors.accent,
  },
  occupancyLabel: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
  },
  occupancyBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 4,
  },
  suppliesNeeded: {
    marginBottom: theme.spacing.sm,
  },
  suppliesTitle: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  suppliesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});