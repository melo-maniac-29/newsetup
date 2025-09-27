// Seed data script for the admin dashboard
// Run this in the Convex dashboard or create a mutation to populate initial data

import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedData = mutation({
  handler: async (ctx) => {
    // Check if data already exists
    const existingUsers = await ctx.db.query("users").first();
    if (existingUsers) {
      return { message: "Data already seeded" };
    }

    // Create admin user
    const adminId = await ctx.db.insert("users", {
      email: "admin@emergency.gov.in",
      name: "System Administrator",
      phone: "+91-9876543210",
      role: "admin",
      digiPin: "FCJ-342-MPLT",
      isActive: true,
      lastSeen: Date.now(),
      voiceEnabled: true,
      language: "en",
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
      updatedAt: Date.now(),
    });

    // Create rescuer users
    const rescuerIds = [];
    const rescuers = [
      { name: "Rajesh Kumar", email: "rajesh@rescue.gov.in", phone: "+91-9876543211", digiPin: "FCJ-987-KLMN" },
      { name: "Priya Sharma", email: "priya@rescue.gov.in", phone: "+91-9876543212", digiPin: "C93-456-PQRS" },
      { name: "Amit Singh", email: "amit@rescue.gov.in", phone: "+91-9876543213", digiPin: "J32-789-TUVW" },
    ];

    for (const rescuer of rescuers) {
      const id = await ctx.db.insert("users", {
        email: rescuer.email,
        name: rescuer.name,
        phone: rescuer.phone,
        role: "rescuer",
        digiPin: rescuer.digiPin,
        isActive: true,
        lastSeen: Date.now() - Math.floor(Math.random() * 2 * 60 * 60 * 1000), // Within 2 hours
        voiceEnabled: true,
        language: "en",
        createdAt: Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000), // Within 60 days
        updatedAt: Date.now(),
      });
      rescuerIds.push(id);
    }

    // Create civilian users
    const civilianIds = [];
    const civilians = [
      { name: "Anita Patel", email: "anita.patel@gmail.com", phone: "+91-9876543220", digiPin: "FCJ-123-ABCD", location: { lat: 19.0760, lng: 72.8777, address: "Mumbai, Maharashtra" } },
      { name: "Vikash Gupta", email: "vikash.gupta@gmail.com", phone: "+91-9876543221", digiPin: "C92-456-EFGH", location: { lat: 28.6139, lng: 77.2090, address: "Delhi, Delhi" } },
      { name: "Sunita Rao", email: "sunita.rao@gmail.com", phone: "+91-9876543222", digiPin: "J31-789-IJKL", location: { lat: 12.9716, lng: 77.5946, address: "Bangalore, Karnataka" } },
      { name: "Mohan Sharma", email: "mohan.sharma@gmail.com", phone: "+91-9876543223", digiPin: "K45-012-MNOP", location: { lat: 13.0827, lng: 80.2707, address: "Chennai, Tamil Nadu" } },
      { name: "Deepak Joshi", email: "deepak.joshi@gmail.com", phone: "+91-9876543224", digiPin: "FCJ-345-QRST", location: { lat: 22.5726, lng: 88.3639, address: "Kolkata, West Bengal" } },
      { name: "Kavita Reddy", email: "kavita.reddy@gmail.com", phone: "+91-9876543225", digiPin: "C94-678-UVWX", location: { lat: 17.3850, lng: 78.4867, address: "Hyderabad, Telangana" } },
      { name: "Ramesh Patil", email: "ramesh.patil@gmail.com", phone: "+91-9876543226", digiPin: "J33-901-YZAB", location: { lat: 18.5204, lng: 73.8567, address: "Pune, Maharashtra" } },
      { name: "Neha Agarwal", email: "neha.agarwal@gmail.com", phone: "+91-9876543227", digiPin: "K47-234-CDEF", location: { lat: 23.0225, lng: 72.5714, address: "Ahmedabad, Gujarat" } },
    ];

    for (const civilian of civilians) {
      const id = await ctx.db.insert("users", {
        email: civilian.email,
        name: civilian.name,
        phone: civilian.phone,
        role: "civilian",
        digiPin: civilian.digiPin,
        isActive: true,
        lastSeen: Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000), // Within 24 hours
        currentLocation: {
          latitude: civilian.location.lat,
          longitude: civilian.location.lng,
          address: civilian.location.address,
          timestamp: Date.now(),
        },
        voiceEnabled: true,
        language: "en",
        createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Within 30 days
        updatedAt: Date.now(),
      });
      civilianIds.push(id);
    }

    // Create Safe Houses
    const safeHouseIds = [];
    const safeHouses = [
      { name: "Mumbai Central Safe House", address: "Kurla West, Mumbai, Maharashtra", lat: 19.0728, lng: 72.8826, capacity: 150, facilities: ["Medical Aid", "Food", "Shelter", "Communication"] },
      { name: "Delhi Emergency Center", address: "CP, New Delhi, Delhi", lat: 28.6289, lng: 77.2065, capacity: 200, facilities: ["Medical Aid", "Food", "Shelter", "Electricity"] },
      { name: "Bangalore Relief Center", address: "Whitefield, Bangalore, Karnataka", lat: 12.9698, lng: 77.7500, capacity: 120, facilities: ["Medical Aid", "Food", "Shelter"] },
      { name: "Chennai Disaster Hub", address: "T.Nagar, Chennai, Tamil Nadu", lat: 13.0418, lng: 80.2341, capacity: 180, facilities: ["Medical Aid", "Food", "Shelter", "Communication", "Electricity"] },
      { name: "Kolkata Emergency Shelter", address: "Park Street, Kolkata, West Bengal", lat: 22.5448, lng: 88.3426, capacity: 100, facilities: ["Medical Aid", "Food", "Shelter"] },
      { name: "Hyderabad Safe Zone", address: "Banjara Hills, Hyderabad, Telangana", lat: 17.4126, lng: 78.4482, capacity: 160, facilities: ["Medical Aid", "Food", "Shelter", "Communication"] },
      { name: "Pune Relief Station", address: "Koregaon Park, Pune, Maharashtra", lat: 18.5362, lng: 73.8958, capacity: 90, facilities: ["Medical Aid", "Food", "Shelter"] },
      { name: "Ahmedabad Emergency Hub", address: "Satellite, Ahmedabad, Gujarat", lat: 23.0395, lng: 72.5066, capacity: 140, facilities: ["Medical Aid", "Food", "Shelter", "Electricity"] },
    ];

    for (let i = 0; i < safeHouses.length; i++) {
      const house = safeHouses[i];
      const managerId = rescuerIds[i % rescuerIds.length];
      const occupancy = Math.floor(Math.random() * house.capacity * 0.4); // 0-40% occupancy
      
      const qrCodeData = JSON.stringify({
        type: 'safehouse_checkin',
        id: `safehouse-${Date.now()}-${i}`,
        digiPin: `QR-${house.name.slice(0, 3)}-${i}`,
        latitude: house.lat,
        longitude: house.lng,
        timestamp: Date.now()
      });

      const id = await ctx.db.insert("safeHouses", {
        name: house.name,
        address: house.address,
        location: { latitude: house.lat, longitude: house.lng },
        locationDigiPin: `QR-${house.name.slice(0, 3)}-${i}`,
        capacity: house.capacity,
        currentOccupancy: occupancy,
        facilities: house.facilities,
        managerId,
        qrCodeData,
        isActive: true,
        familyClusters: [],
        createdAt: Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000), // Within 90 days
        updatedAt: Date.now(),
      });
      safeHouseIds.push(id);
    }

    // Create SOS Requests
    const sosIds = [];
    const sosStatuses = ['sent', 'in-progress', 'rescued', 'cancelled'];
    for (let i = 0; i < 45; i++) {
      const civilianId = civilianIds[Math.floor(Math.random() * civilianIds.length)];
      const civilian = await ctx.db.get(civilianId);
      const status = sosStatuses[Math.floor(Math.random() * sosStatuses.length)];
      const rescuerId = Math.random() > 0.3 ? rescuerIds[Math.floor(Math.random() * rescuerIds.length)] : undefined;
      
      // Random location near civilian's location with some variance
      const baseLocation = civilians.find(c => c.name === civilian?.name)?.location || { lat: 19.0760, lng: 72.8777, address: "Mumbai, Maharashtra" };
      const variance = 0.01;
      const sosLocation = {
        latitude: baseLocation.lat + (Math.random() - 0.5) * variance,
        longitude: baseLocation.lng + (Math.random() - 0.5) * variance,
        address: baseLocation.address,
      };

      const createdTime = Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000); // Within 30 days
      
      const id = await ctx.db.insert("sosRequests", {
        userId: civilianId,
        digiPin: civilian?.digiPin || "UNKNOWN",
        location: sosLocation,
        status: status as any,
        priority: Math.floor(Math.random() * 100), // 0-100 priority score
        rescuerId,
        meshHops: [],
        familyCluster: [],
        timestamp: createdTime,
        updatedAt: Math.random() > 0.5 ? Date.now() - Math.floor(Math.random() * 2 * 24 * 60 * 60 * 1000) : createdTime, // Some updated recently
        notes: i % 5 === 0 ? "Emergency situation requires immediate assistance" : undefined,
        photos: [],
      });
      sosIds.push(id);
    }

    // Create Hazard Reports
    const hazardIds = [];
    const hazardTypes = [
      { title: "Flood Warning", description: "Heavy rainfall causing waterlogging", priority: "high" },
      { title: "Building Collapse Risk", description: "Old structure showing cracks", priority: "critical" },
      { title: "Gas Leak", description: "Suspected gas leak in residential area", priority: "critical" },
      { title: "Tree Fall", description: "Large tree blocking road after storm", priority: "medium" },
      { title: "Power Line Down", description: "Electrical hazard on main road", priority: "high" },
      { title: "Bridge Damage", description: "Structural damage observed on bridge", priority: "high" },
      { title: "Landslide Risk", description: "Slope instability in hilly area", priority: "medium" },
      { title: "Fire Outbreak", description: "Small fire in commercial building", priority: "critical" },
    ];

    for (let i = 0; i < 25; i++) {
      const reporterId = [...civilianIds, ...rescuerIds][Math.floor(Math.random() * (civilianIds.length + rescuerIds.length))];
      const hazardType = hazardTypes[Math.floor(Math.random() * hazardTypes.length)];
      const statuses = ['pending', 'ml-verified', 'human-verified', 'assigned', 'in-progress', 'resolved'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Random location in India
      const locations = [
        { lat: 19.0760, lng: 72.8777, address: "Mumbai, Maharashtra" },
        { lat: 28.6139, lng: 77.2090, address: "Delhi, Delhi" },
        { lat: 12.9716, lng: 77.5946, address: "Bangalore, Karnataka" },
        { lat: 13.0827, lng: 80.2707, address: "Chennai, Tamil Nadu" },
        { lat: 22.5726, lng: 88.3639, address: "Kolkata, West Bengal" },
      ];
      const location = locations[Math.floor(Math.random() * locations.length)];

      const id = await ctx.db.insert("hazards", {
        reporterId,
        title: hazardType.title,
        description: hazardType.description,
        location: {
          latitude: location.lat,
          longitude: location.lng,
          address: location.address
        },
        photos: [],
        status: status as any,
        priority: hazardType.priority as any,
        timestamp: Date.now() - Math.floor(Math.random() * 15 * 24 * 60 * 60 * 1000), // Within 15 days
        mlVerificationScore: Math.random() > 0.3 ? Math.random() * 0.4 + 0.6 : undefined, // 60-100% confidence
        assignedRescuerId: status === 'assigned' || status === 'in-progress' ? rescuerIds[Math.floor(Math.random() * rescuerIds.length)] : undefined,
      });
      hazardIds.push(id);
    }

    // Create Crowdfunding Campaigns
    const campaigns = [
      {
        title: "Mumbai Monsoon Relief 2024",
        description: "Emergency fund for flood-affected families in Mumbai and surrounding areas",
        target: 5000000,
        raised: 3750000,
        donors: 1250,
        status: "active",
      },
      {
        title: "Delhi Air Quality Emergency",
        description: "Support for respiratory health aid during severe air pollution",
        target: 2000000,
        raised: 1800000,
        donors: 890,
        status: "active",
      },
      {
        title: "Karnataka Drought Relief",
        description: "Water and agricultural support for drought-hit regions",
        target: 3500000,
        raised: 3500000,
        donors: 1567,
        status: "completed",
      },
      {
        title: "Cyclone Rehabilitation - East Coast",
        description: "Reconstruction aid for cyclone-affected coastal communities",
        target: 8000000,
        raised: 4200000,
        donors: 2103,
        status: "active",
      },
      {
        title: "Himalayan Landslide Relief",
        description: "Emergency support for landslide victims in mountain regions",
        target: 1500000,
        raised: 1500000,
        donors: 432,
        status: "completed",
      },
    ];

    for (const campaign of campaigns) {
      const allocations = [
        { location: safeHouses[Math.floor(Math.random() * safeHouses.length)].name, amount: Math.floor(campaign.raised * 0.3), status: "allocated" },
        { location: safeHouses[Math.floor(Math.random() * safeHouses.length)].name, amount: Math.floor(campaign.raised * 0.4), status: "disbursed" },
        { location: "Emergency Supplies", amount: Math.floor(campaign.raised * 0.2), status: "allocated" },
      ];

      await ctx.db.insert("crowdfundingCampaigns", {
        title: campaign.title,
        description: campaign.description,
        target: campaign.target,
        raised: campaign.raised,
        donors: campaign.donors,
        status: campaign.status as any,
        createdBy: adminId,
        relatedSOSIds: sosIds.slice(0, 3),
        allocations: allocations as any,
        createdAt: Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000), // Within 60 days
        updatedAt: Date.now(),
        completedAt: campaign.status === "completed" ? Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000) : undefined,
      });
    }

    return {
      message: "Successfully seeded database with realistic data",
      counts: {
        users: civilianIds.length + rescuerIds.length + 1, // +1 for admin
        safeHouses: safeHouseIds.length,
        sosRequests: sosIds.length,
        hazards: hazardIds.length,
        campaigns: campaigns.length,
      }
    };
  },
});