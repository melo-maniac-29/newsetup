import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { FamilyMember } from '@/types/user';
import type { Id } from '@/convex/_generated/dataModel';

export function useFamily(userId?: string) {
  // Helper function to convert Convex family member to app format
  const convertConvexFamilyMember = (convexMember: any): FamilyMember => {
    return {
      id: convexMember.familyMemberId,
      name: convexMember.memberDetails?.name || 'Unknown',
      relationship: convexMember.relationship,
      phone: convexMember.memberDetails?.phone,
      // Use real-time safe house status from user's currentSafeHouseId
      isAtSafeHouse: convexMember.isAtSafeHouse,
      safeHouseId: convexMember.safeHouseId,
      safeHouseName: convexMember.safeHouseName,
      checkInTime: convexMember.checkInTime,
      digiPin: convexMember.memberDetails?.digiPin,
      profileImage: convexMember.memberDetails?.profileImage,
    };
  };

  // Convex hooks
  const addFamilyMutation = useMutation(api.family.addFamilyMember);
  const removeFamilyMutation = useMutation(api.family.removeFamilyMember);
  const familyMembersQuery = useQuery(
    api.family.getFamilyMembers,
    userId ? { userId: userId as Id<'users'> } : 'skip'
  );

  // Convert Convex family members to app format
  const familyMembers: FamilyMember[] = familyMembersQuery?.map(convertConvexFamilyMember) || [];

  const addFamilyMember = async (familyMemberId: string, relationship: string) => {
    if (!userId) throw new Error('User ID required');
    
    try {
      await addFamilyMutation({
        userId: userId as Id<'users'>,
        familyMemberId: familyMemberId as Id<'users'>,
        relationship,
      });
    } catch (error) {
      console.error('Error adding family member:', error);
      throw error;
    }
  };

  const removeFamilyMember = async (familyMemberId: string) => {
    if (!userId) throw new Error('User ID required');
    
    try {
      await removeFamilyMutation({
        userId: userId as Id<'users'>,
        familyMemberId: familyMemberId as Id<'users'>,
      });
    } catch (error) {
      console.error('Error removing family member:', error);
      throw error;
    }
  };

  return {
    familyMembers,
    addFamilyMember,
    removeFamilyMember,
  };
}