import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SOSRequest } from '@/types/user';
import { useLocation } from './useLocation';
import type { Id } from '@/convex/_generated/dataModel';

export function useSOS(userId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const { getCurrentLocation } = useLocation();

  // Helper function to convert Convex SOS to app SOS type
  const convertConvexSOSToSOS = (convexSOS: any): SOSRequest => {
    return {
      id: convexSOS._id,
      userId: convexSOS.userId,
      location: convexSOS.location,
      status: convexSOS.status,
      digiPin: convexSOS.digiPin,
      timestamp: new Date(convexSOS.timestamp).toISOString(),
      rescuerId: convexSOS.rescuerId,
      notes: convexSOS.notes,
      photos: convexSOS.photos,
    };
  };

  // Convex hooks
  const createSOSRequest = useMutation(api.sos.createSOSRequest);
  const updateSOSStatusMutation = useMutation(api.sos.updateSOSStatus);
  const getUserSOSRequests = useQuery(
    api.sos.getUserSOSRequests,
    userId ? { userId: userId as Id<'users'> } : 'skip'
  );

  // Get the most recent active SOS request (not cancelled or rescued)
  const sosRequest = getUserSOSRequests?.find(sos => 
    sos.status === 'sent' || sos.status === 'in-progress'
  ) ? convertConvexSOSToSOS(getUserSOSRequests.find(sos => 
    sos.status === 'sent' || sos.status === 'in-progress'
  )!) : null;

  const sendSOS = async (userId: string, digiPin: string): Promise<SOSRequest> => {
    // Check if user already has an active SOS request
    const activeRequest = getUserSOSRequests?.find(sos => 
      sos.status === 'sent' || sos.status === 'in-progress'
    );
    
    if (activeRequest) {
      throw new Error('You already have an active SOS request. Please wait for rescue or cancel the current request.');
    }
    
    setIsLoading(true);
    
    try {
      const location = await getCurrentLocation();
      if (!location) {
        throw new Error('Unable to get location');
      }

      const sosId = await createSOSRequest({
        userId: userId as Id<'users'>,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        notes: 'Emergency assistance required',
      });

      // Return the created SOS request
      const newSOSRequest: SOSRequest = {
        id: sosId,
        userId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
        },
        status: 'sent',
        digiPin,
        timestamp: new Date().toISOString(),
        notes: 'Emergency assistance required',
      };

      return newSOSRequest;
    } catch (error) {
      console.error('Error sending SOS:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSOS = async (sosId: string) => {
    try {
      await updateSOSStatusMutation({
        sosId: sosId as Id<'sosRequests'>,
        status: 'cancelled',
      });
    } catch (error) {
      console.error('Error cancelling SOS:', error);
      throw error;
    }
  };

  const getSOSHistory = (): SOSRequest[] => {
    return getUserSOSRequests?.map(convertConvexSOSToSOS).filter(sos => 
      sos.status === 'rescued' || sos.status === 'cancelled'
    ) || [];
  };

  // Get all SOS requests for the user
  const getAllSOSRequests = (): SOSRequest[] => {
    return getUserSOSRequests?.map(convertConvexSOSToSOS) || [];
  };

  // Get active SOS requests for rescuers
  const getActiveSOSRequests = async (): Promise<SOSRequest[]> => {
    // This would need a specific Convex query to get all active SOS requests for rescuer dashboard
    return [];
  };

  return {
    sosRequest,
    isLoading,
    sendSOS,
    cancelSOS,
    getSOSHistory,
    getAllSOSRequests,
    getActiveSOSRequests,
  };
}