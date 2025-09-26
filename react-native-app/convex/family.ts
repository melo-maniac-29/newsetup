// Family management functions for Convex

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add family member relationship
export const addFamilyMember = mutation({
  args: {
    userId: v.id("users"),
    familyMemberId: v.id("users"),
    relationship: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if relationship already exists
    const existing = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("familyMemberId"), args.familyMemberId))
      .unique();

    if (existing) {
      throw new Error("Family member already added");
    }

    const relationshipId = await ctx.db.insert("familyMembers", {
      userId: args.userId,
      familyMemberId: args.familyMemberId,
      relationship: args.relationship,
      isAtSafeHouse: false,
      addedAt: Date.now(),
    });

    return relationshipId;
  },
});

// Get family members for a user
export const getFamilyMembers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const relationships = await ctx.db
      .query("familyMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get full user details for each family member
    const familyMembers = await Promise.all(
      relationships.map(async (rel) => {
        const member = await ctx.db.get(rel.familyMemberId);
        return {
          ...rel,
          memberDetails: member,
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

// Remove family member
export const removeFamilyMember = mutation({
  args: {
    userId: v.id("users"),
    familyMemberId: v.id("users"),
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

    await ctx.db.delete(relationship._id);
  },
});