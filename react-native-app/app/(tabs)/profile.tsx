import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import {
  User,
  Shield,
  Users,
  Settings,
  LogOut,
  Edit,
  QrCode,
  Scan,
  X,
  Volume2,
  VolumeX,
  Trash2,
} from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { BarCodeScanner } from 'expo-barcode-scanner';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@/hooks/useAuth';
import { useFamily } from '@/hooks/useFamily';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { theme } from '@/constants/theme';
import { FamilyMember } from '@/types/user';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { familyMembers, addFamilyMember, removeFamilyMember: removeFamilyFromConvex } = useFamily(user?.id);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [showQRCode, setShowQRCode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const saveProfile = async () => {
    if (!user) return;
    
    try {
      await updateUser({
        ...user,
        name: editedName,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setShowScanner(false);
    
    try {
      // Parse QR code data (expected format: JSON with user info)
      const scannedUser = JSON.parse(data);
      
      if (scannedUser.type !== 'user_profile' || !scannedUser.name || !scannedUser.id) {
        Alert.alert('Invalid QR Code', 'This QR code is not a valid user profile.');
        return;
      }

      // Check if already added
      if (user?.familyMembers.some(member => member.id === scannedUser.id)) {
        Alert.alert('Already Added', 'This person is already in your family members list.');
        return;
      }

      // Add as family member
      Alert.alert(
        'Add Family Member',
        `Add ${scannedUser.name} to your family members?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: () => addScannedFamilyMember(scannedUser),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Invalid QR Code', 'Could not read the QR code data.');
    }
  };

  const addScannedFamilyMember = async (scannedUser: any) => {
    if (!user) return;

    try {
      await addFamilyMember(scannedUser.id, 'Family');
      Alert.alert('Success', `${scannedUser.name} added to family members successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add family member');
    }
  };

  const removeFamilyMember = async (memberId: string) => {
    if (!user) return;

    Alert.alert(
      'Remove Family Member',
      'Are you sure you want to remove this family member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFamilyFromConvex(memberId);
              Alert.alert('Success', 'Family member removed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove family member');
            }
          },
        },
      ]
    );
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    
    if (!voiceEnabled) {
      Speech.speak('Voice assistance enabled', { language: 'en' });
    }
  };

  const speakDigiPin = () => {
    if (!user || !voiceEnabled) return;
    
    const spokenPin = user.digiPin.split('').join(' ');
    Speech.speak(`Your DigiPIN is ${spokenPin}`, { language: 'en' });
  };

  const generateUserQRData = () => {
    if (!user) return '';
    
    return JSON.stringify({
      type: 'user_profile',
      id: user.id,
      name: user.name,
      digiPin: user.digiPin,
      phone: user.phone || '',
      profileImage: user.profileImage || '',
      role: user.role,
    });
  };

  if (!user) {
    return (
      <View style={styles.authRequired}>
        <Text style={styles.authText}>Please log in to view profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar name={user.name} size="large" image={user.profileImage} />
        <View style={styles.userInfo}>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.nameInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => setIsEditing(false)}>
                  <Text style={styles.editCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveProfile}>
                  <Text style={styles.editSave}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{user.name}</Text>
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Edit color={theme.colors.onSurfaceVariant} size={16} />
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={styles.userEmail}>{user.email}</Text>
          <Badge
            label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            variant={user.role === 'rescuer' ? 'accent' : 'primary'}
          />
        </View>
      </View>

      {/* DigiPIN Card with QR */}
      <Card style={styles.digiPinCard}>
        <View style={styles.digiPinHeader}>
          <View style={styles.digiPinInfo}>
            <Shield color={theme.colors.accent} size={20} />
            <Text style={styles.digiPinTitle}>Your DigiPIN</Text>
          </View>
          
          <View style={styles.digiPinActions}>
            <TouchableOpacity onPress={speakDigiPin} disabled={!voiceEnabled}>
              <Volume2 
                color={voiceEnabled ? theme.colors.accent : theme.colors.onSurfaceVariant} 
                size={20} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowQRCode(true)} style={styles.qrButton}>
              <QrCode color={theme.colors.accent} size={20} />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.digiPin}>{user.digiPin}</Text>
        <Text style={styles.digiPinNote}>
          Share this code with rescuers for quick identification during emergencies
        </Text>
      </Card>

      {/* Family Members */}
      <Card style={styles.familyCard}>
        <View style={styles.familyHeader}>
          <View style={styles.familyInfo}>
            <Users color={theme.colors.accent} size={20} />
            <Text style={styles.familyTitle}>Family Members ({familyMembers.length})</Text>
          </View>
          
          <TouchableOpacity onPress={() => setShowScanner(true)} style={styles.scanButton}>
            <Scan color={theme.colors.accent} size={20} />
          </TouchableOpacity>
        </View>

        {familyMembers.length === 0 ? (
          <View style={styles.noFamilyContainer}>
            <Text style={styles.noFamily}>
              No family members added yet.
            </Text>
            <Text style={styles.noFamilySubtext}>
              Scan their QR codes to add family members and track their safety.
            </Text>
          </View>
        ) : (
          familyMembers.map((member) => (
            <View key={member.id} style={styles.familyMember}>
              <Avatar name={member.name} size="small" image={member.profileImage} />
              
              <View style={styles.familyMemberInfo}>
                <Text style={styles.familyMemberName}>{member.name}</Text>
                <Text style={styles.familyMemberRelation}>{member.relationship}</Text>
                {member.phone && (
                  <Text style={styles.familyMemberPhone}>📞 {member.phone}</Text>
                )}
                {member.digiPin && (
                  <Text style={styles.familyMemberPin}>DigiPIN: {member.digiPin}</Text>
                )}
              </View>
              
              <View style={styles.familyMemberActions}>
                <Badge
                  label={member.isAtSafeHouse ? 'Safe' : 'Unknown'}
                  variant={member.isAtSafeHouse ? 'success' : 'warning'}
                  size="small"
                />
                <TouchableOpacity onPress={() => removeFamilyMember(member.id)}>
                  <Trash2 color={theme.colors.danger} size={16} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </Card>

      {/* Settings */}
      <Card style={styles.settingsCard}>
        <View style={styles.settingsHeader}>
          <Settings color={theme.colors.accent} size={20} />
          <Text style={styles.settingsTitle}>Settings</Text>
        </View>

        <TouchableOpacity style={styles.setting} onPress={toggleVoice}>
          <View style={styles.settingInfo}>
            {voiceEnabled ? (
              <Volume2 color={theme.colors.accent} size={20} />
            ) : (
              <VolumeX color={theme.colors.onSurfaceVariant} size={20} />
            )}
            <Text style={styles.settingText}>Voice Assistance</Text>
          </View>
          <Badge
            label={voiceEnabled ? 'On' : 'Off'}
            variant={voiceEnabled ? 'success' : 'warning'}
            size="small"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.setting}>
          <View style={styles.settingInfo}>
            <Shield color={theme.colors.accent} size={20} />
            <Text style={styles.settingText}>Privacy & Security</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.setting}>
          <View style={styles.settingInfo}>
            <User color={theme.colors.accent} size={20} />
            <Text style={styles.settingText}>Account Settings</Text>
          </View>
        </TouchableOpacity>
      </Card>

      {/* Logout */}
      <Card style={styles.logoutCard}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color={theme.colors.danger} size={20} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Card>

      {/* QR Code Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showQRCode}
        onRequestClose={() => setShowQRCode(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>Your Profile QR Code</Text>
              <TouchableOpacity onPress={() => setShowQRCode(false)}>
                <X color={theme.colors.onBackground} size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrContainer}>
              <QRCode
                value={generateUserQRData()}
                size={200}
                backgroundColor="white"
                color="black"
              />
            </View>
            
            <Text style={styles.qrModalNote}>
              Let others scan this QR code to add you as a family member
            </Text>
            
            <Text style={styles.qrDataPreview}>
              {JSON.stringify(JSON.parse(generateUserQRData()), null, 2)}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Scanner Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showScanner}
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scan Family Member QR Code</Text>
            <TouchableOpacity onPress={() => setShowScanner(false)}>
              <X color={theme.colors.secondary} size={24} />
            </TouchableOpacity>
          </View>
          
          {hasPermission === null ? (
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>Requesting camera permission...</Text>
            </View>
          ) : hasPermission === false ? (
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>No access to camera</Text>
              <Button
                title="Grant Permission"
                onPress={async () => {
                  const { status } = await BarCodeScanner.requestPermissionsAsync();
                  setHasPermission(status === 'granted');
                }}
                variant="accent"
              />
            </View>
          ) : (
            <BarCodeScanner
              onBarCodeScanned={handleBarCodeScanned}
              style={styles.scanner}
            />
          )}
          
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerInstructions}>
              Point your camera at a family member's QR code to add them to your family list
            </Text>
          </View>
        </View>
      </Modal>

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
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    backgroundColor: theme.colors.secondary,
  },
  userInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  editContainer: {
    flex: 1,
  },
  nameInput: {
    ...theme.typography.h2,
    color: theme.colors.onBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.accent,
    paddingBottom: 4,
    marginBottom: theme.spacing.xs,
  },
  editActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  editCancel: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
  },
  editSave: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  userName: {
    ...theme.typography.h2,
    color: theme.colors.onBackground,
  },
  userEmail: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    marginVertical: theme.spacing.xs,
  },
  digiPinCard: {
    margin: theme.spacing.md,
  },
  digiPinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  digiPinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digiPinTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginLeft: theme.spacing.xs,
  },
  digiPinActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  qrButton: {
    padding: theme.spacing.xs,
  },
  digiPin: {
    ...theme.typography.h1,
    color: theme.colors.accent,
    fontFamily: 'monospace',
    letterSpacing: 4,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
  digiPinNote: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  familyCard: {
    margin: theme.spacing.md,
  },
  familyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  familyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  familyTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginLeft: theme.spacing.xs,
  },
  scanButton: {
    padding: theme.spacing.xs,
    backgroundColor: `${theme.colors.accent}15`,
    borderRadius: theme.borderRadius.sm,
  },
  noFamilyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  noFamily: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  noFamilySubtext: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  familyMember: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  familyMemberInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  familyMemberName: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    fontWeight: '600',
  },
  familyMemberRelation: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  familyMemberPhone: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  familyMemberPin: {
    ...theme.typography.caption,
    color: theme.colors.accent,
    marginTop: 2,
    fontFamily: 'monospace',
    fontSize: 11,
  },
  familyMemberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  settingsCard: {
    margin: theme.spacing.md,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  settingsTitle: {
    ...theme.typography.h3,
    color: theme.colors.onBackground,
    marginLeft: theme.spacing.xs,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    ...theme.typography.body,
    color: theme.colors.onBackground,
    marginLeft: theme.spacing.sm,
  },
  logoutCard: {
    margin: theme.spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  logoutText: {
    ...theme.typography.body,
    color: theme.colors.danger,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModal: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    margin: theme.spacing.lg,
    alignItems: 'center',
    maxHeight: '80%',
    ...theme.shadows.large,
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  qrModalTitle: {
    ...theme.typography.h2,
    color: theme.colors.onBackground,
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  qrModalNote: {
    ...theme.typography.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  qrDataPreview: {
    ...theme.typography.caption,
    color: theme.colors.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 10,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    maxWidth: width * 0.8,
  },
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
    maxWidth: width * 0.9,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});