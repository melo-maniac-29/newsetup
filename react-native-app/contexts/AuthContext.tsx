import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { User, FamilyMember } from '@/types/user';
import type { Id } from '@/convex/_generated/dataModel';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, name: string, phone?: string, role?: 'civilian' | 'rescuer') => Promise<any>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const contextId = useState(() => Math.random().toString(36).substr(2, 9))[0];
  const [user, setUser] = useState<User | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Convex mutations and queries
  const createOrLoginUser = useMutation(api.users.createOrLoginUser);
  const updateUserMutation = useMutation(api.users.updateUser);
  const getUserByEmail = useQuery(api.users.getUserByEmail, 
    currentUserEmail && !isLoggingOut ? { email: currentUserEmail } : 'skip'
  );

  useEffect(() => {
    // Only load stored email on initial app start
    if (isLoggingOut) {
      console.log(`[AuthContext-${contextId}] Skipping stored email load - logout in progress`);
      return;
    }
    
    const loadStoredEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        if (storedEmail && !isLoggingOut) {
          console.log(`[AuthContext-${contextId}] Found stored email:`, storedEmail);
          setCurrentUserEmail(storedEmail);
        } else {
          console.log(`[AuthContext-${contextId}] No stored email found`);
        }
      } catch (error) {
        console.error(`[AuthContext-${contextId}] Error loading stored email:`, error);
      }
      if (!isLoggingOut) {
        setLoading(false);
      }
    };
    
    loadStoredEmail();
  }, []);

  // Sync with Convex when getUserByEmail updates
  useEffect(() => {
    if (isLoggingOut) return;
    
    if (getUserByEmail && currentUserEmail) {
      console.log(`[AuthContext-${contextId}] Syncing user from Convex query`);
      const convexUser = convertConvexUserToUser(getUserByEmail);
      setUser(convexUser);
    }
  }, [getUserByEmail, currentUserEmail, isLoggingOut]);

  useEffect(() => {
    console.log(`[AuthContext-${contextId}] User state changed:`, user ? `${user.name} (${user.email})` : 'null');
    console.log(`[AuthContext-${contextId}] Current user email:`, currentUserEmail);
  }, [user, currentUserEmail, contextId]);

  const login = async (email: string, name: string, phone?: string, role: 'civilian' | 'rescuer' = 'civilian') => {
    try {
      setLoading(true);
      console.log(`[AuthContext-${contextId}] Starting login process for:`, email);
      
      const result = await createOrLoginUser({
        email,
        name,
        phone,
        role,
      });
      
      console.log(`[AuthContext-${contextId}] Convex result:`, result);
      
      if (!result || !result.userId) {
        throw new Error('Invalid response from Convex');
      }
      
      // Store email persistently
      await AsyncStorage.setItem('userEmail', email);
      console.log(`[AuthContext-${contextId}] Stored email in AsyncStorage`);
      
      setCurrentUserEmail(email);
      console.log(`[AuthContext-${contextId}] Login process complete`);
      return { userId: result.userId, email, name, role };
    } catch (error) {
      console.error(`[AuthContext-${contextId}] Login error:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log(`[AuthContext-${contextId}] Starting logout process...`);
    setIsLoggingOut(true);
    
    try {
      // Clear state immediately
      setUser(null);
      setCurrentUserEmail(null);
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('userEmail');
      console.log(`[AuthContext-${contextId}] Removed userEmail from AsyncStorage`);
      
      console.log(`[AuthContext-${contextId}] Logout complete - should redirect to login now`);
      
    } catch (error) {
      console.error(`[AuthContext-${contextId}] Error during logout:`, error);
    } finally {
      setTimeout(() => {
        setIsLoggingOut(false);
        setLoading(false);
        console.log(`[AuthContext-${contextId}] Logout process finished`);
      }, 1000);
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      if (!user) throw new Error('No user to update');
      
      await updateUserMutation({
        userId: user.id as Id<"users">,
        name: updatedUser.name,
        phone: updatedUser.phone,
      });
      
      setUser(updatedUser);
    } catch (error) {
      console.error(`[AuthContext-${contextId}] Error updating user:`, error);
      throw error;
    }
  };

  const convertConvexUserToUser = (convexUser: any): User => {
    return {
      id: convexUser._id,
      email: convexUser.email,
      phone: convexUser.phone,
      name: convexUser.name,
      role: convexUser.role,
      digiPin: convexUser.digiPin,
      familyMembers: [],
      profileImage: convexUser.profileImage,
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}