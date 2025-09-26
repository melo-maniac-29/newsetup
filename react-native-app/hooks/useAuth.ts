import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { User, FamilyMember } from '@/types/user';
import type { Id } from '@/convex/_generated/dataModel';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Convex mutations and queries
  const createOrLoginUser = useMutation(api.users.createOrLoginUser);
  const updateUserMutation = useMutation(api.users.updateUser);
  const getUserByEmail = useQuery(api.users.getUserByEmail, 
    currentUserEmail ? { email: currentUserEmail } : 'skip'
  );

  useEffect(() => {
    // Load stored email on app start
    const loadStoredEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        if (storedEmail) {
          console.log('Found stored email:', storedEmail);
          setCurrentUserEmail(storedEmail);
        }
      } catch (error) {
        console.error('Error loading stored email:', error);
      }
      setLoading(false);
    };
    
    loadStoredEmail();
  }, []);

  // Sync with Convex when getUserByEmail updates
  useEffect(() => {
    if (getUserByEmail && currentUserEmail) {
      console.log('Syncing user from Convex query');
      const convexUser = convertConvexUserToUser(getUserByEmail);
      setUser(convexUser);
    }
  }, [getUserByEmail, currentUserEmail]);

  useEffect(() => {
    console.log('User state changed:', user ? `${user.name} (${user.email})` : 'null');
  }, [user]);

  const login = async (email: string, name: string, phone?: string, role: 'civilian' | 'rescuer' = 'civilian') => {
    try {
      setLoading(true);
      console.log('Starting login process for:', email);
      
      // Create new user in Convex (will handle existing users)
      const result = await createOrLoginUser({
        email,
        name,
        phone,
        role,
      });
      
      console.log('Convex result:', result);
      
      if (!result || !result.userId) {
        throw new Error('Invalid response from Convex');
      }
      
      // Store email persistently
      await AsyncStorage.setItem('userEmail', email);
      console.log('Stored email in AsyncStorage');
      
      // Set the current user email to trigger the query
      console.log('Setting current user email to trigger query');
      setCurrentUserEmail(email);
      
      // Don't set user state manually - let the query handle it
      console.log('Login process complete, waiting for Convex query to update user state');
      return { userId: result.userId, email, name, role };
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Re-throw the original error instead of a generic one
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userEmail');
      console.log('Cleared stored email');
      setUser(null);
      setCurrentUserEmail(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      if (!user) throw new Error('No user to update');
      
      // Update in Convex
      await updateUserMutation({
        userId: user.id as Id<'users'>,
        name: updatedUser.name,
        phone: updatedUser.phone,
        profileImage: updatedUser.profileImage,
        voiceEnabled: true, // Default value
        language: 'en', // Default value
      });
      
      // Update local state - Convex will automatically sync
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  // Helper function to convert Convex user to app User type
  const convertConvexUserToUser = (convexUser: any): User => {
    return {
      id: convexUser._id,
      email: convexUser.email,
      phone: convexUser.phone,
      name: convexUser.name,
      role: convexUser.role,
      digiPin: convexUser.digiPin,
      familyMembers: [], // Will be loaded separately
      profileImage: convexUser.profileImage,
    };
  };

  return {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };
}