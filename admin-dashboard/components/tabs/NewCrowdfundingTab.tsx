'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../react-native-app/convex/_generated/api'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Target,
  Plus,
  Eye
} from 'lucide-react'
import StatCard from '../ui/StatCard'
import NewCrowdfundingModal from '../modals/NewCrowdfundingModal'

export default function NewCrowdfundingTab() {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Fetch data from Convex backend
  const campaigns = useQuery(api.crowdfunding.getCampaigns)
  const campaignStats = useQuery(api.crowdfunding.getCampaignStats)

  // Handle loading state
  if (campaigns === undefined || campaignStats === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading crowdfunding data...</p>
        </div>
      </div>
    )
  }

  // Real statistics from backend
  const totalRaised = campaignStats?.totalRaised || 0
  const totalTarget = campaignStats?.totalTarget || 0
  const totalDonors = campaignStats?.totalDonors || 0
  const activeCampaigns = campaignStats?.activeCampaigns || 0
  
  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
    return `₹${amount}`
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Funds Raised"
          value={formatCurrency(totalRaised)}
          icon={DollarSign}
          color="green"
          subtitle={`${formatCurrency(totalTarget)} target`}
        />
        <StatCard
          title="Active Campaigns"
          value={activeCampaigns}
          icon={Target}
          color="blue"
          subtitle={`${campaigns?.length || 0} total campaigns`}
        />
        <StatCard
          title="Total Donors"
          value={totalDonors}
          icon={Users}
          color="blue"
          subtitle="Community supporters"
        />
        <StatCard
          title="Success Rate"
          value={`${campaignStats?.completionRate || '0'}%`}
          icon={TrendingUp}
          color="green"
          subtitle="Campaign completion"
        />
      </div>

      {/* Create Campaign Button */}
      <div className="flex justify-end">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Campaign</span>
        </button>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Crowdfunding Campaigns</h3>
          <p className="text-sm text-gray-600 mt-1">Disaster relief fundraising campaigns</p>
        </div>

        {!campaigns || campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Crowdfunding Campaigns</h3>
            <p className="mt-1 text-gray-500">
              No campaigns have been created yet. Click "Create New Campaign" to get started.
            </p>
            <div className="mt-6">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Create Campaign
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign) => {
              const progress = (campaign.raised / campaign.target) * 100
              const totalAllocated = campaign.allocations?.reduce((sum: number, alloc: any) => sum + alloc.amount, 0) || 0
              const remainingFunds = campaign.raised - totalAllocated

              return (
                <div key={campaign._id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-semibold text-gray-900">{campaign.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          campaign.status === 'active' ? 'bg-green-100 text-green-800' : 
                          campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{campaign.description}</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">View Details</span>
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-600">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Campaign Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Raised</p>
                      <p className="font-semibold text-green-600">{formatCurrency(campaign.raised)}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Target</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(campaign.target)}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Donors</p>
                      <p className="font-semibold text-blue-600">{campaign.donors}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Remaining</p>
                      <p className="font-semibold text-orange-600">{formatCurrency(remainingFunds)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* New Crowdfunding Modal */}
      <NewCrowdfundingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false)
          // Convex will automatically refresh the data
        }}
      />
    </div>
  )
}