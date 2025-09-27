'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../react-native-app/convex/_generated/api'
import { 
  Home, 
  Users, 
  MapPin, 
  TrendingUp,
  DollarSign,
  Plus,
  Eye
} from 'lucide-react'
import StatCard from '../ui/StatCard'

export default function SafeHousesTab() {
  // Fetch data from Convex backend
  const allSafeHouses = useQuery(api.safehouses.getSafeHouses)

  // Calculate statistics
  const totalSafeHouses = allSafeHouses?.length || 0
  const activeSafeHouses = allSafeHouses?.filter(house => house.isActive).length || 0
  const totalCapacity = allSafeHouses?.reduce((sum, house) => sum + house.capacity, 0) || 0
  const totalOccupancy = allSafeHouses?.reduce((sum, house) => sum + (house.currentOccupancy || 0), 0) || 0
  const occupancyRate = totalCapacity > 0 ? ((totalOccupancy / totalCapacity) * 100).toFixed(1) : '0'

  // State-wise breakdown
  const stateWiseData = allSafeHouses?.reduce((acc: any, house: any) => {
    const state = extractStateFromLocation(house.address) || 'Unknown'
    if (!acc[state]) {
      acc[state] = { count: 0, capacity: 0, occupancy: 0 }
    }
    acc[state].count++
    acc[state].capacity += house.capacity
    acc[state].occupancy += house.currentOccupancy || 0
    return acc
  }, {}) || {}

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Safe Houses"
          value={totalSafeHouses}
          icon={Home}
          color="blue"
          subtitle={`${activeSafeHouses} active`}
        />
        <StatCard
          title="Total Capacity"
          value={totalCapacity}
          icon={Users}
          color="green"
          subtitle={`${totalOccupancy} occupied`}
        />
        <StatCard
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          icon={TrendingUp}
          color="yellow"
          change="+5%"
          changeType="positive"
        />
        <StatCard
          title="Total Funding Allocated"
          value="₹45.2L"
          icon={DollarSign}
          color="green"
          subtitle="From crowdfunding"
        />
      </div>

      {/* Add Safe House Button */}
      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Safe House</span>
        </button>
      </div>

      {/* State-wise Safe Houses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">State-wise Safe House Distribution</h3>
          <p className="text-sm text-gray-600 mt-1">Safe house capacity and funding by state</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Safe Houses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Occupancy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(stateWiseData)
                .sort(([,a], [,b]) => (b as any).count - (a as any).count)
                .map(([state, data]: [string, any]) => {
                  const utilizationRate = data.capacity > 0 ? ((data.occupancy / data.capacity) * 100).toFixed(1) : '0'
                  return (
                    <tr key={state} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">{state}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{data.count}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{data.capacity}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          data.occupancy > data.capacity * 0.8 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {data.occupancy}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 w-20">
                            <div 
                              className={`h-2 rounded-full ${
                                parseFloat(utilizationRate) > 80 ? 'bg-red-500' :
                                parseFloat(utilizationRate) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(parseFloat(utilizationRate), 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{utilizationRate}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safe Houses List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Safe Houses</h3>
          <p className="text-sm text-gray-600 mt-1">Manage safe house facilities and capacity</p>
        </div>
        <div className="divide-y divide-gray-200">
          {allSafeHouses?.slice(0, 10).map((safeHouse: any) => {
            const utilizationRate = safeHouse.capacity > 0 ? 
              ((safeHouse.currentOccupancy || 0) / safeHouse.capacity * 100).toFixed(1) : '0'
            
            return (
              <div key={safeHouse._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-semibold text-gray-900">{safeHouse.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        safeHouse.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {safeHouse.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{safeHouse.address}</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Manage</span>
                  </button>
                </div>

                {/* Safe House Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Capacity</p>
                    <p className="font-semibold text-gray-900">{safeHouse.capacity}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Occupied</p>
                    <p className="font-semibold text-blue-600">{safeHouse.currentOccupancy || 0}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Utilization</p>
                    <p className={`font-semibold ${
                      parseFloat(utilizationRate) > 80 ? 'text-red-600' :
                      parseFloat(utilizationRate) > 60 ? 'text-yellow-600' : 'text-green-600'
                    }`}>{utilizationRate}%</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="font-semibold text-gray-900">{safeHouse.contactNumber}</p>
                  </div>
                </div>

                {/* Family Clusters */}
                {safeHouse.familyClusters && safeHouse.familyClusters.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Family Clusters ({safeHouse.familyClusters.length})</h5>
                    <div className="flex flex-wrap gap-2">
                      {safeHouse.familyClusters.map((cluster: any, index: number) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {cluster.familyHeadName} ({cluster.memberCount} members)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Helper function to extract state from address
function extractStateFromLocation(address: string): string {
  const stateKeywords = {
    'Mumbai': 'Maharashtra',
    'Delhi': 'Delhi',
    'Bangalore': 'Karnataka',
    'Chennai': 'Tamil Nadu',
    'Kolkata': 'West Bengal',
    'Hyderabad': 'Telangana',
    'Pune': 'Maharashtra',
    'Gujarat': 'Gujarat',
    'Rajasthan': 'Rajasthan',
    'Punjab': 'Punjab'
  }
  
  for (const [keyword, state] of Object.entries(stateKeywords)) {
    if (address?.includes(keyword)) {
      return state
    }
  }
  
  return 'Maharashtra' // Default
}