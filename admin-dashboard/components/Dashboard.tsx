'use client'

import { useState } from 'react'
import { 
  BarChart3, 
  MapPin, 
  AlertTriangle, 
  DollarSign, 
  Home, 
  Users,
  MessageSquare,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import OverviewTab from './tabs/OverviewTab'
import SOSAnalyticsTab from './tabs/SOSAnalyticsTab'
import NewCrowdfundingTab from './tabs/NewCrowdfundingTab'
import SafeHousesTab from './tabs/SafeHousesTab'
import ChatbotTab from './tabs/ChatbotTab'

interface DashboardProps {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'sos', label: 'SOS Analytics', icon: AlertTriangle },
    { id: 'crowdfunding', label: 'Crowdfunding', icon: DollarSign },
    { id: 'safehouses', label: 'Safe Houses', icon: Home },
    { id: 'chatbot', label: 'AI Analytics', icon: MessageSquare },
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />
      case 'sos':
        return <SOSAnalyticsTab />
      case 'crowdfunding':
        return <NewCrowdfundingTab />
      case 'safehouses':
        return <SafeHousesTab />
      case 'chatbot':
        return <ChatbotTab />
      default:
        return <OverviewTab />
    }
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">Emergency</h1>
                  <p className="text-xs text-gray-600">Admin Dashboard</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{tab.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {tabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  )
}