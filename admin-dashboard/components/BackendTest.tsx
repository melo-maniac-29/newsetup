'use client'

import { useQuery } from 'convex/react'
import { api } from '../../react-native-app/convex/_generated/api'

export default function BackendTest() {
  const allUsers = useQuery(api.users.getAllUsers)
  const allSOS = useQuery(api.sos.getAllSOSRequests)
  const allSafeHouses = useQuery(api.safehouses.getSafeHouses)
  const allHazards = useQuery(api.hazards.getHazards)
  const crowdfundingStats = useQuery(api.crowdfunding.getCampaignStats)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Backend Connectivity Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-gray-800">Users</h3>
          <p className="text-2xl font-bold text-blue-600">
            {allUsers ? allUsers.length : 'Loading...'}
          </p>
          <p className="text-sm text-gray-600">Total users in system</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-gray-800">SOS Requests</h3>
          <p className="text-2xl font-bold text-red-600">
            {allSOS ? allSOS.length : 'Loading...'}
          </p>
          <p className="text-sm text-gray-600">Total SOS requests</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-gray-800">Safe Houses</h3>
          <p className="text-2xl font-bold text-green-600">
            {allSafeHouses ? allSafeHouses.length : 'Loading...'}
          </p>
          <p className="text-sm text-gray-600">Total safe houses</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-gray-800">Hazards</h3>
          <p className="text-2xl font-bold text-orange-600">
            {allHazards ? allHazards.length : 'Loading...'}
          </p>
          <p className="text-sm text-gray-600">Total hazard reports</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-gray-800">Crowdfunding</h3>
          <p className="text-2xl font-bold text-purple-600">
            {crowdfundingStats ? `₹${(crowdfundingStats.totalRaised / 100000).toFixed(1)}L` : 'Loading...'}
          </p>
          <p className="text-sm text-gray-600">Total funds raised</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="font-semibold text-gray-800">Campaigns</h3>
          <p className="text-2xl font-bold text-indigo-600">
            {crowdfundingStats ? crowdfundingStats.activeCampaigns : 'Loading...'}
          </p>
          <p className="text-sm text-gray-600">Active campaigns</p>
        </div>
      </div>

      <div className="mt-8 bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-4">Connection Status</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${allUsers ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Users API: {allUsers ? '✅ Connected' : '❌ Loading...'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${allSOS ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>SOS API: {allSOS ? '✅ Connected' : '❌ Loading...'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${allSafeHouses ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Safe Houses API: {allSafeHouses ? '✅ Connected' : '❌ Loading...'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${allHazards ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Hazards API: {allHazards ? '✅ Connected' : '❌ Loading...'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${crowdfundingStats ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Crowdfunding API: {crowdfundingStats ? '✅ Connected' : '❌ Loading...'}</span>
          </div>
        </div>
      </div>

      {/* Raw Data Preview */}
      <div className="mt-8">
        <h3 className="font-semibold mb-4">Sample Data Preview</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-xs">
            {JSON.stringify({
              usersCount: allUsers?.length,
              sosCount: allSOS?.length,
              safeHousesCount: allSafeHouses?.length,
              hazardsCount: allHazards?.length,
              crowdfundingStats: crowdfundingStats,
              sampleUser: allUsers?.[0] ? {
                name: allUsers[0].name,
                role: allUsers[0].role,
                digiPin: allUsers[0].digiPin
              } : null,
              sampleSOS: allSOS?.[0] ? {
                status: allSOS[0].status,
                location: allSOS[0].location?.address,
                timestamp: new Date(allSOS[0]._creationTime).toLocaleString()
              } : null
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}