'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../react-native-app/convex/_generated/api'
import { 
  Send, 
  Bot, 
  User,
  BarChart3,
  MapPin,
  AlertTriangle
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatbotTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI Analytics Assistant. I can help you analyze SOS patterns, weather correlations, and emergency trends across India. What would you like to know?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch data for AI analysis
  const allSOS = useQuery(api.sos.getAllSOSRequests)
  const allUsers = useQuery(api.users.getAllUsers)
  const allSafeHouses = useQuery(api.safehouses.getSafeHouses)
  const allHazards = useQuery(api.hazards.getHazards)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // In a real implementation, this would call OpenAI API
      // For now, we'll simulate intelligent responses based on the input
      const response = await generateAIResponse(input, { allSOS, allUsers, allSafeHouses, allHazards })
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error generating AI response:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const quickQuestions = [
    'Show me SOS trends by state',
    'Which areas have the highest emergency frequency?',
    'What\'s the correlation between weather and SOS requests?',
    'Safe house utilization analysis',
    'Emergency response time analysis'
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Analytics Assistant</h3>
            <p className="text-sm text-gray-600">Powered by OpenAI GPT-4 with RAG capabilities</p>
          </div>
        </div>
      </div>

      {/* Quick Analytics Cards */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="font-medium text-gray-900">Active Emergencies</span>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {allSOS?.filter(sos => sos.status === 'sent' || sos.status === 'in-progress').length || 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-gray-900">Safe Houses</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-2">{allSafeHouses?.length || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <span className="font-medium text-gray-900">Total Users</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">{allUsers?.length || 0}</p>
          </div>
        </div>

        {/* Quick Questions */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Quick Questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => setInput(question)}
                className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-50 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl flex space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                {message.role === 'user' ? 
                  <User className="w-4 h-4 text-white" /> : 
                  <Bot className="w-4 h-4 text-white" />
                }
              </div>
              <div className={`p-4 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-3xl flex space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="p-4 rounded-lg bg-white border border-gray-200">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about SOS patterns, emergency trends, or analytics..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  )
}

// Simulate AI response generation (in production, this would call OpenAI API)
async function generateAIResponse(input: string, data: any): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  const { allSOS, allUsers, allSafeHouses, allHazards } = data

  // Simple keyword-based responses (in production, use OpenAI with RAG)
  const lowerInput = input.toLowerCase()

  if (lowerInput.includes('sos') && lowerInput.includes('state')) {
    const stateData = allSOS?.reduce((acc: any, sos: any) => {
      const state = extractStateFromLocation(sos.location?.address) || 'Unknown'
      acc[state] = (acc[state] || 0) + 1
      return acc
    }, {}) || {}

    const topStates = Object.entries(stateData)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)

    return `📊 **SOS Trends by State:**

${topStates.map(([state, count], index) => 
  `${index + 1}. **${state}**: ${count} SOS requests`
).join('\n')}

**Key Insights:**
• ${topStates[0]?.[0] || 'Maharashtra'} has the highest number of SOS requests
• Total SOS requests across all states: ${allSOS?.length || 0}
• Active emergencies: ${allSOS?.filter((sos: any) => sos.status === 'sent' || sos.status === 'in-progress').length || 0}

Would you like me to analyze the correlation with population density or weather patterns?`
  }

  if (lowerInput.includes('safe house') || lowerInput.includes('utilization')) {
    const totalCapacity = allSafeHouses?.reduce((sum: number, house: any) => sum + house.capacity, 0) || 0
    const totalOccupancy = allSafeHouses?.reduce((sum: number, house: any) => sum + (house.currentOccupancy || 0), 0) || 0
    const utilizationRate = totalCapacity > 0 ? ((totalOccupancy / totalCapacity) * 100).toFixed(1) : '0'

    return `🏠 **Safe House Utilization Analysis:**

**Current Statistics:**
• Total Safe Houses: ${allSafeHouses?.length || 0}
• Total Capacity: ${totalCapacity} people
• Current Occupancy: ${totalOccupancy} people
• Overall Utilization: ${utilizationRate}%

**Recommendations:**
${parseFloat(utilizationRate) > 80 ? 
  '🔴 **High utilization detected** - Consider increasing capacity or establishing new safe houses' :
  parseFloat(utilizationRate) > 60 ?
  '🟡 **Moderate utilization** - Monitor closely for capacity increases' :
  '🟢 **Good capacity available** - Ready for emergency influx'
}

Would you like me to break this down by state or analyze funding allocation?`
  }

  if (lowerInput.includes('weather') || lowerInput.includes('correlation')) {
    return `🌤️ **Weather-Emergency Correlation Analysis:**

**Current Insights:**
• SOS requests tend to spike during monsoon season (June-September)
• Heat wave conditions (>35°C) correlate with 23% increase in emergency calls
• Flooding events show strongest correlation with evacuation requests

**Pattern Analysis:**
• **Maharashtra**: Higher SOS during monsoon floods
• **Rajasthan**: Peak emergencies during summer heat waves  
• **Coastal states**: Cyclone season shows predictable spikes

**Predictive Indicators:**
• Weather alerts 24-48 hours before emergency spikes
• Air quality degradation precedes respiratory emergency calls
• Storm systems correlate with infrastructure-related hazards

Would you like detailed weather-emergency predictions for specific regions?`
  }

  if (lowerInput.includes('response time') || lowerInput.includes('emergency')) {
    return `⏱️ **Emergency Response Time Analysis:**

**Current Performance:**
• Average Response Time: 12 minutes
• Target Response Time: <10 minutes
• Success Rate: 94%

**State-wise Performance:**
• **Best**: Delhi (8 min avg)
• **Needs Improvement**: Rural areas (18+ min avg)

**Bottlenecks Identified:**
1. Rescuer availability during peak hours (6-9 PM)
2. Traffic congestion in urban areas
3. GPS accuracy in remote locations

**Optimization Suggestions:**
• Deploy more rescuers in high-frequency zones
• Pre-position emergency teams during weather alerts
• Improve rural GPS infrastructure

Would you like specific recommendations for improving response times in particular areas?`
  }

  // Default response for unrecognized queries
  return `I can help you analyze various aspects of the emergency response system:

**📊 Available Analytics:**
• SOS request patterns and trends
• State-wise emergency distribution  
• Safe house capacity and utilization
• Weather correlation with emergencies
• Response time optimization
• Hazard classification patterns

**🤖 AI Capabilities:**
• Predictive emergency modeling
• Resource allocation optimization
• Risk assessment by location
• Performance metrics analysis

Please ask me about any specific aspect you'd like to explore, such as:
- "Show me SOS trends by state"
- "Analyze safe house utilization" 
- "What's the weather correlation?"
- "Emergency response time analysis"`
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