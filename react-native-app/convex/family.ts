// Family management functions for Convex

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add family member relationship (bidirectional)
export const addFamilyMember = mutation({
  args: {
    userId: v.id("users"),
    familyMemberId: v.id("users"),
    relationship: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if relationship already exists (either direction)
    const existingForward = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("familyMemberId"), args.familyMemberId))
      .unique();

    const existingReverse = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.familyMemberId))
      .filter((q) => q.eq(q.field("familyMemberId"), args.userId))
      .unique();

    if (existingForward || existingReverse) {
      throw new Error("Family member relationship already exists");
    }

    // Create bidirectional relationship
    const relationshipId1 = await ctx.db.insert("familyMembers", {
      userId: args.userId,
      familyMemberId: args.familyMemberId,
      relationship: args.relationship,
      isAtSafeHouse: false,
      addedAt: Date.now(),
    });

    // Create reverse relationship (both see each other as "Family" by default)
    const relationshipId2 = await ctx.db.insert("familyMembers", {
      userId: args.familyMemberId,
      familyMemberId: args.userId,
      relationship: "Family", // Default relationship type
      isAtSafeHouse: false,
      addedAt: Date.now(),
    });

    return { relationshipId1, relationshipId2 };
  },
});

// Get family members for a user with real-time safe house status
export const getFamilyMembers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const relationships = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get full user details for each family member with real-time safe house status
    const familyMembers = await Promise.all(
      relationships.map(async (rel) => {
        const member = await ctx.db.get(rel.familyMemberId);
        let safeHouseDetails = null;
        
        // Get real-time safe house info from user's currentSafeHouseId
        if (member?.currentSafeHouseId) {
          safeHouseDetails = await ctx.db.get(member.currentSafeHouseId);
        }
        
        return {
          ...rel,
          memberDetails: member,
          // Override with real-time status from user record
          isAtSafeHouse: !!member?.currentSafeHouseId,
          safeHouseId: member?.currentSafeHouseId,
          safeHouseName: safeHouseDetails?.name,
          checkInTime: member?.checkInTime,
        };
      })
    );

    return familyMembers;
  },
});

// Update family member safe house status
export const updateFamilyMemberSafeHouse = mutation({
  args: {
    userId: v.id("users"),
    familyMemberId: v.id("users"),
    isAtSafeHouse: v.boolean(),
    safeHouseId: v.optional(v.id("safeHouses")),
  },
  handler: async (ctx, args) => {
    const relationship = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("familyMemberId"), args.familyMemberId))
      .unique();

    if (!relationship) {
      throw new Error("Family member not found");
    }

    await ctx.db.patch(relationship._id, {
      isAtSafeHouse: args.isAtSafeHouse,
      safeHouseId: args.safeHouseId,
    });
  },
});

// Remove family member (bidirectional)
export const removeFamilyMember = mutation({
  args: {
    userId: v.id("users"),
    familyMemberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find both directions of the relationship
    const relationshipForward = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("familyMemberId"), args.familyMemberId))
      .unique();

    const relationshipReverse = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.familyMemberId))
      .filter((q) => q.eq(q.field("familyMemberId"), args.userId))
      .unique();

    // Delete both relationships if they exist
    if (relationshipForward) {
      await ctx.db.delete(relationshipForward._id);
    }
    
    if (relationshipReverse) {
      await ctx.db.delete(relationshipReverse._id);
    }

    if (!relationshipForward && !relationshipReverse) {
      throw new Error("Family member relationship not found");
    }
  },
});