'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../react-native-app/convex/_generated/api'
import { 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Users,
  MapPin,
  BarChart3
} from 'lucide-react'
import StatCard from '../ui/StatCard'

export default function SOSAnalyticsTab() {
  // Fetch data from Convex backend
  const allSOS = useQuery(api.sos.getAllSOSRequests)
  const allUsers = useQuery(api.users.getAllUsers)

  // Helper function to get user name from userId
  const getUserName = (userId: string) => {
    const user = allUsers?.find(u => u._id === userId)
    return user?.name || 'Anonymous'
  }

  // Calculate analytics
  const totalSOS = allSOS?.length || 0
  const activeSOS = allSOS?.filter(sos => sos.status === 'sent' || sos.status === 'in-progress').length || 0
  const resolvedSOS = allSOS?.filter(sos => sos.status === 'rescued').length || 0
  const todaySOS = allSOS?.filter(sos => {
    const today = new Date()
    const sosDate = new Date(sos._creationTime)
    return sosDate.toDateString() === today.toDateString()
  }).length || 0
  const resolvedTodaySOS = allSOS?.filter(sos => {
    const today = new Date()
    const sosDate = new Date(sos.updatedAt || sos._creationTime)
    return sosDate.toDateString() === today.toDateString() && sos.status === 'rescued'
  }).length || 0
  
  // Calculate real response rate
  const overallResponseRate = totalSOS > 0 ? ((resolvedSOS / totalSOS) * 100).toFixed(1) : '0'
  
  // Calculate average response time from real data
  const responseTimes = allSOS?.filter(sos => sos.status === 'rescued' && sos.updatedAt)
    .map(sos => (sos.updatedAt - sos._creationTime) / (1000 * 60)) // Convert to minutes
  const avgResponseTime = responseTimes?.length > 0 
    ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
    : 0

  // State-wise analytics
  const stateWiseAnalytics = allSOS?.reduce((acc: any, sos: any) => {
    const state = extractStateFromLocation(sos.location?.address) || 'Unknown'
    if (!acc[state]) {
      acc[state] = { total: 0, active: 0, resolved: 0 }
    }
    acc[state].total++
    if (sos.status === 'sent' || sos.status === 'in-progress') acc[state].active++
    if (sos.status === 'rescued') acc[state].resolved++
    return acc
  }, {}) || {}

  // Priority-wise breakdown - handle all priority levels from schema
  const priorityBreakdown = allSOS?.reduce((acc: any, sos: any) => {
    // Convert numeric priority to text or use string priority
    let priority = 'medium' // default
    if (typeof sos.priority === 'number') {
      if (sos.priority >= 80) priority = 'critical'
      else if (sos.priority >= 60) priority = 'high'
      else if (sos.priority >= 40) priority = 'medium'
      else priority = 'low'
    } else if (typeof sos.priority === 'string') {
      priority = sos.priority
    }
    acc[priority] = (acc[priority] || 0) + 1
    return acc
  }, {}) || {}

  // Real monthly trend from backend data
  const monthlyTrend = allSOS?.reduce((acc: any, sos: any) => {
    const date = new Date(sos._creationTime)
    const monthKey = date.toLocaleDateString('en-US', { month: 'short' })
    acc[monthKey] = (acc[monthKey] || 0) + 1
    return acc
  }, {}) || {}

  // Convert to array format for chart
  const monthlyTrendArray = Object.entries(monthlyTrend).map(([month, sos]) => ({
    month,
    sos
  })).slice(-6) // Last 6 months

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total SOS Requests"
          value={totalSOS}
          icon={AlertTriangle}
          color="red"
          subtitle="All time"
        />
        <StatCard
          title="Active SOS"
          value={activeSOS}
          icon={Users}
          color="orange"
          subtitle="Needs attention"
        />
        <StatCard
          title="Resolved Today"
          value={resolvedTodaySOS}
          icon={TrendingUp}
          color="green"
          subtitle="Last 24 hours"
        />
        <StatCard
          title="Response Rate"
          value={`${overallResponseRate}%`}
          icon={Clock}
          color="blue"
          subtitle={`${avgResponseTime} min avg`}
        />
      </div>

      {/* State-wise Analytics Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">State-wise SOS Analytics</h3>
          <p className="text-sm text-gray-600 mt-1">Emergency requests breakdown by state</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total SOS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resolved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(stateWiseAnalytics)
                .sort(([,a], [,b]) => (b as any).total - (a as any).total)
                .map(([state, data]: [string, any]) => {
                  const responseRate = data.total > 0 ? ((data.resolved / data.total) * 100).toFixed(1) : '0'
                  return (
                    <tr key={state} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">{state}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{data.total}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          data.active > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {data.active}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {data.resolved}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${responseRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{responseRate}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Priority Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(priorityBreakdown).map(([priority, count]: [string, any]) => {
                const percentage = totalSOS > 0 ? ((count / totalSOS) * 100).toFixed(1) : '0'
                const colorMap: any = {
                  critical: 'bg-red-600',
                  high: 'bg-red-500',
                  medium: 'bg-yellow-500',
                  low: 'bg-green-500'
                }
                return (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${colorMap[priority] || 'bg-gray-500'}`}></div>
                      <span className="font-medium text-gray-900 capitalize">{priority}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent SOS Requests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent SOS Requests</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {allSOS?.slice(0, 6).map((sos: any) => (
                <div key={sos._id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    sos.status === 'sent' || sos.status === 'in-progress' ? 'bg-red-500' : 
                    sos.status === 'rescued' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {getUserName(sos.userId)}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {sos.location?.address || 'Unknown location'} • {new Date(sos._creationTime).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    sos.status === 'sent' || sos.status === 'in-progress' ? 'bg-red-100 text-red-800' : 
                    sos.status === 'rescued' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sos.status}
                  </span>
                </div>
              ))}
            </div>
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
  
  // If no match found, return the original location or "Other"
  return 'Other Locations'
}