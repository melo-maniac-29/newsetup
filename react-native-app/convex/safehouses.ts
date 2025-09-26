// Safe house management functions for Convex

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// DigiPIN Algorithm for safe house location
const DIGIPIN_GRID = [
  ['F', 'C', '9', '8'],
  ['J', '3', '2', '7'],
  ['K', '4', '5', '6'],
  ['L', 'M', 'P', 'T']
] as const;

const BOUNDS = {
  minLat: 2.5,
  maxLat: 38.5,
  minLon: 63.5,
  maxLon: 99.5
} as const;

function generateLocationDigiPin(lat: number, lon: number): string {
  if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat || lon < BOUNDS.minLon || lon > BOUNDS.maxLon) {
    throw new Error('Location outside Indian boundaries');
  }
  
  let minLat = BOUNDS.minLat;
  let maxLat = BOUNDS.maxLat;
  let minLon = BOUNDS.minLon;
  let maxLon = BOUNDS.maxLon;
  
  let digiPin = "";
  
  for (let level = 1; level <= 10; level++) {
    const latDiv = (maxLat - minLat) / 4.0;
    const lonDiv = (maxLon - minLon) / 4.0;
    
    let row = 3 - Math.floor((lat - minLat) / latDiv);
    let col = Math.floor((lon - minLon) / lonDiv);
    
    row = Math.max(0, Math.min(row, 3));
    col = Math.max(0, Math.min(col, 3));
    
    digiPin += DIGIPIN_GRID[row][col];
    
    if (level === 3 || level === 6) {
      digiPin += '-';
    }
    
    const oldMinLat = minLat;
    const oldMinLon = minLon;

    maxLat = oldMinLat + latDiv * (4 - row);
    minLat = oldMinLat + latDiv * (3 - row);
    
    minLon = oldMinLon + lonDiv * col;
    maxLon = minLon + lonDiv;
  }

  return digiPin;
}

// Get all active safe houses
export const getSafeHouses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("safeHouses")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Get safe houses near a location
export const getNearbyRescue = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radius: v.optional(v.number()), // in kilometers, default 10
  },
  handler: async (ctx, args) => {
    const radius = args.radius || 10;
    const safeHouses = await ctx.db
      .query("safeHouses")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Simple distance calculation (for more precision, use proper geo libraries)
    return safeHouses.filter(house => {
      const distance = calculateDistance(
        args.latitude, args.longitude,
        house.location.latitude, house.location.longitude
      );
      return distance <= radius;
    });
  },
});

// Get safe house by ID
export const getSafeHouseById = query({
  args: { safeHouseId: v.id("safeHouses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.safeHouseId);
  },
});

// Create a new safe house (rescuer/admin function)
export const createSafeHouse = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    capacity: v.number(),
    facilities: v.array(v.string()),
    managerId: v.id("users"),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify user is a rescuer or admin
    const manager = await ctx.db.get(args.managerId);
    if (!manager || (manager.role !== 'rescuer' && manager.role !== 'admin')) {
      throw new Error("Only rescuers and admins can create safe houses");
    }

    // Generate DigiPIN for the safe house location
    let locationDigiPin: string;
    try {
      locationDigiPin = generateLocationDigiPin(args.latitude, args.longitude);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Cannot create safe house: ${errorMessage}`);
    }
    
    // Generate QR code for check-in with location DigiPIN
    const qrCodeData = JSON.stringify({
      type: 'safehouse_checkin',
      id: `safehouse-${Date.now()}`,
      digiPin: locationDigiPin,
      latitude: args.latitude,
      longitude: args.longitude,
      timestamp: Date.now()
    });
    
    const safeHouseId = await ctx.db.insert("safeHouses", {
      name: args.name,
      address: args.address,
      location: {
        latitude: args.latitude,
        longitude: args.longitude,
      },
      locationDigiPin, // Store the location-based DigiPIN
      capacity: args.capacity,
      currentOccupancy: 0,
      facilities: args.facilities,
      managerId: args.managerId,
      qrCodeData,
      isActive: true,
      familyClusters: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { 
      safeHouseId, 
      locationDigiPin,
      message: "Safe house created successfully" 
    };
  },
});

// Update safe house occupancy
export const updateOccupancy = mutation({
  args: {
    safeHouseId: v.id("safeHouses"),
    occupancyChange: v.number(), // positive for check-in, negative for check-out
  },
  handler: async (ctx, args) => {
    const safeHouse = await ctx.db.get(args.safeHouseId);
    if (!safeHouse) {
      throw new Error("Safe house not found");
    }

    const newOccupancy = Math.max(0, safeHouse.currentOccupancy + args.occupancyChange);
    
    await ctx.db.patch(args.safeHouseId, {
      currentOccupancy: newOccupancy,
      updatedAt: Date.now(),
    });

    return newOccupancy;
  },
});

// Check in a user to a safe house
export const checkInUser = mutation({
  args: {
    userId: v.id("users"),
    userName: v.string(), // Add user name for better tracking
    safeHouseId: v.id("safeHouses"),
    scannedBy: v.id("users"), // Rescuer who scanned the QR
  },
  handler: async (ctx, args) => {
    const safeHouse = await ctx.db.get(args.safeHouseId);
    if (!safeHouse) {
      throw new Error("Safe house not found");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify the provided name matches the user record
    if (user.name !== args.userName) {
      throw new Error("User name mismatch - invalid QR code");
    }

    // Check if user is already checked in to this safe house
    const existingCheckIn = await ctx.db
      .query("safeHouseCheckins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("safeHouseId"), args.safeHouseId))
      .filter((q) => q.eq(q.field("checkOutTime"), undefined))
      .first();

    if (existingCheckIn) {
      throw new Error(`${user.name} is already checked into this safe house`);
    }

    if (safeHouse.currentOccupancy >= safeHouse.capacity) {
      throw new Error("Safe house is at capacity");
    }

    // Create check-in record with user name for easy reference
    await ctx.db.insert("safeHouseCheckins", {
      userId: args.userId,
      safeHouseId: args.safeHouseId,
      checkInTime: Date.now(),
      scannedBy: args.scannedBy,
      verificationMethod: "qr",
    });

    // Update safe house occupancy
    await ctx.db.patch(args.safeHouseId, {
      currentOccupancy: safeHouse.currentOccupancy + 1,
      updatedAt: Date.now(),
    });

    // Update user record with current safe house
    await ctx.db.patch(args.userId, {
      currentSafeHouseId: args.safeHouseId,
      checkInTime: Date.now(),
      updatedAt: Date.now(),
    });

    // Update family members about this user's safe house status
    await ctx.db
      .query("familyMembers")
      .withIndex("by_family_member", (q) => q.eq("familyMemberId", args.userId))
      .collect()
      .then(relationships => {
        relationships.forEach(rel => {
          ctx.db.patch(rel._id, {
            isAtSafeHouse: true,
            safeHouseId: args.safeHouseId,
          });
        });
      });

    return { 
      success: true, 
      message: `${args.userName} successfully checked into ${safeHouse.name}`,
      userName: args.userName,
      userDigiPin: user.digiPin 
    };
  },
});

// Check out a user from a safe house
export const checkOutUser = mutation({
  args: {
    userId: v.id("users"),
    safeHouseId: v.id("safeHouses"),
  },
  handler: async (ctx, args) => {
    const safeHouse = await ctx.db.get(args.safeHouseId);
    if (!safeHouse) {
      throw new Error("Safe house not found");
    }

    // Find active check-in record
    const checkIn = await ctx.db
      .query("safeHouseCheckins")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("safeHouseId"), args.safeHouseId))
      .filter((q) => q.eq(q.field("checkOutTime"), undefined))
      .first();

    if (!checkIn) {
      throw new Error("User is not checked into this safe house");
    }

    // Update check-in record with check-out time
    await ctx.db.patch(checkIn._id, {
      checkOutTime: Date.now(),
    });

    // Update safe house occupancy
    await ctx.db.patch(args.safeHouseId, {
      currentOccupancy: Math.max(0, safeHouse.currentOccupancy - 1),
      updatedAt: Date.now(),
    });

    // Update user record to clear current safe house
    await ctx.db.patch(args.userId, {
      currentSafeHouseId: undefined,
      checkInTime: undefined,
      updatedAt: Date.now(),
    });

    // Update family members
    await ctx.db
      .query("familyMembers")
      .withIndex("by_family_member", (q) => q.eq("familyMemberId", args.userId))
      .collect()
      .then(relationships => {
        relationships.forEach(rel => {
          ctx.db.patch(rel._id, {
            isAtSafeHouse: false,
            safeHouseId: undefined,
          });
        });
      });

    return { success: true, message: "Successfully checked out from safe house" };
  },
});

// Get real occupants of a safe house
export const getSafeHouseOccupants = query({
  args: { safeHouseId: v.id("safeHouses") },
  handler: async (ctx, args) => {
    // Use the new approach - find users with currentSafeHouseId
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("currentSafeHouseId"), args.safeHouseId))
      .collect()
      .then(users => 
        users.map(user => ({
          id: user._id,
          name: user.name,
          digiPin: user.digiPin,
          checkInTime: user.checkInTime || Date.now(),
          checkInTimeFormatted: new Date(user.checkInTime || Date.now()).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
        }))
      );
  },
});

// Check if a user is currently checked into a safe house
export const getUserCheckInStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.currentSafeHouseId) {
      return { isCheckedIn: false };
    }

    const safeHouse = await ctx.db.get(user.currentSafeHouseId);
    return {
      isCheckedIn: true,
      safeHouse: safeHouse,
      checkInTime: user.checkInTime || Date.now(),
    };
  },
});

// Get users currently checked into a specific safe house
export const getUsersInSafeHouse = query({
  args: { safeHouseId: v.id("safeHouses") },
  handler: async (ctx, args) => {
    // Find all users who have this safe house as their current location
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("currentSafeHouseId"), args.safeHouseId))
      .collect();

    return users.map(user => ({
      id: user._id,
      name: user.name,
      digiPin: user.digiPin,
      checkInTime: user.checkInTime || Date.now(),
      checkInTimeFormatted: new Date(user.checkInTime || Date.now()).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
    }));
  },
});

// Update safe house status
export const updateSafeHouseStatus = mutation({
  args: {
    safeHouseId: v.id("safeHouses"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.safeHouseId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete safe house (rescuer/admin function)
export const deleteSafeHouse = mutation({
  args: {
    safeHouseId: v.id("safeHouses"),
    managerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const safeHouse = await ctx.db.get(args.safeHouseId);
    if (!safeHouse) {
      throw new Error("Safe house not found");
    }

    // Verify user is the manager or admin
    const manager = await ctx.db.get(args.managerId);
    if (!manager || (safeHouse.managerId !== args.managerId && manager.role !== 'admin')) {
      throw new Error("Only the manager or admin can delete this safe house");
    }

    // Check if safe house has current occupants
    if (safeHouse.currentOccupancy > 0) {
      throw new Error("Cannot delete safe house with current occupants");
    }

    // Delete the safe house
    await ctx.db.delete(args.safeHouseId);

    return { success: true, message: "Safe house deleted successfully" };
  },
});

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}