import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SOSRequest } from '@/types/user';
import { useLocation } from './useLocation';
import { getCurrentDigiPin } from '@/utils/digipin';
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

  // Query for active SOS requests (for rescuers)
  const activeSOSRequestsQuery = useQuery(api.sos.getActiveSOSRequests);

  // Get the most recent active SOS request (not cancelled or rescued)
  const sosRequest = getUserSOSRequests?.find(sos => 
    sos.status === 'sent' || sos.status === 'in-progress'
  ) ? convertConvexSOSToSOS(getUserSOSRequests.find(sos => 
    sos.status === 'sent' || sos.status === 'in-progress'
  )!) : null;

  const sendSOS = async (userId: string, fallbackDigiPin: string): Promise<SOSRequest> => {
    // Check if user already has an active SOS request
    const activeRequest = getUserSOSRequests?.find(sos => 
      sos.status === 'sent' || sos.status === 'in-progress'
    );
    
    if (activeRequest) {
      throw new Error('You already have an active SOS request. Please wait for rescue or cancel the current request.');
    }
    
    setIsLoading(true);
    
    try {
      // Get current location with high accuracy for emergency
      console.log('Getting current location for SOS...');
      const location = await getCurrentLocation();
      if (!location) {
        throw new Error('Unable to get current location for emergency');
      }
      
      // Generate real-time DigiPIN based on current location
      console.log('Generating real-time DigiPIN for current location...');
      let currentDigiPin = fallbackDigiPin;
      
      try {
        const digiPinResult = await getCurrentDigiPin();
        if (digiPinResult.digiPin && !digiPinResult.error) {
          currentDigiPin = digiPinResult.digiPin;
          console.log('Generated current location DigiPIN:', currentDigiPin);
        } else {
          console.log('Using fallback DigiPIN due to error:', digiPinResult.error);
        }
      } catch (error) {
        console.log('DigiPIN generation failed, using stored DigiPIN:', error);
      }

      const sosId = await createSOSRequest({
        userId: userId as Id<'users'>,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        currentDigiPin: currentDigiPin, // Pass the current location DigiPIN
        notes: 'Emergency assistance required',
      });

      // Return the created SOS request with current DigiPIN
      const newSOSRequest: SOSRequest = {
        id: sosId,
        userId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
        },
        status: 'sent',
        digiPin: currentDigiPin, // Use the current location DigiPIN
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
  const getActiveSOSRequests = (): SOSRequest[] => {
    return activeSOSRequestsQuery?.map(convertConvexSOSToSOS) || [];
  };

  // Accept SOS request (for rescuers)
  const acceptSOSRequest = useMutation(api.sos.acceptSOSRequest);
  
  const acceptSOS = async (sosId: string, rescuerId: string) => {
    try {
      await acceptSOSRequest({
        sosId: sosId as Id<'sosRequests'>,
        rescuerId: rescuerId as Id<'users'>,
      });
    } catch (error) {
      console.error('Error accepting SOS:', error);
      throw error;
    }
  };

  const completeSOS = async (sosId: string, rescuerId: string, notes?: string) => {
    try {
      await updateSOSStatusMutation({
        sosId: sosId as Id<'sosRequests'>,
        status: 'rescued',
        rescuerId: rescuerId as Id<'users'>,
        notes: notes || 'Rescue completed successfully',
      });
    } catch (error) {
      console.error('Error completing SOS:', error);
      throw error;
    }
  };

  return {
    sosRequest,
    isLoading,
    sendSOS,
    cancelSOS,
    getSOSHistory,
    getAllSOSRequests,
    getActiveSOSRequests,
    acceptSOS,
    completeSOS,
  };
}