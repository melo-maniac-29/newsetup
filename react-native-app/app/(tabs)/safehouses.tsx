import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, MapPin, Users, X, QrCode, Trash2 } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { theme } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeHouses } from '../../hooks/useSafeHouses';

import type { SafeHouse } from '../../types/user';
import type { Id } from '../../convex/_generated/dataModel';

export default function SafeHousesScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { safeHouses, loading, createSafeHouse, deleteSafeHouse, updateOccupancy, checkInToSafeHouse, checkOutFromSafeHouse } = useSafeHouses();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOccupancyModal, setShowOccupancyModal] = useState(false);
  const [showPersonalQRModal, setShowPersonalQRModal] = useState(false);
  const [showOccupantsModal, setShowOccupantsModal] = useState(false);
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const [selectedSafeHouse, setSelectedSafeHouse] = useState<SafeHouse | null>(null);
  const [creating, setCreating] = useState(false);

  // Use the new query to get the user's current safe house status
  const currentUserStatus = useQuery(api.safehouses.getUserCheckInStatus, user?.id ? { userId: user.id as Id<'users'> } : "skip");

  const isRescuer = user?.role === 'rescuer';

  // Function to check if user is currently checked in to a specific safe house
  const isUserCheckedIn = (safeHouseId: string): boolean => {
    if (!currentUserStatus || !currentUserStatus.isCheckedIn) {
      return false;
    }
    return currentUserStatus.safeHouse?._id === safeHouseId;
  };

  // Function to handle successful check-in and refresh data
  const handleSuccessfulCheckIn = async (safeHouseId: string, userId: string) => {
    // The currentUserStatus query will automatically update due to Convex reactivity
    setShowQRScannerModal(false);
    Alert.alert('Success', 'User checked in successfully!');
  };

  const handleLeaveComplex = async (safeHouse: SafeHouse) => {
    if (!user) return;

    Alert.alert(
      'Leave Safe House',
      `Are you sure you want to check out from ${safeHouse.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await checkOutFromSafeHouse(user.id, safeHouse.id);
              // The currentUserStatus query will automatically update due to Convex reactivity
              Alert.alert('Success', `You have checked out from ${safeHouse.name}`);
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to check out');
            }
          },
        },
      ]
    );
  };

  // Early return for authentication check
  if (!isAuthenticated) {
    return (
      <View style={styles.authRequired}>
        <Text style={styles.authText}>
          Please log in to access safe houses information.
        </Text>
      </View>
    );
  }

  const handleCreateSafeHouse = async (data: any) => {
    try {
      setCreating(true);
      
      // For demo purposes, use fixed coordinates (Mumbai, India)
      // In production, get user's current location
      const latitude = 19.0760;
      const longitude = 72.8777;
      
      await createSafeHouse({
        name: data.name,
        address: data.address,
        latitude: latitude,
        longitude: longitude,
        capacity: parseInt(data.capacity),
        facilities: data.facilities,
        managerId: user?.id || '',
      });
      setShowCreateModal(false);
      Alert.alert('Success', 'Safe house created successfully!');
    } catch (error) {
      console.error('Error creating safe house:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create safe house. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSafeHouse = async (safeHouse: SafeHouse) => {
    if (safeHouse.managerId !== user?.id) {
      Alert.alert('Error', 'You can only delete safe houses you created');
      return;
    }

    if (safeHouse.currentOccupancy > 0) {
      Alert.alert('Error', 'Cannot delete safe house with current occupants. Please ensure all people have checked out first.');
      return;
    }

    Alert.alert(
      'Delete Safe House',
      `Are you sure you want to delete "${safeHouse.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSafeHouse(safeHouse.id, user?.id || '');
              Alert.alert('Success', 'Safe house deleted successfully');
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete safe house');
            }
          },
        },
      ]
    );
  };

  const handleManageOccupancy = (safeHouse: SafeHouse) => {
    setSelectedSafeHouse(safeHouse);
    setShowOccupancyModal(true);
  };

  const handleScanForCheckIn = (safeHouse: SafeHouse) => {
    setSelectedSafeHouse(safeHouse);
    setShowQRScannerModal(true);
  };

  const handleShowPersonalQR = (safeHouse: SafeHouse) => {
    setSelectedSafeHouse(safeHouse);
    setShowPersonalQRModal(true);
  };

  const handleViewOccupants = (safeHouse: SafeHouse) => {
    setSelectedSafeHouse(safeHouse);
    setShowOccupantsModal(true);
  };

  const renderSafeHouse = (safeHouse: SafeHouse) => (
    <Card key={safeHouse.id} style={styles.safeHouseCard}>
      <View style={styles.safeHouseHeader}>
        <View style={styles.safeHouseInfo}>
          <Text style={styles.safeHouseName}>{safeHouse.name}</Text>
          <View style={styles.safeHouseLocation}>
            <MapPin color={theme.colors.onSurfaceVariant} size={16} />
            <Text style={styles.safeHouseAddress}>{safeHouse.address}</Text>
          </View>
        </View>
        <View style={styles.capacityBadge}>
          <Users color={theme.colors.accent} size={16} />
          <Text style={styles.capacityText}>
            {safeHouse.currentOccupancy}/{safeHouse.capacity}
          </Text>
        </View>
      </View>

      {safeHouse.locationDigiPin && (
        <View style={styles.digipinContainer}>
          <Text style={styles.digipinLabel}>Location DIGIPIN:</Text>
          <Text style={styles.digipinCode}>{safeHouse.locationDigiPin}</Text>
        </View>
      )}

      {safeHouse.facilities && safeHouse.facilities.length > 0 && (
        <View style={styles.facilitiesContainer}>
          <Text style={styles.facilitiesLabel}>Available Facilities:</Text>
          <View style={styles.facilitiesGrid}>
            {safeHouse.facilities.map((facility, index) => (
              <View key={index} style={styles.facilityTag}>
                <Text style={styles.facilityText}>{facility}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.safeHouseActions}>
        {!isRescuer ? (
          // Civilian actions - Show admission status or QR code
          isUserCheckedIn(safeHouse.id) ? (
            // User is checked in - show admission status
            <>
              <View style={styles.admissionStatus}>
                <View style={styles.admissionBadge}>
                  <Text style={styles.checkIcon}>✓</Text>
                  <Text style={styles.admissionText}>You're checked in</Text>
                </View>
                <Button
                  title="Leave"
                  onPress={() => handleLeaveComplex(safeHouse)}
                  variant="danger"
                  style={styles.leaveButton}
                />
              </View>
            </>
          ) : (
            // User is not checked in - show normal actions
            <>
              <Button
                title="Your QR Code"
                onPress={() => handleShowPersonalQR(safeHouse)}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title="View Occupants"
                onPress={() => handleViewOccupants(safeHouse)}
                variant="accent"
                style={styles.actionButton}
              />
            </>
          )
        ) : (
          // Rescuer actions
          <>
            <Button
              title="Scan QR"
              onPress={() => handleScanForCheckIn(safeHouse)}
              variant="secondary"
              style={styles.actionButton}
            />
            {safeHouse.managerId === user?.id && (
              <Button
                title="Manage Capacity"
                onPress={() => handleManageOccupancy(safeHouse)}
                variant="accent"
                style={styles.actionButton}
              />
            )}
          </>
        )}
        {isRescuer && safeHouse.managerId === user?.id && (
          <Button
            title="Delete"
            onPress={() => handleDeleteSafeHouse(safeHouse)}
            variant="danger"
            style={styles.deleteButton}
          />
        )}
      </View>
    </Card>
  );

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Safe Houses</Text>
            <Text style={styles.subtitle}>
              Find shelter and check-in to safe locations
            </Text>
          </View>
          {isRescuer && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                setShowCreateModal(true);
              }}
              activeOpacity={0.7}
            >
              <Plus color={theme.colors.secondary} size={24} />
            </TouchableOpacity>
          )}
        </View>

        {/* Safe Houses List */}
        <View style={styles.safeHousesList}>
          {loading ? (
            <Text style={styles.loadingText}>Loading safe houses...</Text>
          ) : safeHouses.length === 0 ? (
            <Card style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Safe Houses Available</Text>
              <Text style={styles.emptySubtitle}>
                {isRescuer 
                  ? "Create the first safe house to help people find shelter."
                  : "Safe houses will appear here when they become available."
                }
              </Text>
            </Card>
          ) : (
            safeHouses.map(renderSafeHouse)
          )}
        </View>

        {/* Add Test Data for Empty State */}
        {isRescuer && safeHouses.length === 0 && (
          <Card style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Safe Houses Created</Text>
            <Text style={styles.emptySubtitle}>Create your first safe house to help people find shelter.</Text>
            <Button
              title="Add Test Safe House"
              onPress={async () => {
                try {
                  await createSafeHouse({
                    name: "Emergency Community Center",
                    address: "123 Relief Street, Mumbai, Maharashtra",
                    latitude: 19.0760,
                    longitude: 72.8777,
                    capacity: 100,
                    facilities: ['Food', 'Water', 'Medical Aid', 'Shelter'],
                    managerId: user?.id || '',
                  });
                  Alert.alert('Success', 'Test safe house created!');
                } catch (error) {
                  console.error('Error creating test safe house:', error);
                }
              }}
              variant="accent"
              style={{ marginTop: theme.spacing.md }}
            />
          </Card>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Create Safe House Modal */}
      <CreateSafeHouseModal 
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateSafeHouse={handleCreateSafeHouse}
        loading={creating}
      />

      {/* Occupancy Management Modal */}
      {selectedSafeHouse && (
        <OccupancyManagementModal
          visible={showOccupancyModal}
          onClose={() => setShowOccupancyModal(false)}
          safeHouse={selectedSafeHouse}
          onUpdateOccupancy={updateOccupancy}
        />
      )}

      {/* Personal QR Code Modal */}
      {selectedSafeHouse && user && (
        <PersonalQRModal
          visible={showPersonalQRModal}
          onClose={() => setShowPersonalQRModal(false)}
          safeHouse={selectedSafeHouse}
          user={user}
        />
      )}

      {/* View Occupants Modal */}
      {selectedSafeHouse && (
        <ViewOccupantsModal
          visible={showOccupantsModal}
          onClose={() => setShowOccupantsModal(false)}
          safeHouse={selectedSafeHouse}
        />
      )}

      {/* QR Scanner Modal */}
      {selectedSafeHouse && (
        <QRScannerModal
          visible={showQRScannerModal}
          onClose={() => setShowQRScannerModal(false)}
          safeHouse={selectedSafeHouse}
          onUserCheckedIn={handleSuccessfulCheckIn}
        />
      )}
    </>
  );
}

// Create Safe House Modal Component
function CreateSafeHouseModal({ 
  visible, 
  onClose, 
  onCreateSafeHouse, 
  loading 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onCreateSafeHouse: (data: any) => void; 
  loading: boolean;
}) {
  const [newSafeHouse, setNewSafeHouse] = useState({
    name: '',
    address: '',
    capacity: '',
    facilities: [] as string[],
  });

  const toggleFacility = (facility: string) => {
    setNewSafeHouse(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handleCreate = () => {
    if (!newSafeHouse.name || !newSafeHouse.address || !newSafeHouse.capacity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    onCreateSafeHouse(newSafeHouse);
    setNewSafeHouse({ name: '', address: '', capacity: '', facilities: [] });
  };

  const resetForm = () => {
    setNewSafeHouse({ name: '', address: '', capacity: '', facilities: [] });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Safe House</Text>
            <TouchableOpacity onPress={handleClose} style={styles.modalCloseButton}>
              <X color={theme.colors.onSurface} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Safe House Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newSafeHouse.name}
                onChangeText={(text) => setNewSafeHouse(prev => ({ ...prev, name: text }))}
                placeholder="e.g. Community Center"
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address *</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={newSafeHouse.address}
                onChangeText={(text) => setNewSafeHouse(prev => ({ ...prev, address: text }))}
                placeholder="Full address of the safe house"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Capacity *</Text>
              <TextInput
                style={styles.textInput}
                value={newSafeHouse.capacity}
                onChangeText={(text) => setNewSafeHouse(prev => ({ ...prev, capacity: text }))}
                placeholder="Maximum number of people"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Available Facilities</Text>
              <View style={styles.facilitiesGrid}>
                {['Food', 'Water', 'Medical Aid', 'Shelter', 'Communication', 'Power', 'Children Care'].map((facility) => (
                  <TouchableOpacity
                    key={facility}
                    style={[
                      styles.facilityChip,
                      newSafeHouse.facilities.includes(facility) && styles.facilityChipSelected
                    ]}
                    onPress={() => toggleFacility(facility)}
                  >
                    <Text style={[
                      styles.facilityChipText,
                      newSafeHouse.facilities.includes(facility) && styles.facilityChipTextSelected
                    ]}>
                      {facility}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button title="Cancel" onPress={handleClose} variant="secondary" />
            <Button 
              title={loading ? "Creating..." : "Create"} 
              onPress={handleCreate} 
              variant="accent" 
              disabled={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Occupancy Management Modal Component
function OccupancyManagementModal({ 
  visible, 
  onClose, 
  safeHouse, 
  onUpdateOccupancy 
}: { 
  visible: boolean; 
  onClose: () => void; 
  safeHouse: SafeHouse;
  onUpdateOccupancy: (safeHouseId: string, occupancyChange: number) => Promise<number>;
}) {
  const [newCapacity, setNewCapacity] = useState(safeHouse.capacity.toString());
  const [customChange, setCustomChange] = useState('');

  const handleUpdateCapacity = async () => {
    const capacity = parseInt(newCapacity);
    if (isNaN(capacity) || capacity < 0) {
      Alert.alert('Error', 'Please enter a valid capacity number');
      return;
    }

    if (capacity < safeHouse.currentOccupancy) {
      Alert.alert('Error', `Capacity cannot be less than current occupancy (${safeHouse.currentOccupancy})`);
      return;
    }

    Alert.alert(
      'Update Capacity',
      `Change maximum capacity from ${safeHouse.capacity} to ${capacity}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Update', onPress: () => {
          Alert.alert('Info', 'Capacity update feature coming soon');
          // TODO: Implement updateCapacity backend call
          onClose();
        }}
      ]
    );
  };

  const handleQuickOccupancyChange = async (change: number) => {
    try {
      const newOccupancy = await onUpdateOccupancy(safeHouse.id, change);
      Alert.alert('Success', `Occupancy updated to ${newOccupancy}/${safeHouse.capacity}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update occupancy');
    }
  };

  const handleCustomOccupancyChange = async () => {
    const change = parseInt(customChange);
    if (isNaN(change)) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    if (safeHouse.currentOccupancy + change < 0) {
      Alert.alert('Error', 'Occupancy cannot be negative');
      return;
    }

    if (safeHouse.currentOccupancy + change > safeHouse.capacity) {
      Alert.alert('Error', 'Occupancy cannot exceed capacity');
      return;
    }

    await handleQuickOccupancyChange(change);
    setCustomChange('');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage {safeHouse.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X color={theme.colors.onSurface} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Current Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Status</Text>
              <View style={styles.statusContainer}>
                <Text style={styles.occupancyStatusText}>
                  Occupancy: {safeHouse.currentOccupancy}/{safeHouse.capacity} people
                </Text>
                <Text style={styles.occupancyStatusText}>
                  Available Space: {safeHouse.capacity - safeHouse.currentOccupancy} spots
                </Text>
              </View>
            </View>

            {/* Quick Occupancy Changes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quick Occupancy Changes</Text>
              <View style={styles.quickButtonsContainer}>
                <Button
                  title="+1 Person"
                  onPress={() => handleQuickOccupancyChange(1)}
                  variant="accent"
                  style={styles.quickButton}
                />
                <Button
                  title="-1 Person"
                  onPress={() => handleQuickOccupancyChange(-1)}
                  variant="secondary"
                  style={styles.quickButton}
                />
              </View>
            </View>

            {/* Custom Occupancy Change */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Custom Occupancy Change</Text>
              <View style={styles.customChangeContainer}>
                <TextInput
                  style={[styles.textInput, styles.customChangeInput]}
                  value={customChange}
                  onChangeText={setCustomChange}
                  placeholder="+5 or -3"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  keyboardType="numeric"
                />
                <Button
                  title="Apply"
                  onPress={handleCustomOccupancyChange}
                  variant="accent"
                  style={styles.applyButton}
                />
              </View>
            </View>

            {/* Update Maximum Capacity */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Maximum Capacity</Text>
              <TextInput
                style={styles.textInput}
                value={newCapacity}
                onChangeText={setNewCapacity}
                placeholder="Maximum number of people"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                keyboardType="numeric"
              />
              <Button
                title="Update Capacity"
                onPress={handleUpdateCapacity}
                variant="secondary"
                style={{ marginTop: theme.spacing.sm }}
              />
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

// Personal QR Modal Component
function PersonalQRModal({ 
  visible, 
  onClose, 
  safeHouse,
  user 
}: { 
  visible: boolean; 
  onClose: () => void; 
  safeHouse: SafeHouse;
  user: any;
}) {
  const qrValue = JSON.stringify({
    type: 'user_profile',
    id: user.id,
    name: user.name,
    digiPin: user.digiPin,
    phone: user.phone || '',
    profileImage: user.profileImage || '',
    role: user.role,
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { minHeight: '80%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Identity QR</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X color={theme.colors.onSurface} size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.qrTitle}>{user.name}</Text>
            <Text style={styles.qrSubtitle}>Personal Identity QR Code</Text>
            
            <View style={styles.qrCodeContainer}>
              <QRCode
                value={qrValue}
                size={200}
                color={theme.colors.onBackground}
                backgroundColor={theme.colors.background}
              />
            </View>
            
            <Text style={styles.qrInstructions}>
              Show this QR code to a rescuer to check into "{safeHouse.name}"
            </Text>
            
            <View style={styles.qrDetails}>
              <Text style={styles.qrDetailLabel}>Your DIGIPIN:</Text>
              <Text style={styles.qrDetailValue}>{user.digiPin}</Text>
            </View>
            
            <View style={styles.qrDetails}>
              <Text style={styles.qrDetailLabel}>Safe House:</Text>
              <Text style={styles.qrDetailValue}>{safeHouse.name}</Text>
            </View>
          </View>
          
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

// View Occupants Modal Component
function ViewOccupantsModal({ 
  visible, 
  onClose, 
  safeHouse 
}: { 
  visible: boolean; 
  onClose: () => void; 
  safeHouse: SafeHouse;
}) {
  const [occupants, setOccupants] = useState<any[]>([]);
  
  // Import the query hook directly
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
                  📱 DIGIPIN: {safeHouse.locationDigiPin}
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
                  <View key={occupant.id} style={styles.statusContainer}>
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

// QR Scanner Modal Component  
function QRScannerModal({ 
  visible, 
  onClose, 
  safeHouse,
  onUserCheckedIn 
}: { 
  visible: boolean; 
  onClose: () => void; 
  safeHouse: SafeHouse;
  onUserCheckedIn: (safeHouseId: string, userId: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const { checkInToSafeHouse } = useSafeHouses();
  const { user } = useAuth(); // Get current user (rescuer)

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (!isScanning) return; // Prevent multiple scans
    
    setIsScanning(false); // Stop scanning immediately
    
    try {
      const qrData = JSON.parse(data);
      
      // Check if it's a personal identity QR (same format as user profile QR)
      if (qrData.type !== 'user_profile' || !qrData.name || !qrData.id) {
        Alert.alert('Invalid QR Code', 'Please scan a civilian\'s personal profile QR code.', [
          { text: 'OK', onPress: () => setIsScanning(true) } // Allow scanning again
        ]);
        return;
      }

      // Actually check them into the safe house using backend with REAL user data
      try {
        await checkInToSafeHouse(
          safeHouse.id,
          qrData.id, // Use the REAL scanned user ID
          qrData.name, // Use the REAL scanned user name
          user?.id || '' // Pass the rescuer ID who is scanning
        );
        
        Alert.alert(
          'Check-in Successful!',
          `${qrData.name} (DIGIPIN: ${qrData.digiPin || 'N/A'}) has been checked into ${safeHouse.name}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Update check-in status through callback
                onUserCheckedIn(safeHouse.id, qrData.id);
                onClose();
              }
            }
          ]
        );
      } catch (backendError) {
        Alert.alert(
          'Check-in Failed',
          backendError instanceof Error ? backendError.message : 'Unable to check into safe house',
          [
            { text: 'OK', onPress: () => setIsScanning(true) } // Allow trying again
          ]
        );
      }
    } catch (error) {
      Alert.alert('Invalid QR Code', 'Unable to read QR code data.', [
        { text: 'OK', onPress: () => setIsScanning(true) } // Allow scanning again
      ]);
    }
  };

  // Reset scanning when modal opens
  useEffect(() => {
    if (visible) {
      setIsScanning(true);
    }
  }, [visible]);

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.scannerContainer}>
        <View style={styles.scannerHeader}>
          <Text style={styles.scannerTitle}>Scan Civilian QR Code</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={theme.colors.secondary} size={24} />
          </TouchableOpacity>
        </View>
        
        {!permission ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>Requesting camera permission...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>No access to camera</Text>
            <Button
              title="Grant Permission"
              onPress={requestPermission}
              variant="accent"
            />
          </View>
        ) : (
          <CameraView
            style={styles.scanner}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
          />
        )}
        
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerInstructions}>
            {isScanning 
              ? `Point your camera at a civilian's profile QR code to check them into ${safeHouse.name}`
              : 'Processing...'}
          </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  createButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.sm,
    ...theme.shadows.medium,
  },
  familyStatusCard: {
    margin: theme.spacing.md,
    backgroundColor: `${theme.colors.success}08`,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  familyStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  familyStatusTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginLeft: theme.spacing.xs,
  },
  familyMembers: {},
  familyMember: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  familyMemberName: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusSafe: {
    backgroundColor: theme.colors.success,
  },
  statusAtRisk: {
    backgroundColor: theme.colors.warning,
  },
  statusUnknown: {
    backgroundColor: theme.colors.outline,
  },
  statusText: {
    ...theme.typography.small,
    color: theme.colors.secondary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  safeHousesList: {
    padding: theme.spacing.md,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  safeHouseCard: {
    marginBottom: theme.spacing.md,
  },
  safeHouseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  safeHouseInfo: {
    flex: 1,
  },
  safeHouseName: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.xs,
  },
  safeHouseLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  safeHouseAddress: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  capacityText: {
    ...theme.typography.body,
    color: theme.colors.accent,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  digipinContainer: {
    backgroundColor: theme.colors.accent + '15',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  digipinLabel: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  digipinCode: {
    ...theme.typography.h3,
    color: theme.colors.accent,
    fontFamily: 'monospace',
  },
  facilitiesContainer: {
    marginBottom: theme.spacing.md,
  },
  facilitiesLabel: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  facilityTag: {
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  facilityText: {
    ...theme.typography.small,
    color: theme.colors.onSurfaceVariant,
  },
  safeHouseActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  rescuerToolsCard: {
    margin: theme.spacing.md,
    backgroundColor: `${theme.colors.accent}08`,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
  },
  rescuerToolsTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  rescuerTools: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  rescuerTool: {
    flex: 1,
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
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    fontSize: 16,
    minHeight: 52,
    color: theme.colors.onSurface,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  // Facilities styles
  facilityChip: {
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  facilityChipSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  facilityChipText: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '500',
  },
  facilityChipTextSelected: {
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  // Occupancy Management Modal styles
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
  quickButtonsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  quickButton: {
    flex: 1,
  },
  customChangeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  customChangeInput: {
    flex: 1,
  },
  applyButton: {
    minWidth: 80,
  },
  // Delete button
  deleteButton: {
    marginLeft: theme.spacing.sm,
    minWidth: 80,
  },
  // QR styles for Personal QR Modal
  qrTitle: {
    ...theme.typography.h2,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  qrSubtitle: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  qrCodeContainer: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  qrInstructions: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    maxWidth: 280,
  },
  qrDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  qrDetailLabel: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    marginRight: theme.spacing.sm,
  },
  qrDetailValue: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  // Admission status styles
  admissionStatus: {
    width: '100%',
  },
  admissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  checkIcon: {
    fontSize: 20,
    color: theme.colors.success,
    fontWeight: 'bold',
    marginRight: theme.spacing.sm,
  },
  admissionText: {
    ...theme.typography.body,
    color: theme.colors.success,
    fontWeight: '600',
  },
  leaveButton: {
    width: '100%',
  },
  // Scanner styles (copied from profile.tsx)
  scannerContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1,
  },
  scannerTitle: {
    ...theme.typography.h3,
    color: theme.colors.secondary,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  permissionText: {
    ...theme.typography.body,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'transparent',
  },
  scannerInstructions: {
    ...theme.typography.body,
    color: theme.colors.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
});