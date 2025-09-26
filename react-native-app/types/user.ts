export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: 'civilian' | 'rescuer';
  digiPin: string;
  familyMembers: FamilyMember[];
  profileImage?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  isAtSafeHouse: boolean;
  safeHouseId?: string;
  digiPin?: string;
  profileImage?: string;
}

export interface SOSRequest {
  id: string;
  userId: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: 'sent' | 'in-progress' | 'rescued' | 'cancelled';
  digiPin: string;
  timestamp: string;
  rescuerId?: string;
  notes?: string;
  photos?: string[];
}

export interface SafeHouse {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  capacity: number;
  currentOccupancy: number;
  facilities: string[];
  managerId: string;
  qrCode: string;
  isActive: boolean;
}

export interface Hazard {
  id: string;
  reporterId: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  photos: string[];
  status: 'pending' | 'verified' | 'assigned' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedRescuerId?: string;
  timestamp: string;
  resolvedTimestamp?: string;
}