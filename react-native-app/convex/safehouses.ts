// Safe house management functions for Convex

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

// Create a new safe house (admin only)
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
    // Generate QR code for check-in
    const qrCodeData = `safehouse-${Date.now()}-checkin`;
    
    const safeHouseId = await ctx.db.insert("safeHouses", {
      name: args.name,
      address: args.address,
      location: {
        latitude: args.latitude,
        longitude: args.longitude,
      },
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

    return safeHouseId;
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
    safeHouseId: v.id("safeHouses"),
    qrCode: v.string(),
  },
  handler: async (ctx, args) => {
    const safeHouse = await ctx.db.get(args.safeHouseId);
    if (!safeHouse) {
      throw new Error("Safe house not found");
    }

    if (safeHouse.qrCodeData !== args.qrCode) {
      throw new Error("Invalid QR code");
    }

    if (safeHouse.currentOccupancy >= safeHouse.capacity) {
      throw new Error("Safe house is at capacity");
    }

    // Update safe house occupancy
    await ctx.db.patch(args.safeHouseId, {
      currentOccupancy: safeHouse.currentOccupancy + 1,
      updatedAt: Date.now(),
    });

    // Update family members about this user's safe house
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

    return { success: true, message: "Successfully checked in to safe house" };
  },
});

// Check out a user from a safe house
export const checkOutUser = mutation({
  args: {
    userId: v.id("users"),
    safeHouseId: v.id("safeHouses"), // We need to pass this since users don't track their safe house
  },
  handler: async (ctx, args) => {
    const safeHouse = await ctx.db.get(args.safeHouseId);
    if (!safeHouse) {
      throw new Error("Safe house not found");
    }

    // Update safe house occupancy
    await ctx.db.patch(args.safeHouseId, {
      currentOccupancy: Math.max(0, safeHouse.currentOccupancy - 1),
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