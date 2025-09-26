// SOS request management functions for Convex

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create SOS request
export const createSOSRequest = mutation({
  args: {
    userId: v.id("users"),
    latitude: v.number(),
    longitude: v.number(),
    address: v.optional(v.string()),
    currentDigiPin: v.optional(v.string()), // Current location DigiPIN
    notes: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Use provided current DigiPIN or fall back to user's stored DigiPIN
    const digiPinToUse = args.currentDigiPin || user.digiPin;

    // Get family members for clustering
    const familyRelationships = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const familyCluster = familyRelationships.map(rel => rel.familyMemberId);

    const sosId = await ctx.db.insert("sosRequests", {
      userId: args.userId,
      digiPin: digiPinToUse, // Use the current location DigiPIN
      location: {
        latitude: args.latitude,
        longitude: args.longitude,
        address: args.address,
      },
      status: "sent",
      priority: 50, // Will be calculated by ML service
      meshHops: [],
      familyCluster,
      timestamp: Date.now(),
      updatedAt: Date.now(),
      notes: args.notes,
      photos: args.photos,
    });

    // TODO: Send to ML service for priority calculation
    // TODO: Propagate through mesh network

    return sosId;
  },
});

// Get SOS requests for a user
export const getUserSOSRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sosRequests")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get active SOS requests for rescuers
export const getActiveSOSRequests = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("sosRequests")
      .withIndex("by_status", (q) => q.eq("status", "sent"))
      .order("desc")
      .collect();
  },
});

// Update SOS status
export const updateSOSStatus = mutation({
  args: {
    sosId: v.id("sosRequests"),
    status: v.union(
      v.literal("sent"),
      v.literal("in-progress"),
      v.literal("rescued"),
      v.literal("cancelled")
    ),
    rescuerId: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sosId, status, rescuerId, notes } = args;
    
    await ctx.db.patch(sosId, {
      status,
      rescuerId,
      notes,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(sosId);
  },
});

// Accept SOS request (for rescuers)
export const acceptSOSRequest = mutation({
  args: {
    sosId: v.id("sosRequests"),
    rescuerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sos = await ctx.db.get(args.sosId);
    if (!sos) {
      throw new Error("SOS request not found");
    }

    if (sos.status !== "sent") {
      throw new Error("SOS request is no longer available");
    }

    await ctx.db.patch(args.sosId, {
      status: "in-progress",
      rescuerId: args.rescuerId,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.sosId);
  },
});