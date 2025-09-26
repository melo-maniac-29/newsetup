import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Hazard } from '@/types/user';
import type { Id } from '@/convex/_generated/dataModel';

export function useHazards() {
  const [loading, setLoading] = useState(false);

  // Convex queries and mutations
  const hazardsQuery = useQuery(api.hazards.getHazards);
  const createHazardMutation = useMutation(api.hazards.createHazard);
  const updateHazardStatusMutation = useMutation(api.hazards.updateHazardStatus);
  const assignHazardMutation = useMutation(api.hazards.assignHazard);
  const updateHazardPriorityMutation = useMutation(api.hazards.updateHazardPriority);

  // Helper function to convert Convex hazard to app format
  const convertConvexHazard = (convexHazard: any): Hazard => {
    return {
      id: convexHazard._id,
      reporterId: convexHazard.reporterId,
      title: convexHazard.title,
      description: convexHazard.description,
      location: convexHazard.location,
      photos: convexHazard.photos || [],
      status: mapConvexStatusToAppStatus(convexHazard.status),
      priority: convexHazard.priority,
      timestamp: new Date(convexHazard.timestamp).toISOString(),
    };
  };

  // Map Convex status to app status
  const mapConvexStatusToAppStatus = (convexStatus: string): 'pending' | 'verified' | 'assigned' | 'resolved' => {
    switch (convexStatus) {
      case 'pending':
        return 'pending';
      case 'ml-verified':
      case 'human-verified':
        return 'verified';
      case 'assigned':
        return 'assigned';
      case 'resolved':
        return 'resolved';
      default:
        return 'pending';
    }
  };

  // Convert Convex data to app format
  const hazards: Hazard[] = hazardsQuery?.map(convertConvexHazard) || [];

  const createHazard = async (
    reporterId: string,
    title: string,
    description: string,
    latitude: number,
    longitude: number,
    address?: string,
    photos?: string[]
  ): Promise<{ success: boolean; data?: string; error?: string }> => {
    try {
      setLoading(true);
      
      const hazardId = await createHazardMutation({
        reporterId: reporterId as Id<'users'>,
        title,
        description,
        latitude,
        longitude,
        address,
        photos,
      });
      
      return { success: true, data: hazardId };
    } catch (error) {
      console.error('Error creating hazard:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create hazard' };
    } finally {
      setLoading(false);
    }
  };

  const updateHazardStatus = async (
    hazardId: string,
    status: 'pending' | 'ml-verified' | 'human-verified' | 'assigned' | 'in-progress' | 'resolved' | 'rejected',
    verifierId?: string,
    resolutionNotes?: string,
    resolutionPhotos?: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      await updateHazardStatusMutation({
        hazardId: hazardId as Id<'hazards'>,
        status,
        verifierId: verifierId ? verifierId as Id<'users'> : undefined,
        resolutionNotes,
        resolutionPhotos,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating hazard status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update hazard' };
    } finally {
      setLoading(false);
    }
  };

  const assignHazard = async (
    hazardId: string,
    rescuerId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await assignHazardMutation({
        hazardId: hazardId as Id<'hazards'>,
        rescuerId: rescuerId as Id<'users'>,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error assigning hazard:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to assign hazard' };
    }
  };

  const updateHazardPriority = async (
    hazardId: string,
    priority: 'low' | 'medium' | 'high' | 'critical',
    aiData?: {
      mlVerificationScore?: number;
      mlClassification?: string;
      mlAnalysis?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await updateHazardPriorityMutation({
        hazardId: hazardId as Id<'hazards'>,
        priority,
        ...aiData,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating hazard priority:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update priority' };
    }
  };

  const getHazardsByStatus = (status: 'pending' | 'verified' | 'assigned' | 'resolved'): Hazard[] => {
    return hazards.filter(hazard => hazard.status === status);
  };

  const getNearbyHazards = (userLat: number, userLng: number, radiusKm = 5): Hazard[] => {
    return hazards.filter(hazard => {
      const distance = calculateDistance(
        userLat, 
        userLng, 
        hazard.location.latitude, 
        hazard.location.longitude
      );
      return distance <= radiusKm;
    });
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
    hazards,
    loading: loading || hazardsQuery === undefined,
    createHazard,
    updateHazardStatus,
    assignHazard,
    updateHazardPriority,
    getHazardsByStatus,
    getNearbyHazards,
  };
}