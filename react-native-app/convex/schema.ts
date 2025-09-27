// Convex database schema for disaster management platform

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - civilians, rescuers, admins
  users: defineTable({
    email: v.string(),
    phone: v.optional(v.string()),
    name: v.string(),
    role: v.union(v.literal("civilian"), v.literal("rescuer"), v.literal("admin")),
    digiPin: v.string(),
    profileImage: v.optional(v.string()),
    isActive: v.boolean(),
    lastSeen: v.number(),
    
    // Safe house tracking
    currentSafeHouseId: v.optional(v.id("safeHouses")),
    checkInTime: v.optional(v.number()),
    
    // Location for real-time tracking
    currentLocation: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.optional(v.string()),
      timestamp: v.number(),
    })),
    
    // Settings
    voiceEnabled: v.optional(v.boolean()),
    language: v.optional(v.string()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_digiPin", ["digiPin"])
    .index("by_role", ["role"]),

  // Family relationships
  familyMembers: defineTable({
    userId: v.id("users"),
    familyMemberId: v.id("users"),
    relationship: v.string(),
    isAtSafeHouse: v.boolean(),
    safeHouseId: v.optional(v.id("safeHouses")),
    addedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_family_member", ["familyMemberId"]),

  // SOS requests with mesh propagation
  sosRequests: defineTable({
    userId: v.id("users"),
    digiPin: v.string(),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.optional(v.string()),
    }),
    status: v.union(
      v.literal("sent"),
      v.literal("in-progress"), 
      v.literal("rescued"),
      v.literal("cancelled")
    ),
    priority: v.number(), // AI-computed priority score
    rescuerId: v.optional(v.id("users")),
    
    // Mesh network propagation data
    meshHops: v.array(v.object({
      nodeId: v.string(),
      timestamp: v.number(),
      batteryLevel: v.optional(v.number()),
    })),
    
    // Family cluster information
    familyCluster: v.array(v.id("users")),
    
    timestamp: v.number(),
    updatedAt: v.number(),
    notes: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_rescuer", ["rescuerId"])
    .index("by_priority", ["priority"]),

  // Safe houses with QR check-ins
  safeHouses: defineTable({
    name: v.string(),
    address: v.string(),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    locationDigiPin: v.string(), // DigiPIN based on safe house location
    capacity: v.number(),
    currentOccupancy: v.number(),
    facilities: v.array(v.string()),
    managerId: v.id("users"),
    qrCodeData: v.string(), // Signed QR data for check-ins
    isActive: v.boolean(),
    
    // Family clustering data
    familyClusters: v.array(v.object({
      familyId: v.string(),
      members: v.array(v.id("users")),
    })),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_manager", ["managerId"])
    .index("by_active", ["isActive"]),

  // Safe house check-ins via QR scanning
  safeHouseCheckins: defineTable({
    userId: v.id("users"),
    safeHouseId: v.id("safeHouses"),
    checkInTime: v.number(),
    checkOutTime: v.optional(v.number()),
    scannedBy: v.id("users"), // Rescuer/admin who scanned QR
    verificationMethod: v.union(v.literal("qr"), v.literal("manual")),
  })
    .index("by_user", ["userId"])
    .index("by_safehouse", ["safeHouseId"])
    .index("by_scanner", ["scannedBy"]),

  // Hazard reports with ML verification
  hazards: defineTable({
    reporterId: v.id("users"),
    title: v.string(),
    description: v.string(),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.optional(v.string()),
    }),
    photos: v.array(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("ml-verified"),
      v.literal("human-verified"),
      v.literal("assigned"),
      v.literal("in-progress"),
      v.literal("resolved"),
      v.literal("rejected")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    
    // ML verification data
    mlVerificationScore: v.optional(v.number()),
    mlClassification: v.optional(v.string()),
    mlAnalysis: v.optional(v.string()),
    
    assignedRescuerId: v.optional(v.id("users")),
    verifiedBy: v.optional(v.id("users")),
    
    timestamp: v.number(),
    resolvedTimestamp: v.optional(v.number()),
    resolutionPhotos: v.optional(v.array(v.string())),
    resolutionNotes: v.optional(v.string()),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_status", ["status"])
    .index("by_assigned", ["assignedRescuerId"])
    .index("by_priority", ["priority"]),

  // Mesh network nodes and communication
  meshNodes: defineTable({
    nodeId: v.string(),
    nodeType: v.union(v.literal("mobile"), v.literal("lora-gateway"), v.literal("static")),
    userId: v.optional(v.id("users")),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    batteryLevel: v.optional(v.number()),
    isOnline: v.boolean(),
    lastSeen: v.number(),
    
    // Mesh network topology
    connectedNodes: v.array(v.string()),
    signalStrength: v.optional(v.number()),
    
    createdAt: v.number(),
  })
    .index("by_nodeId", ["nodeId"])
    .index("by_user", ["userId"])
    .index("by_type", ["nodeType"])
    .index("by_online", ["isOnline"]),

  // Mesh messages for offline propagation
  meshMessages: defineTable({
    messageId: v.string(),
    messageType: v.union(v.literal("sos"), v.literal("hazard"), v.literal("status-update")),
    payload: v.string(), // JSON encoded data
    sourceNodeId: v.string(),
    targetNodeId: v.optional(v.string()), // null for broadcast
    
    // Propagation tracking
    hopCount: v.number(),
    propagationPath: v.array(v.string()),
    
    timestamp: v.number(),
    expiresAt: v.number(),
    isDelivered: v.boolean(),
  })
    .index("by_messageId", ["messageId"])
    .index("by_type", ["messageType"])
    .index("by_source", ["sourceNodeId"])
    .index("by_target", ["targetNodeId"])
    .index("by_delivered", ["isDelivered"]),

  // AI predictions and analytics
  aiPredictions: defineTable({
    predictionType: v.union(
      v.literal("flood-risk"),
      v.literal("rescue-priority"),
      v.literal("safe-zone-recommendation"),
      v.literal("bottleneck-forecast")
    ),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      radius: v.number(), // Area of effect in meters
    }),
    predictionData: v.string(), // JSON encoded prediction results
    confidence: v.number(), // 0-1 confidence score
    
    // Data sources used
    weatherData: v.optional(v.string()),
    historicalData: v.optional(v.string()),
    currentSOSData: v.optional(v.string()),
    
    validFrom: v.number(),
    validUntil: v.number(),
    createdAt: v.number(),
  })
    .index("by_type", ["predictionType"])
    .index("by_location", ["location.latitude", "location.longitude"])
    .index("by_valid", ["validFrom", "validUntil"]),

  // System logs and audit trail
  systemLogs: defineTable({
    userId: v.optional(v.id("users")),
    action: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    details: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_timestamp", ["timestamp"]),

  // Crowdfunding campaigns for disaster relief
  crowdfundingCampaigns: defineTable({
    title: v.string(),
    description: v.string(),
    target: v.number(),
    raised: v.number(),
    donors: v.number(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    createdBy: v.id("users"),
    
    // Associated disaster/location
    relatedSOSIds: v.optional(v.array(v.id("sosRequests"))),
    relatedHazardIds: v.optional(v.array(v.id("hazards"))),
    targetLocation: v.optional(v.object({
      state: v.string(),
      district: v.optional(v.string()),
      address: v.optional(v.string())
    })),
    
    // Fund allocations
    allocations: v.array(v.object({
      safeHouseId: v.optional(v.id("safeHouses")),
      location: v.string(),
      amount: v.number(),
      status: v.union(v.literal("pending"), v.literal("allocated"), v.literal("disbursed"))
    })),
    
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_creator", ["createdBy"])
    .index("by_created", ["createdAt"]),

  // Individual donations to campaigns
  donations: defineTable({
    campaignId: v.id("crowdfundingCampaigns"),
    donorId: v.optional(v.id("users")), // Optional for anonymous donations
    amount: v.number(),
    donorName: v.optional(v.string()), // For anonymous donations
    donorEmail: v.optional(v.string()),
    message: v.optional(v.string()),
    paymentId: v.string(),
    paymentStatus: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    timestamp: v.number(),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_donor", ["donorId"])
    .index("by_payment_status", ["paymentStatus"]),
});