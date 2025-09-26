// Hazard management functions for Convex

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all hazards
export const getHazards = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("hazards")
      .order("desc")
      .collect();
  },
});

// Get hazards by status
export const getHazardsByStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("ml-verified"),
      v.literal("human-verified"),
      v.literal("assigned"),
      v.literal("in-progress"),
      v.literal("resolved"),
      v.literal("rejected")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("hazards")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();
  },
});

// Get hazards near a location
export const getNearbyHazards = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radius: v.optional(v.number()), // in kilometers, default 5
  },
  handler: async (ctx, args) => {
    const radius = args.radius || 5;
    const hazards = await ctx.db
      .query("hazards")
      .collect();

    // Simple distance calculation (for more precision, use proper geo libraries)
    return hazards.filter(hazard => {
      const distance = calculateDistance(
        args.latitude, args.longitude,
        hazard.location.latitude, hazard.location.longitude
      );
      return distance <= radius;
    });
  },
});

// Get hazard by ID
export const getHazardById = query({
  args: { hazardId: v.id("hazards") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.hazardId);
  },
});

// Create a new hazard report
export const createHazard = mutation({
  args: {
    reporterId: v.id("users"),
    title: v.string(),
    description: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    address: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const reporter = await ctx.db.get(args.reporterId);
    if (!reporter) {
      throw new Error("Reporter not found");
    }

    const hazardId = await ctx.db.insert("hazards", {
      reporterId: args.reporterId,
      title: args.title,
      description: args.description,
      location: {
        latitude: args.latitude,
        longitude: args.longitude,
        address: args.address,
      },
      photos: args.photos || [],
      status: "pending",
      priority: "medium",
      timestamp: Date.now(),
    });

    return hazardId;
  },
});

// Update hazard status
export const updateHazardStatus = mutation({
  args: {
    hazardId: v.id("hazards"),
    status: v.union(
      v.literal("pending"),
      v.literal("ml-verified"),
      v.literal("human-verified"),
      v.literal("assigned"),
      v.literal("in-progress"),
      v.literal("resolved"),
      v.literal("rejected")
    ),
    verifierId: v.optional(v.id("users")),
    resolutionNotes: v.optional(v.string()),
    resolutionPhotos: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const hazard = await ctx.db.get(args.hazardId);
    if (!hazard) {
      throw new Error("Hazard not found");
    }

    const updates: any = {
      status: args.status,
    };

    // If human verifying, add verifier
    if (args.status === "human-verified" && args.verifierId) {
      updates.verifiedBy = args.verifierId;
    }

    // If resolving, add resolution data
    if (args.status === "resolved") {
      updates.resolvedTimestamp = Date.now();
      if (args.resolutionNotes) {
        updates.resolutionNotes = args.resolutionNotes;
      }
      if (args.resolutionPhotos) {
        updates.resolutionPhotos = args.resolutionPhotos;
      }
    }

    await ctx.db.patch(args.hazardId, updates);
    return { success: true };
  },
});

// Assign hazard to a rescuer
export const assignHazard = mutation({
  args: {
    hazardId: v.id("hazards"),
    rescuerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const hazard = await ctx.db.get(args.hazardId);
    if (!hazard) {
      throw new Error("Hazard not found");
    }

    const rescuer = await ctx.db.get(args.rescuerId);
    if (!rescuer || rescuer.role !== "rescuer") {
      throw new Error("Invalid rescuer");
    }

    await ctx.db.patch(args.hazardId, {
      assignedRescuerId: args.rescuerId,
      status: "assigned",
    });

    return { success: true };
  },
});

// Update hazard priority (typically by AI system)
export const updateHazardPriority = mutation({
  args: {
    hazardId: v.id("hazards"),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    mlVerificationScore: v.optional(v.number()),
    mlClassification: v.optional(v.string()),
    mlAnalysis: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      priority: args.priority,
    };

    if (args.mlVerificationScore !== undefined) {
      updates.mlVerificationScore = args.mlVerificationScore;
    }
    if (args.mlClassification) {
      updates.mlClassification = args.mlClassification;
    }
    if (args.mlAnalysis) {
      updates.mlAnalysis = args.mlAnalysis;
    }

    await ctx.db.patch(args.hazardId, updates);
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