'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../react-native-app/convex/_generated/api'
import { 
  Users, 
  AlertTriangle, 
  Home, 
  DollarSign,
  MapPin,
  TrendingUp
} from 'lucide-react'
import IndiaMap from '../maps/IndiaMap'
import StatCard from '../ui/StatCard'

export default function OverviewTab() {
  // Fetch data from Convex backend
  const allUsers = useQuery(api.users.getAllUsers)
  const allSOS = useQuery(api.sos.getAllSOSRequests)
  const allSafeHouses = useQuery(api.safehouses.getSafeHouses)
  const allHazards = useQuery(api.hazards.getHazards)
  const crowdfundingStats = useQuery(api.crowdfunding.getCampaignStats)

  // Helper function to get user name from userId
  const getUserName = (userId: string) => {
    const user = allUsers?.find(u => u._id === userId)
    return user?.name || 'Anonymous'
  }

  // Calculate statistics
  const totalUsers = allUsers?.length || 0
  const totalSOS = allSOS?.length || 0
  const activeSOS = allSOS?.filter(sos => sos.status === 'sent' || sos.status === 'in-progress').length || 0
  const totalSafeHouses = allSafeHouses?.length || 0
  const occupiedSafeHouses = allSafeHouses?.filter(house => house.currentOccupancy > 0).length || 0
  const activeHazards = allHazards?.filter(hazard => hazard.status === 'pending' || hazard.status === 'in-progress').length || 0

  // Real crowdfunding data from backend
  const totalFundsRaised = crowdfundingStats?.totalRaised || 0
  const activeCampaigns = crowdfundingStats?.activeCampaigns || 0

  // State-wise SOS data for map
  const stateWiseData = allSOS?.reduce((acc: any, sos: any) => {
    // Extract state from location or use a mapping service
    const state = extractStateFromLocation(sos.location?.address || '') || 'Unknown'
    acc[state] = (acc[state] || 0) + 1
    return acc
  }, {}) || {}

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="blue"
          change="+12%"
          changeType="positive"
        />
        <StatCard
          title="Active SOS"
          value={activeSOS}
          icon={AlertTriangle}
          color="red"
          subtitle={`${totalSOS} total`}
        />
        <StatCard
          title="Safe Houses"
          value={occupiedSafeHouses}
          icon={Home}
          color="green"
          subtitle={`${totalSafeHouses} total`}
        />
        <StatCard
          title="Funds Raised"
          value={`₹${(totalFundsRaised / 100000).toFixed(1)}L`}
          icon={DollarSign}
          color="yellow"
          subtitle={`${activeCampaigns} campaigns`}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Hazards"
          value={activeHazards}
          icon={MapPin}
          color="orange"
          size="small"
        />
        <StatCard
          title="Response Rate"
          value="94%"
          icon={TrendingUp}
          color="green"
          size="small"
          change="+2%"
          changeType="positive"
        />
        <StatCard
          title="Avg Response Time"
          value="12 min"
          icon={AlertTriangle}
          color="blue"
          size="small"
          change="-3 min"
          changeType="positive"
        />
      </div>

      {/* India Map */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Live Emergency Map - India
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Real-time SOS requests and safe house locations
          </p>
        </div>
        <div className="p-6">
          <IndiaMap 
            sosData={allSOS}
            safeHouses={allSafeHouses}
            hazards={allHazards}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {allSOS?.slice(0, 5).map((sos: any) => (
              <div key={sos._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  sos.status === 'sent' || sos.status === 'in-progress' ? 'bg-red-500' : 'bg-green-500'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    SOS Request - {getUserName(sos.userId)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {sos.location?.address || 'Unknown location'} • {new Date(sos._creationTime).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  sos.status === 'sent' || sos.status === 'in-progress'
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {sos.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to extract state from location
function extractStateFromLocation(location: string | undefined | null): string {
  if (!location || typeof location !== 'string') {
    return 'Unknown Location'
  }
  
  // Comprehensive state detection with multiple keywords and variations
  const stateKeywords = {
    // Maharashtra
    'mumbai': 'Maharashtra',
    'pune': 'Maharashtra', 
    'nagpur': 'Maharashtra',
    'nashik': 'Maharashtra',
    'maharashtra': 'Maharashtra',
    
    // Delhi
    'delhi': 'Delhi',
    'new delhi': 'Delhi',
    
    // Karnataka  
    'bangalore': 'Karnataka',
    'bengaluru': 'Karnataka',
    'mysore': 'Karnataka',
    'mangalore': 'Karnataka',
    'karnataka': 'Karnataka',
    
    // Tamil Nadu
    'chennai': 'Tamil Nadu',
    'madras': 'Tamil Nadu',
    'coimbatore': 'Tamil Nadu',
    'madurai': 'Tamil Nadu',
    'tamil nadu': 'Tamil Nadu',
    
    // West Bengal
    'kolkata': 'West Bengal',
    'calcutta': 'West Bengal',
    'west bengal': 'West Bengal',
    'bengal': 'West Bengal',
    
    // Telangana
    'hyderabad': 'Telangana',
    'secunderabad': 'Telangana',
    'telangana': 'Telangana',
    
    // Gujarat
    'ahmedabad': 'Gujarat',
    'surat': 'Gujarat',
    'vadodara': 'Gujarat',
    'rajkot': 'Gujarat',
    'gujarat': 'Gujarat',
    
    // Other major states
    'rajasthan': 'Rajasthan',
    'jaipur': 'Rajasthan',
    'udaipur': 'Rajasthan',
    
    'punjab': 'Punjab',
    'chandigarh': 'Punjab',
    'ludhiana': 'Punjab',
    
    'haryana': 'Haryana',
    'gurgaon': 'Haryana',
    'faridabad': 'Haryana',
    
    'uttar pradesh': 'Uttar Pradesh',
    'lucknow': 'Uttar Pradesh',
    'kanpur': 'Uttar Pradesh',
    'agra': 'Uttar Pradesh',
    
    'madhya pradesh': 'Madhya Pradesh',
    'bhopal': 'Madhya Pradesh',
    'indore': 'Madhya Pradesh',
    
    'kerala': 'Kerala',
    'kochi': 'Kerala',
    'thiruvananthapuram': 'Kerala',
    
    'andhra pradesh': 'Andhra Pradesh',
    'visakhapatnam': 'Andhra Pradesh',
    'vijayawada': 'Andhra Pradesh'
  }
  
  const locationLower = location.toLowerCase()
  
  // Check for direct matches with state keywords
  for (const [keyword, state] of Object.entries(stateKeywords)) {
    if (locationLower.includes(keyword)) {
      return state
    }
  }
  
  // If no match found, return "Other Locations"
  return 'Other Locations'
}