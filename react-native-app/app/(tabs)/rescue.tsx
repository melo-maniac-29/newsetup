import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import {
  Shield,
  Users,
  AlertTriangle,
  MapPin,
  Clock,
  Phone,
  CheckCircle,
  X,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSOS } from '@/hooks/useSOS';
import { useHazards } from '@/hooks/useHazards';
import { useSafeHouses } from '@/hooks/useSafeHouses';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { theme } from '@/constants/theme';

export default function RescueScreen() {
  const { user } = useAuth();
  const { getActiveSOSRequests, acceptSOS, completeSOS, getAllSOSRequests } = useSOS();
  const { hazards, getHazardsByStatus, assignHazard, updateHazardStatus } = useHazards();
  const { safeHouses } = useSafeHouses();
  const [activeTab, setActiveTab] = useState<'sos' | 'history' | 'hazards' | 'safehouses'>('sos');
  const [showOccupantsModal, setShowOccupantsModal] = useState(false);
  const [selectedSafeHouse, setSelectedSafeHouse] = useState<any>(null);

  // Get real-time data
  const activeSOS = getActiveSOSRequests();
  // Get ALL SOS history globally (not just current user)
  const allGlobalSOS = getAllSOSRequests();
  const sosHistory = allGlobalSOS.filter((sos: any) => sos.status === 'rescued' || sos.status === 'cancelled');
  const assignedHazards = getHazardsByStatus('assigned');
  const verifiedHazards = getHazardsByStatus('verified');
  const activeSafeHouses = safeHouses.filter(sh => sh.isActive);

  // Get priority for SOS requests
  const getSOSPriority = (sos: any) => {
    const now = Date.now();
    const sosTime = sos.timestamp || sos._creationTime;
    const timeDiff = (now - sosTime) / (1000 * 60); // minutes
    
    if (timeDiff > 30) return 'critical';
    if (timeDiff > 15) return 'high';
    return 'medium';
  };

  if (!user || user.role !== 'rescuer') {
    return (
      <View style={styles.authRequired}>
        <Text style={styles.authText}>Rescuer access required</Text>
      </View>
    );
  }

  const acceptSOSTask = async (sosId: string) => {
    if (!user) return;
    
    Alert.alert(
      'Accept SOS Task',
      'Are you sure you want to accept this rescue task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await acceptSOS(sosId, user.id);
              Alert.alert('Task Accepted', 'You have been assigned to this rescue.');
            } catch (error) {
              Alert.alert('Error', 'Failed to accept task. Please try again.');
            }
          },
        },
      ]
    );
  };

  const markSOSCompleted = async (sosId: string) => {
    if (!user) return;
    
    Alert.alert(
      'Complete Rescue',
      'Mark this rescue as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await completeSOS(sosId, user.id, 'Rescue completed successfully');
              Alert.alert('Rescue Completed', 'Great work! The rescue has been marked as completed.');
            } catch (error) {
              Alert.alert('Error', 'Failed to complete rescue. Please try again.');
            }
          },
        },
      ]
    );
  };

  const acceptHazardTask = async (hazardId: string) => {
    if (!user) return;
    
    try {
      await updateHazardStatus(hazardId, 'assigned', user.id);
      Alert.alert('Task Accepted', 'You have been assigned to resolve this hazard.');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept hazard task. Please try again.');
    }
  };

  const contactUser = (sosData: any) => {
    // In a real app, you'd fetch user phone from database using sosData.userId
    const userPhone = sosData.userPhone || `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`; // Demo phone
    const sosId = sosData._id || sosData.id;
    
    Alert.alert(
      'Call SOS User',
      `Call the person who requested help?\n\nUser ID: ${sosData.userId?.slice(-6) || 'Unknown'}\nPhone: ${userPhone}\nDigiPIN: ${sosData.digiPin}\nStatus: ${sosData.status}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => {
            // In real app: Linking.openURL(`tel:${userPhone}`)
            Alert.alert('Calling...', `Dialing ${userPhone}`);
          },
        },
      ]
    );
  };

  const handleViewOccupants = (safeHouse: any) => {
    setSelectedSafeHouse(safeHouse);
    setShowOccupantsModal(true);
  };

  const openQRScanner = () => {
    Alert.alert('QR Scanner', 'Opening QR code scanner for safe house check-ins...');
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
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
            Active SOS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Clock color={activeTab === 'history' ? theme.colors.accent : theme.colors.onSurfaceVariant} size={20} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            SOS History
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
            {activeSOS.map((sos, index) => {
              const priority = getSOSPriority(sos);
              return (
                <Card key={sos.id || `active-sos-${index}`} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <View style={styles.taskInfo}>
                      <StatusIndicator status={sos.status} size="medium" />
                      <Badge
                        label={priority}
                        variant={priority === 'critical' ? 'danger' : priority === 'high' ? 'warning' : 'accent'}
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
                      <Text style={styles.taskDetailText}>{sos.location?.address || 'Location not available'}</Text>
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
                        variant="primary"
                        size="small"
                        style={styles.taskActionButton}
                      />
                    )}

                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => contactUser(sos)}
                    >
                      <Phone color={theme.colors.accent} size={16} />
                      <Text style={styles.contactButtonText}>Call User</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}

            {activeSOS.length === 0 && (
              <Card style={styles.emptyState}>
                <Shield color={theme.colors.onSurfaceVariant} size={48} />
                <Text style={styles.emptyStateText}>No active SOS requests</Text>
                <Text style={styles.emptyStateSubtext}>
                  New emergency requests will appear here
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* SOS History */}
        {activeTab === 'history' && (
          <View style={styles.section}>
            {sosHistory.map((sos: any, index: number) => {
              const priority = getSOSPriority(sos);
              return (
                <Card key={sos._id || sos.id || `history-sos-${index}`} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <View style={styles.taskInfo}>
                      <StatusIndicator status={sos.status} size="medium" />
                      <Badge
                        label={sos.status === 'rescued' ? 'Rescued' : 'Cancelled'}
                        variant={sos.status === 'rescued' ? 'success' : 'warning'}
                        size="small"
                      />
                    </View>
                    <Text style={styles.taskTime}>{getTimeAgo(new Date(sos.timestamp || sos._creationTime).toISOString())}</Text>
                  </View>

                  <View style={styles.taskDetails}>
                    <View style={styles.taskDetail}>
                      <Users color={theme.colors.primary} size={16} />
                      <Text style={styles.taskDetailText}>User: {sos.userId?.slice(-6) || 'Unknown'}</Text>
                    </View>
                    
                    <View style={styles.taskDetail}>
                      <Shield color={theme.colors.accent} size={16} />
                      <Text style={styles.taskDetailText}>DigiPIN: {sos.digiPin}</Text>
                    </View>
                    
                    <View style={styles.taskDetail}>
                      <MapPin color={theme.colors.accent} size={16} />
                      <Text style={styles.taskDetailText}>{sos.location?.address || 'Location not available'}</Text>
                    </View>
                    
                    {sos.rescuerId && sos.status === 'rescued' && (
                      <View style={styles.taskDetail}>
                        <CheckCircle color={theme.colors.success} size={16} />
                        <Text style={styles.taskDetailText}>
                          Rescued by: {sos.rescuerId.slice(-6)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {sos.notes && (
                    <View style={styles.taskNotes}>
                      <Text style={styles.taskNotesLabel}>Notes:</Text>
                      <Text style={styles.taskNotesText}>{sos.notes}</Text>
                    </View>
                  )}

                  <View style={styles.taskActions}>
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => contactUser(sos)}
                    >
                      <Phone color={theme.colors.accent} size={16} />
                      <Text style={styles.contactButtonText}>Call User</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}

            {sosHistory.length === 0 && (
              <Card style={styles.emptyState}>
                <Clock color={theme.colors.onSurfaceVariant} size={48} />
                <Text style={styles.emptyStateText}>No SOS history</Text>
                <Text style={styles.emptyStateSubtext}>
                  All completed and cancelled SOS requests from all users will appear here
                </Text>
              </Card>
            )}
          </View>
        )}

        {/* Hazard Tasks */}
        {activeTab === 'hazards' && (
          <View style={styles.section}>
            {[...assignedHazards, ...verifiedHazards].map((hazard, index) => (
              <Card key={hazard.id || `hazard-${index}`} style={styles.taskCard}>
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
                  <Text style={styles.taskDetailText}>{hazard.location?.address || 'No address'}</Text>
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

            {[...assignedHazards, ...verifiedHazards].length === 0 && (
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
            {activeSafeHouses.map((safeHouse, index) => (
              <Card key={safeHouse.id || `safehouse-${index}`} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>{safeHouse.name}</Text>
                  <Text style={styles.taskTime}>
                    Capacity: {safeHouse.currentOccupancy}/{safeHouse.capacity}
                  </Text>
                </View>

                <View style={styles.taskDetail}>
                  <MapPin color={theme.colors.accent} size={16} />
                  <Text style={styles.taskDetailText}>{safeHouse.address || 'Address not available'}</Text>
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
                            : safeHouse.currentOccupancy / safeHouse.capacity > 0.6
                            ? theme.colors.warning
                            : theme.colors.success,
                        },
                      ]}
                    />
                  </View>
                </View>

                {safeHouse.currentOccupancy / safeHouse.capacity > 0.8 && (
                  <View style={styles.warningInfo}>
                    <AlertTriangle color={theme.colors.danger} size={14} />
                    <Text style={styles.warningText}>Near capacity - consider alternative locations</Text>
                  </View>
                )}

                <View style={styles.taskActions}>
                  <Button
                    title="View Occupants"
                    onPress={() => handleViewOccupants(safeHouse)}
                    variant="accent"
                    size="small"
                    style={styles.taskActionButton}
                  />
                </View>
              </Card>
            ))}

            {activeSafeHouses.length === 0 && (
              <Card style={styles.emptyState}>
                <MapPin color={theme.colors.onSurfaceVariant} size={48} />
                <Text style={styles.emptyStateText}>No active safe houses</Text>
                <Text style={styles.emptyStateSubtext}>
                  Safe house information will appear here when available
                </Text>
              </Card>
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* View Occupants Modal */}
      {selectedSafeHouse && (
        <ViewOccupantsModal
          visible={showOccupantsModal}
          onClose={() => setShowOccupantsModal(false)}
          safeHouse={selectedSafeHouse}
        />
      )}
    </View>
  );
}

// View Occupants Modal Component (same as in safehouses.tsx)
function ViewOccupantsModal({ 
  visible, 
  onClose, 
  safeHouse 
}: { 
  visible: boolean; 
  onClose: () => void; 
  safeHouse: any;
}) {
  const [occupants, setOccupants] = useState<any[]>([]);
  
  const occupantsQuery = useQuery(
    api.safehouses.getSafeHouseOccupants, 
    visible ? { safeHouseId: safeHouse.id as any } : "skip"
  );
  
  // Update occupants when query data changes
  useEffect(() => {
    if (occupantsQuery) {
      setOccupants(occupantsQuery);
    }
  }, [occupantsQuery]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { minHeight: '75%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{safeHouse.name} - Occupants</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X color={theme.colors.onSurface} size={24} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Safe House Details</Text>
              <View style={styles.statusContainer}>
                <Text style={styles.occupancyStatusText}>
                  📍 {safeHouse.address}
                </Text>
                <Text style={styles.occupancyStatusText}>
                  📱 DIGIPIN: {safeHouse.locationDigiPin || 'N/A'}
                </Text>
                <Text style={styles.occupancyStatusText}>
                  👥 Occupancy: {safeHouse.currentOccupancy}/{safeHouse.capacity}
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Occupants ({safeHouse.currentOccupancy})</Text>
              {!occupantsQuery ? (
                <View style={styles.statusContainer}>
                  <Text style={styles.occupancyStatusText}>Loading occupants...</Text>
                </View>
              ) : occupants.length > 0 ? (
                occupants.map((occupant, index) => (
                  <View key={occupant.id || `occupant-${index}`} style={styles.statusContainer}>
                    <Text style={styles.occupancyStatusText}>
                      👤 {occupant.name}
                    </Text>
                    <Text style={[styles.occupancyStatusText, { fontSize: 12 }]}>
                      DIGIPIN: {occupant.digiPin} • Check-in: {occupant.checkInTimeFormatted}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.statusContainer}>
                  <Text style={styles.occupancyStatusText}>
                    No occupants currently checked in
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <Button 
              title="Close" 
              onPress={onClose} 
              variant="secondary" 
            />
          </View>
        </View>
      </View>
    </Modal>
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
  emptyStateSubtext: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
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
  warningInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: `${theme.colors.danger}10`,
    borderRadius: theme.borderRadius.sm,
  },
  warningText: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: 0,
    margin: theme.spacing.md,
    maxHeight: '90%',
    minHeight: '70%',
    width: '95%',
    maxWidth: 500,
    ...theme.shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.onBackground,
  },
  modalCloseButton: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xs,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
    minHeight: 200,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  // Form styles
  inputGroup: {
    marginBottom: theme.spacing.xl,
  },
  inputLabel: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    fontWeight: '600',
    fontSize: 16,
    marginBottom: theme.spacing.sm,
  },
  statusContainer: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  occupancyStatusText: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
});