// User management functions for Convex

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * DigiPin Algorithm - Direct TypeScript conversion from Python
 * Embedded in Convex backend, never exposed to frontend
 */

// DIGIPIN 4x4 grid definition
const DIGIPIN_GRID = [
  ['F', 'C', '9', '8'],
  ['J', '3', '2', '7'],
  ['K', '4', '5', '6'],
  ['L', 'M', 'P', 'T']
] as const;

// Geographic bounds (latitude and longitude limits)
const BOUNDS = {
  minLat: 2.5,
  maxLat: 38.5,
  minLon: 63.5,
  maxLon: 99.5
} as const;

/**
 * Encodes latitude and longitude into a 10-digit alphanumeric DIGIPIN
 */
function getDigiPin(lat: number, lon: number): string {
  // Validate input
  if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat) {
    throw new Error('Latitude out of range');
  }
  if (lon < BOUNDS.minLon || lon > BOUNDS.maxLon) {
    throw new Error('Longitude out of range');
  }
  
  let minLat = BOUNDS.minLat;
  let maxLat = BOUNDS.maxLat;
  let minLon = BOUNDS.minLon;
  let maxLon = BOUNDS.maxLon;
  
  let digiPin = "";
  
  // Iterate for 10 levels of refinement
  for (let level = 1; level <= 10; level++) {
    const latDiv = (maxLat - minLat) / 4.0;
    const lonDiv = (maxLon - minLon) / 4.0;

    // Compute grid row and column.
    // Row calculation uses reversed logic to map the latitude correctly.
    let row = 3 - Math.floor((lat - minLat) / latDiv);
    let col = Math.floor((lon - minLon) / lonDiv);
    
    // Clamp row and col between 0 and 3
    row = Math.max(0, Math.min(row, 3));
    col = Math.max(0, Math.min(col, 3));
    
    digiPin += DIGIPIN_GRID[row][col];
    
    // Insert hyphens after the 3rd and 6th characters
    if (level === 3 || level === 6) {
      digiPin += '-';
    }
    
    // Update the bounds for the next level.
    const oldMinLat = minLat;
    const oldMinLon = minLon;

    maxLat = oldMinLat + latDiv * (4 - row);
    minLat = oldMinLat + latDiv * (3 - row);
    
    minLon = oldMinLon + lonDiv * col;
    maxLon = minLon + lonDiv;
  }

  return digiPin;
}

/**
 * Decodes a DIGIPIN back into its central latitude and longitude
 */
function getLatLngFromDigiPin(digiPin: string): { latitude: string; longitude: string } {
  // Remove hyphens
  const pin = digiPin.replace(/-/g, "");
  if (pin.length !== 10) {
    throw new Error('Invalid DIGIPIN');
  }
  
  let minLat: number = BOUNDS.minLat;
  let maxLat: number = BOUNDS.maxLat;
  let minLon: number = BOUNDS.minLon;
  let maxLon: number = BOUNDS.maxLon;
  
  // Process each of the 10 characters to narrow the bounding box
  for (let i = 0; i < 10; i++) {
    const char = pin[i];
    let found = false;
    let ri = -1, ci = -1;

    // Locate the character in the DIGIPIN_GRID
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (DIGIPIN_GRID[r][c] === char) {
          ri = r;
          ci = c;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      throw new Error('Invalid character in DIGIPIN');
    }
    
    const latDiv = (maxLat - minLat) / 4.0;
    const lonDiv = (maxLon - minLon) / 4.0;
    
    const lat1 = maxLat - latDiv * (ri + 1);
    const lat2 = maxLat - latDiv * ri;
    const lon1 = minLon + lonDiv * ci;
    const lon2 = minLon + lonDiv * (ci + 1);
    
    // Update the bounding box bounds
    minLat = lat1;
    maxLat = lat2;
    minLon = lon1;
    maxLon = lon2;
  }
      
  const centerLat = (minLat + maxLat) / 2.0;
  const centerLon = (minLon + maxLon) / 2.0;

  return {
    latitude: centerLat.toFixed(6),
    longitude: centerLon.toFixed(6)
  };
}

// Generate a DIGIPIN based on user location
// Throws error if coordinates are outside Indian boundaries
function generateDigiPin(latitude?: number, longitude?: number): string {
  // Require valid coordinates - no defaults
  if (!latitude || !longitude) {
    throw new Error('Latitude and longitude are required for DIGIPIN generation');
  }
  
  // Generate DIGIPIN using real coordinates
  return getDigiPin(latitude, longitude);
}

// Create a new user or login existing user
export const createOrLoginUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("civilian"), v.literal("rescuer"), v.literal("admin")),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      // Update last seen for existing user
      await ctx.db.patch(existingUser._id, {
        lastSeen: Date.now(),
      });
      
      return {
        userId: existingUser._id,
        digiPin: existingUser.digiPin,
        isNewUser: false,
      };
    }

    // Generate DIGIPIN based on provided location
    let digiPin: string;
    try {
      if (args.latitude && args.longitude) {
        digiPin = generateDigiPin(args.latitude, args.longitude);
      } else {
        // Create user without DIGIPIN initially - will be set when location is provided
        digiPin = "PENDING-LOCATION";
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Cannot create DIGIPIN: ${errorMessage}`);
    }

    const now = Date.now();

    // Create new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      phone: args.phone,
      role: args.role,
      digiPin,
      isActive: true,
      lastSeen: now,
      voiceEnabled: true,
      language: "en",
      createdAt: now,
      updatedAt: now,
    });

    return {
      userId,
      digiPin,
      isNewUser: true,
    };
  },
});

// Create a new user (original function for other uses)
export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("civilian"), v.literal("rescuer"), v.literal("admin")),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Generate DIGIPIN based on provided location
    let digiPin: string;
    try {
      if (args.latitude && args.longitude) {
        digiPin = generateDigiPin(args.latitude, args.longitude);
      } else {
        digiPin = "PENDING-LOCATION";
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Cannot create DIGIPIN: ${errorMessage}`);
    }

    const now = Date.now();

    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      phone: args.phone,
      role: args.role,
      digiPin,
      isActive: true,
      lastSeen: now,
      voiceEnabled: true,
      language: "en",
      createdAt: now,
      updatedAt: now,
    });

    return { userId, digiPin };
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

// Get user by DigiPIN
export const getUserByDigiPin = query({
  args: { digiPin: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_digiPin", (q) => q.eq("digiPin", args.digiPin))
      .unique();
  },
});

// Update user profile
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    voiceEnabled: v.optional(v.boolean()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updateData } = args;
    
    await ctx.db.patch(userId, {
      ...updateData,
      updatedAt: Date.now(),
    });
    
    return await ctx.db.get(userId);
  },
});

// Update user location and regenerate DIGIPIN based on new location
export const updateUserLocation = mutation({
  args: {
    userId: v.id("users"),
    latitude: v.number(),
    longitude: v.number(),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, latitude, longitude, address } = args;
    
    // Generate new DIGIPIN based on actual location
    const newDigiPin = generateDigiPin(latitude, longitude);
    
    await ctx.db.patch(userId, {
      digiPin: newDigiPin,
      currentLocation: {
        latitude,
        longitude,
        address,
        timestamp: Date.now(),
      },
      lastSeen: Date.now(),
    });
    
    return { newDigiPin };
  },
});

// Decode DIGIPIN to coordinates (utility function for frontend)
export const decodeDigiPin = query({
  args: { digiPin: v.string() },
  handler: async (ctx, args) => {
    try {
      return getLatLngFromDigiPin(args.digiPin);
    } catch (error) {
      throw new Error('Invalid DIGIPIN format');
    }
  },
});

// Get all rescuers
export const getRescuers = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "rescuer"))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});