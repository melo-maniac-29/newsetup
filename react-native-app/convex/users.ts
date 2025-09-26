// User management functions for Convex

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate a unique DigiPIN
function generateDigiPin(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create a new user or login existing user
export const createOrLoginUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("civilian"), v.literal("rescuer"), v.literal("admin")),
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

    const digiPin = generateDigiPin();
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
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const digiPin = generateDigiPin();
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

// Update user location
export const updateUserLocation = mutation({
  args: {
    userId: v.id("users"),
    latitude: v.number(),
    longitude: v.number(),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, latitude, longitude, address } = args;
    
    await ctx.db.patch(userId, {
      currentLocation: {
        latitude,
        longitude,
        address,
        timestamp: Date.now(),
      },
      lastSeen: Date.now(),
    });
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