import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MapPin, Users, QrCode, CheckCircle, Navigation } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { theme } from '@/constants/theme';
import { SafeHouse } from '@/types/user';

export default function SafeHousesScreen() {
  const { user } = useAuth();
  const { getCurrentLocation } = useLocation();
  const [safeHouses, setSafeHouses] = useState<SafeHouse[]>([
    {
      id: '1',
      name: 'Central Community Center',
      address: '123 Main St, Downtown',
      location: { latitude: 40.7128, longitude: -74.0060 },
      capacity: 200,
      currentOccupancy: 45,
      facilities: ['Food', 'Medical', 'Shelter', 'Communications'],
      managerId: 'manager-1',
      qrCode: 'safehouse-1-checkin',
      isActive: true,
    },
    {
      id: '2',
      name: 'North District School',
      address: '456 Oak Ave, North District',
      location: { latitude: 40.7589, longitude: -73.9851 },
      capacity: 150,
      currentOccupancy: 23,
      facilities: ['Shelter', 'Communications', 'Children Care'],
      managerId: 'manager-2',
      qrCode: 'safehouse-2-checkin',
      isActive: true,
    },
    {
      id: '3',
      name: 'South Emergency Shelter',
      address: '789 Pine Rd, South Area',
      location: { latitude: 40.6892, longitude: -74.0445 },
      capacity: 100,
      currentOccupancy: 67,
      facilities: ['Food', 'Medical', 'Shelter'],
      managerId: 'manager-3',
      qrCode: 'safehouse-3-checkin',
      isActive: true,
    },
  ]);
  
  const [selectedSafeHouse, setSelectedSafeHouse] = useState<SafeHouse | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  const isRescuer = user?.role === 'rescuer';

  const generateCheckInQR = (safeHouse: SafeHouse) => {
    if (!user) return;
    
    const qrData = JSON.stringify({
      type: 'safehouse_checkin',
      safeHouseId: safeHouse.id,
      userId: user.id,
      digiPin: user.digiPin,
      timestamp: new Date().toISOString(),
      familyMembers: user.familyMembers.length,
    });
    
    setSelectedSafeHouse(safeHouse);
    setShowQRCode(true);
  };

  const checkIn = (safeHouse: SafeHouse) => {
    generateCheckInQR(safeHouse);
  };

  const getDirections = (safeHouse: SafeHouse) => {
    Alert.alert(
      'Get Directions',
      `Opening directions to ${safeHouse.name}`,
      [{ text: 'OK' }]
    );
  };

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100;
    if (percentage > 80) return theme.colors.danger;
    if (percentage > 60) return theme.colors.warning;
    return theme.colors.success;
  };

  const getOccupancyStatus = (occupancy: number, capacity: number) => {
    const percentage = (occupancy / capacity) * 100;
    if (percentage > 90) return 'Full';
    if (percentage > 80) return 'Almost Full';
    if (percentage > 60) return 'Moderate';
    return 'Available';
  };

  if (!user) {
    return (
      <View style={styles.authRequired}>
        <Text style={styles.authText}>Please log in to view safe houses</Text>
      </View>
    );
  }

  if (showQRCode && selectedSafeHouse) {
    return (
      <View style={styles.qrContainer}>
        <View style={styles.qrHeader}>
          <Text style={styles.qrTitle}>Check-in QR Code</Text>
          <Text style={styles.qrSubtitle}>{selectedSafeHouse.name}</Text>
        </View>

        <View style={styles.qrCodeContainer}>
          <QRCode
            value={JSON.stringify({
              type: 'safehouse_checkin',
              safeHouseId: selectedSafeHouse.id,
              userId: user.id,
              digiPin: user.digiPin,
              timestamp: new Date().toISOString(),
            })}
            size={200}
            backgroundColor={theme.colors.secondary}
            color={theme.colors.primary}
          />
        </View>

        <Text style={styles.qrInstructions}>
          Show this QR code to a rescuer or safe house manager to check in
        </Text>

        <View style={styles.qrDetails}>
          <Text style={styles.qrDetailLabel}>DigiPIN:</Text>
          <Text style={styles.qrDetailValue}>{user.digiPin}</Text>
        </View>

        <View style={styles.qrButtons}>
          <Button
            title="Done"
            onPress={() => {
              setShowQRCode(false);
              setCheckedIn(true);
            }}
            variant="accent"
            style={styles.qrButton}
          />
          <Button
            title="Cancel"
            onPress={() => setShowQRCode(false)}
            variant="secondary"
            style={styles.qrButton}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Safe Houses</Text>
        <Text style={styles.subtitle}>
          Find shelter and check-in to safe locations
        </Text>
      </View>

      {/* Family Status */}
      {user.familyMembers.length > 0 && (
        <Card style={styles.familyStatusCard}>
          <View style={styles.familyStatusHeader}>
            <Users color={theme.colors.accent} size={20} />
            <Text style={styles.familyStatusTitle}>Family Status</Text>
          </View>
          <View style={styles.familyMembers}>
            {user.familyMembers.map((member) => (
              <View key={member.id} style={styles.familyMember}>
                <Text style={styles.familyMemberName}>{member.name}</Text>
                <View style={styles.familyMemberStatus}>
                  {member.isAtSafeHouse ? (
                    <>
                      <CheckCircle color={theme.colors.success} size={16} />
                      <Text style={styles.familyMemberSafe}>Safe</Text>
                    </>
                  ) : (
                    <Badge label="Not Checked In" variant="warning" size="small" />
                  )}
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Safe Houses List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Safe Houses</Text>
          {isRescuer && (
            <Button
              title="Add New"
              onPress={() => Alert.alert('Add Safe House', 'Feature coming soon')}
              variant="accent"
              size="small"
            />
          )}
        </View>

        {safeHouses.map((safeHouse) => (
          <Card key={safeHouse.id} style={styles.safeHouseCard}>
            <View style={styles.safeHouseHeader}>
              <View style={styles.safeHouseInfo}>
                <Text style={styles.safeHouseName}>{safeHouse.name}</Text>
                <View style={styles.safeHouseLocation}>
                  <MapPin color={theme.colors.accent} size={16} />
                  <Text style={styles.safeHouseAddress}>{safeHouse.address}</Text>
                </View>
              </View>
              
              <View style={styles.occupancyContainer}>
                <View style={styles.occupancyBar}>
                  <View
                    style={[
                      styles.occupancyFill,
                      {
                        width: `${(safeHouse.currentOccupancy / safeHouse.capacity) * 100}%`,
                        backgroundColor: getOccupancyColor(safeHouse.currentOccupancy, safeHouse.capacity),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.occupancyText}>
                  {safeHouse.currentOccupancy}/{safeHouse.capacity}
                </Text>
              </View>
            </View>

            <Badge
              label={getOccupancyStatus(safeHouse.currentOccupancy, safeHouse.capacity)}
              variant={
                safeHouse.currentOccupancy / safeHouse.capacity > 0.8
                  ? 'danger'
                  : safeHouse.currentOccupancy / safeHouse.capacity > 0.6
                  ? 'warning'
                  : 'success'
              }
              size="small"
            />

            {/* Facilities */}
            <View style={styles.facilities}>
              <Text style={styles.facilitiesTitle}>Available:</Text>
              <View style={styles.facilitiesList}>
                {safeHouse.facilities.map((facility, index) => (
                  <Badge
                    key={index}
                    label={facility}
                    variant="primary"
                    size="small"
                  />
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.safeHouseActions}>
              <Button
                title="Check In"
                onPress={() => checkIn(safeHouse)}
                variant="accent"
                size="small"
                style={styles.actionButton}
              />
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={() => getDirections(safeHouse)}
              >
                <Navigation color={theme.colors.accent} size={16} />
                <Text style={styles.directionsText}>Directions</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </View>

      {/* Rescuer Tools */}
      {isRescuer && (
        <Card style={styles.rescuerToolsCard}>
          <Text style={styles.rescuerToolsTitle}>Rescuer Tools</Text>
          <View style={styles.rescuerTools}>
            <Button
              title="Scan QR Code"
              onPress={() => Alert.alert('QR Scanner', 'Opening QR code scanner...')}
              variant="primary"
              style={styles.rescuerTool}
            />
            <Button
              title="Manage Occupancy"
              onPress={() => Alert.alert('Occupancy', 'Opening occupancy management...')}
              variant="secondary"
              style={styles.rescuerTool}
            />
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
  familyMemberStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  familyMemberSafe: {
    ...theme.typography.caption,
    color: theme.colors.success,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.onBackground,
  },
  safeHouseCard: {
    marginBottom: theme.spacing.md,
  },
  safeHouseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
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
  },
  occupancyContainer: {
    alignItems: 'flex-end',
    marginLeft: theme.spacing.md,
  },
  occupancyBar: {
    width: 60,
    height: 6,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 3,
    marginBottom: theme.spacing.xs,
    overflow: 'hidden',
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 3,
  },
  occupancyText: {
    ...theme.typography.small,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  facilities: {
    marginVertical: theme.spacing.sm,
  },
  facilitiesTitle: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  facilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  safeHouseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  actionButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  directionsText: {
    ...theme.typography.body,
    color: theme.colors.accent,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
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
    gap: theme.spacing.sm,
  },
  rescuerTool: {
    flex: 1,
  },
  qrContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  qrTitle: {
    ...theme.typography.h2,
    color: theme.colors.onBackground,
  },
  qrSubtitle: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  qrCodeContainer: {
    backgroundColor: theme.colors.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
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
    marginBottom: theme.spacing.xl,
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
  qrButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    width: '100%',
    maxWidth: 280,
  },
  qrButton: {
    flex: 1,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});