import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { 
  AlertTriangle, 
  Camera, 
  MapPin, 
  Plus,
  Eye,
  CheckCircle,
  Clock
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { theme } from '@/constants/theme';
import { Hazard } from '@/types/user';

export default function HazardsScreen() {
  const { user } = useAuth();
  const { getCurrentLocation } = useLocation();
  const [hazards, setHazards] = useState<Hazard[]>([
    {
      id: '1',
      reporterId: 'user-1',
      title: 'Fallen Tree Blocking Road',
      description: 'Large oak tree fell across Main Street after storm. Road completely blocked.',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'Main Street, Downtown',
      },
      photos: [],
      status: 'verified',
      priority: 'high',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      reporterId: 'user-2',
      title: 'Damaged Power Lines',
      description: 'Power lines down near school area. Sparking and dangerous.',
      location: {
        latitude: 40.7589,
        longitude: -73.9851,
        address: 'School District, North Area',
      },
      photos: [],
      status: 'assigned',
      priority: 'critical',
      assignedRescuerId: 'rescuer-1',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      reporterId: user?.id || 'user-3',
      title: 'Flooding in Underpass',
      description: 'Heavy rain caused flooding in the underpass. Water level about 2 feet.',
      location: {
        latitude: 40.6892,
        longitude: -74.0445,
        address: 'Central Underpass, South Area',
      },
      photos: [],
      status: 'resolved',
      priority: 'medium',
      assignedRescuerId: 'rescuer-2',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      resolvedTimestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const [showReportForm, setShowReportForm] = useState(false);
  const [newHazard, setNewHazard] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    photos: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRescuer = user?.role === 'rescuer';

  const takePicture = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewHazard(prev => ({
        ...prev,
        photos: [...prev.photos, result.assets[0].uri],
      }));
    }
  };

  const submitHazardReport = async () => {
    if (!newHazard.title.trim() || !newHazard.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const location = await getCurrentLocation();
      
      if (!location) {
        Alert.alert('Error', 'Unable to get your location. Please try again.');
        return;
      }

      const hazardReport: Hazard = {
        id: Date.now().toString(),
        reporterId: user!.id,
        title: newHazard.title,
        description: newHazard.description,
        location,
        photos: newHazard.photos,
        status: 'pending',
        priority: newHazard.priority,
        timestamp: new Date().toISOString(),
      };

      setHazards(prev => [hazardReport, ...prev]);
      
      // Reset form
      setNewHazard({
        title: '',
        description: '',
        priority: 'medium',
        photos: [],
      });
      setShowReportForm(false);

      Alert.alert(
        'Hazard Reported',
        'Your hazard report has been submitted successfully. It will be reviewed and verified.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit hazard report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const acceptHazardTask = (hazardId: string) => {
    setHazards(prev =>
      prev.map(hazard =>
        hazard.id === hazardId
          ? { ...hazard, status: 'assigned', assignedRescuerId: user!.id }
          : hazard
      )
    );
    
    Alert.alert('Task Accepted', 'You have been assigned to resolve this hazard.');
  };

  const markHazardResolved = (hazardId: string) => {
    setHazards(prev =>
      prev.map(hazard =>
        hazard.id === hazardId
          ? { 
              ...hazard, 
              status: 'resolved', 
              resolvedTimestamp: new Date().toISOString(),
            }
          : hazard
      )
    );
    
    Alert.alert('Hazard Resolved', 'This hazard has been marked as resolved.');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return theme.colors.danger;
      case 'high': return theme.colors.warning;
      case 'medium': return theme.colors.accent;
      case 'low': return theme.colors.success;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (!user) {
    return (
      <View style={styles.authRequired}>
        <Text style={styles.authText}>Please log in to view hazards</Text>
      </View>
    );
  }

  if (showReportForm) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Report Hazard</Text>
          <Text style={styles.formSubtitle}>
            Help keep your community safe by reporting dangerous conditions
          </Text>
        </View>

        <Card style={styles.formCard}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={newHazard.title}
              onChangeText={(text) => setNewHazard(prev => ({ ...prev, title: text }))}
              placeholder="Brief description of the hazard"
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={newHazard.description}
              onChangeText={(text) => setNewHazard(prev => ({ ...prev, description: text }))}
              placeholder="Detailed description of the hazard and its location"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Priority Level</Text>
            <View style={styles.priorityButtons}>
              {(['low', 'medium', 'high', 'critical'] as const).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    newHazard.priority === priority && styles.priorityButtonActive,
                    { borderColor: getPriorityColor(priority) },
                  ]}
                  onPress={() => setNewHazard(prev => ({ ...prev, priority }))}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      newHazard.priority === priority && {
                        color: getPriorityColor(priority),
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Photos (Optional)</Text>
            <Button
              title="Take Picture"
              onPress={takePicture}
              variant="secondary"
              style={styles.photoButton}
            />
            {newHazard.photos.length > 0 && (
              <Text style={styles.photoCount}>
                {newHazard.photos.length} photo(s) added
              </Text>
            )}
          </View>

          <View style={styles.formActions}>
            <Button
              title="Cancel"
              onPress={() => setShowReportForm(false)}
              variant="secondary"
              style={styles.formActionButton}
            />
            <Button
              title={isSubmitting ? 'Submitting...' : 'Submit Report'}
              onPress={submitHazardReport}
              variant="danger"
              disabled={isSubmitting}
              style={styles.formActionButton}
            />
          </View>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hazard Reports</Text>
        <Text style={styles.subtitle}>
          {isRescuer 
            ? 'View and manage hazard reports in your area'
            : 'Report dangerous conditions and track their status'
          }
        </Text>
      </View>

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => setShowReportForm(true)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: `${theme.colors.danger}15` }]}>
              <Plus color={theme.colors.danger} size={24} />
            </View>
            <Text style={styles.quickActionText}>Report Hazard</Text>
          </TouchableOpacity>

          {isRescuer && (
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${theme.colors.accent}15` }]}>
                <Eye color={theme.colors.accent} size={24} />
              </View>
              <Text style={styles.quickActionText}>View Tasks</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>

      {/* Hazards List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        
        {hazards.map((hazard) => (
          <Card key={hazard.id} style={styles.hazardCard}>
            <View style={styles.hazardHeader}>
              <View style={styles.hazardInfo}>
                <Text style={styles.hazardTitle}>{hazard.title}</Text>
                <View style={styles.hazardMeta}>
                  <StatusIndicator status={hazard.status} size="small" />
                  <Text style={styles.hazardTime}>{getTimeAgo(hazard.timestamp)}</Text>
                </View>
              </View>
              
              <Badge
                label={hazard.priority}
                variant={
                  hazard.priority === 'critical' 
                    ? 'danger' 
                    : hazard.priority === 'high'
                    ? 'warning'
                    : hazard.priority === 'medium'
                    ? 'accent'
                    : 'success'
                }
                size="small"
              />
            </View>

            <Text style={styles.hazardDescription} numberOfLines={2}>
              {hazard.description}
            </Text>

            <View style={styles.hazardLocation}>
              <MapPin color={theme.colors.accent} size={14} />
              <Text style={styles.hazardLocationText}>{hazard.location.address}</Text>
            </View>

            {hazard.photos.length > 0 && (
              <View style={styles.hazardPhotos}>
                <Camera color={theme.colors.onSurfaceVariant} size={14} />
                <Text style={styles.hazardPhotosText}>
                  {hazard.photos.length} photo(s) attached
                </Text>
              </View>
            )}

            {hazard.resolvedTimestamp && (
              <View style={styles.resolvedInfo}>
                <CheckCircle color={theme.colors.success} size={14} />
                <Text style={styles.resolvedText}>
                  Resolved {getTimeAgo(hazard.resolvedTimestamp)}
                </Text>
              </View>
            )}

            {/* Rescuer Actions */}
            {isRescuer && hazard.status === 'verified' && (
              <View style={styles.hazardActions}>
                <Button
                  title="Accept Task"
                  onPress={() => acceptHazardTask(hazard.id)}
                  variant="accent"
                  size="small"
                  style={styles.hazardActionButton}
                />
              </View>
            )}

            {isRescuer && hazard.assignedRescuerId === user.id && hazard.status === 'assigned' && (
              <View style={styles.hazardActions}>
                <Button
                  title="Mark Resolved"
                  onPress={() => markHazardResolved(hazard.id)}
                  variant="success"
                  size="small"
                  style={styles.hazardActionButton}
                />
              </View>
            )}
          </Card>
        ))}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
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
  quickActionsCard: {
    margin: theme.spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  quickActionText: {
    ...theme.typography.caption,
    color: theme.colors.onBackground,
    fontWeight: '500',
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  hazardCard: {
    marginBottom: theme.spacing.md,
  },
  hazardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  hazardInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  hazardTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.xs,
  },
  hazardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hazardTime: {
    ...theme.typography.small,
    color: theme.colors.onSurfaceVariant,
    marginLeft: theme.spacing.sm,
  },
  hazardDescription: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  hazardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  hazardLocationText: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginLeft: theme.spacing.xs,
  },
  hazardPhotos: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  hazardPhotosText: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginLeft: theme.spacing.xs,
  },
  resolvedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  resolvedText: {
    ...theme.typography.caption,
    color: theme.colors.success,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  hazardActions: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  hazardActionButton: {
    alignSelf: 'flex-start',
  },
  
  // Form styles
  formHeader: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
  },
  formTitle: {
    ...theme.typography.h2,
    color: theme.colors.onBackground,
  },
  formSubtitle: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  formCard: {
    margin: theme.spacing.md,
  },
  formField: {
    marginBottom: theme.spacing.lg,
  },
  fieldLabel: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  textInput: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  priorityButton: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
  },
  priorityButtonActive: {
    backgroundColor: theme.colors.secondary,
  },
  priorityButtonText: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
  },
  photoButton: {
    alignSelf: 'flex-start',
  },
  photoCount: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    marginTop: theme.spacing.xs,
    fontWeight: '500',
  },
  formActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  formActionButton: {
    flex: 1,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});