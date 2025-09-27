// Crowdfunding management functions for Convex

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all crowdfunding campaigns
export const getCampaigns = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("crowdfundingCampaigns")
      .order("desc")
      .collect();
  },
});

// Get active campaigns only
export const getActiveCampaigns = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("crowdfundingCampaigns")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();
  },
});

// Get campaign by ID
export const getCampaignById = query({
  args: { campaignId: v.id("crowdfundingCampaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.campaignId);
  },
});

// Create a new crowdfunding campaign
export const createCampaign = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    target: v.number(),
    createdBy: v.id("users"),
    targetLocation: v.optional(v.object({
      state: v.string(),
      district: v.optional(v.string()),
      address: v.optional(v.string())
    })),
    relatedSOSIds: v.optional(v.array(v.id("sosRequests"))),
    relatedHazardIds: v.optional(v.array(v.id("hazards"))),
  },
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.createdBy);
    if (!creator || (creator.role !== 'admin' && creator.role !== 'rescuer')) {
      throw new Error("Only admins and rescuers can create campaigns");
    }

    const campaignId = await ctx.db.insert("crowdfundingCampaigns", {
      title: args.title,
      description: args.description,
      target: args.target,
      raised: 0,
      donors: 0,
      status: "active",
      createdBy: args.createdBy,
      relatedSOSIds: args.relatedSOSIds,
      relatedHazardIds: args.relatedHazardIds,
      targetLocation: args.targetLocation,
      allocations: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return campaignId;
  },
});

// Add donation to campaign
export const addDonation = mutation({
  args: {
    campaignId: v.id("crowdfundingCampaigns"),
    amount: v.number(),
    donorId: v.optional(v.id("users")),
    donorName: v.optional(v.string()),
    donorEmail: v.optional(v.string()),
    message: v.optional(v.string()),
    paymentId: v.string(),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.status !== "active") {
      throw new Error("Campaign is not active");
    }

    // Create donation record
    const donationId = await ctx.db.insert("donations", {
      campaignId: args.campaignId,
      donorId: args.donorId,
      amount: args.amount,
      donorName: args.donorName,
      donorEmail: args.donorEmail,
      message: args.message,
      paymentId: args.paymentId,
      paymentStatus: "completed",
      timestamp: Date.now(),
    });

    // Update campaign totals
    await ctx.db.patch(args.campaignId, {
      raised: campaign.raised + args.amount,
      donors: campaign.donors + 1,
      updatedAt: Date.now(),
    });

    // Check if campaign target is reached
    const newRaised = campaign.raised + args.amount;
    if (newRaised >= campaign.target) {
      await ctx.db.patch(args.campaignId, {
        status: "completed",
        completedAt: Date.now(),
      });
    }

    return donationId;
  },
});

// Allocate funds to safe houses
export const allocateFunds = mutation({
  args: {
    campaignId: v.id("crowdfundingCampaigns"),
    allocations: v.array(v.object({
      safeHouseId: v.optional(v.id("safeHouses")),
      location: v.string(),
      amount: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const totalAllocation = args.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    if (totalAllocation > campaign.raised) {
      throw new Error("Cannot allocate more than raised amount");
    }

    const allocationsWithStatus = args.allocations.map(alloc => ({
      ...alloc,
      status: "allocated" as const
    }));

    await ctx.db.patch(args.campaignId, {
      allocations: [...campaign.allocations, ...allocationsWithStatus],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get donations for a campaign
export const getCampaignDonations = query({
  args: { campaignId: v.id("crowdfundingCampaigns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("donations")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .order("desc")
      .collect();
  },
});

// Get campaign statistics
export const getCampaignStats = query({
  handler: async (ctx) => {
    const campaigns = await ctx.db.query("crowdfundingCampaigns").collect();
    
    const totalRaised = campaigns.reduce((sum, campaign) => sum + campaign.raised, 0);
    const totalTarget = campaigns.reduce((sum, campaign) => sum + campaign.target, 0);
    const totalDonors = campaigns.reduce((sum, campaign) => sum + campaign.donors, 0);
    const activeCampaigns = campaigns.filter(c => c.status === "active").length;
    const completedCampaigns = campaigns.filter(c => c.status === "completed").length;

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns,
      completedCampaigns,
      totalRaised,
      totalTarget,
      totalDonors,
      averageDonation: totalDonors > 0 ? Math.round(totalRaised / totalDonors) : 0,
      completionRate: campaigns.length > 0 ? ((completedCampaigns / campaigns.length) * 100).toFixed(1) : "0",
    };
  },
});

// Update campaign status
export const updateCampaignStatus = mutation({
  args: {
    campaignId: v.id("crowdfundingCampaigns"),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "completed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.campaignId, updates);
    return { success: true };
  },
});