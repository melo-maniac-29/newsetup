import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeHouse } from '@/types/user';
import type { Id } from '@/convex/_generated/dataModel';

export function useSafeHouses() {
  const [loading, setLoading] = useState(false);

  // Convex queries and mutations
  const safeHousesQuery = useQuery(api.safehouses.getSafeHouses);
  const checkInMutation = useMutation(api.safehouses.checkInUser);
  const checkOutMutation = useMutation(api.safehouses.checkOutUser);
  const updateOccupancyMutation = useMutation(api.safehouses.updateOccupancy);

  // Helper function to convert Convex safe house to app format
  const convertConvexSafeHouse = (convexHouse: any): SafeHouse => {
    return {
      id: convexHouse._id,
      name: convexHouse.name,
      address: convexHouse.address,
      location: convexHouse.location,
      capacity: convexHouse.capacity,
      currentOccupancy: convexHouse.currentOccupancy,
      facilities: convexHouse.facilities,
      managerId: convexHouse.managerId,
      qrCode: convexHouse.qrCodeData,
      isActive: convexHouse.isActive,
    };
  };

  // Convert Convex data to app format
  const safeHouses: SafeHouse[] = safeHousesQuery?.map(convertConvexSafeHouse) || [];

  const getNearestSafeHouses = (userLat: number, userLng: number, limit = 5): SafeHouse[] => {
    return safeHouses
      .filter(house => house.isActive && house.currentOccupancy < house.capacity)
      .map(house => ({
        ...house,
        distance: calculateDistance(userLat, userLng, house.location.latitude, house.location.longitude),
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit);
  };

  const getSafeHouseById = (id: string): SafeHouse | undefined => {
    return safeHouses.find(house => house.id === id);
  };

  const checkInToSafeHouse = async (
    safeHouseId: string,
    userId: string,
    userName: string,
    qrCode: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      
      await checkInMutation({ 
        userId: userId as Id<'users'>, 
        safeHouseId: safeHouseId as Id<'safeHouses'>, 
        qrCode 
      });
      
      return true;
    } catch (error) {
      console.error('Error checking in to safe house:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkOutFromSafeHouse = async (userId: string, safeHouseId: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      await checkOutMutation({ 
        userId: userId as Id<'users'>, 
        safeHouseId: safeHouseId as Id<'safeHouses'> 
      });
      
      return true;
    } catch (error) {
      console.error('Error checking out from safe house:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getUserCheckInStatus = async (userId: string): Promise<{
    isCheckedIn: boolean;
    currentSafeHouse?: SafeHouse;
    checkInTime?: string;
  }> => {
    return { isCheckedIn: false };
  };

  const getCheckInHistory = async (): Promise<any[]> => {
    return [];
  };

  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  return {
    safeHouses,
    loading,
    getNearestSafeHouses,
    getSafeHouseById,
    checkInToSafeHouse,
    checkOutFromSafeHouse,
    getUserCheckInStatus,
    getCheckInHistory,
  };
}