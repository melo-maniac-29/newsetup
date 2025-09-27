// Utility functions for the admin dashboard

// Comprehensive function to extract Indian state from location string
export function extractStateFromLocation(location: string | undefined | null): string {
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
    'salem': 'Tamil Nadu',
    'tamil nadu': 'Tamil Nadu',
    
    // West Bengal
    'kolkata': 'West Bengal',
    'calcutta': 'West Bengal',
    'west bengal': 'West Bengal',
    'bengal': 'West Bengal',
    'howrah': 'West Bengal',
    
    // Telangana
    'hyderabad': 'Telangana',
    'secunderabad': 'Telangana',
    'telangana': 'Telangana',
    'warangal': 'Telangana',
    
    // Gujarat
    'ahmedabad': 'Gujarat',
    'surat': 'Gujarat',
    'vadodara': 'Gujarat',
    'rajkot': 'Gujarat',
    'bharuch': 'Gujarat',
    'gujarat': 'Gujarat',
    
    // Rajasthan
    'rajasthan': 'Rajasthan',
    'jaipur': 'Rajasthan',
    'udaipur': 'Rajasthan',
    'jodhpur': 'Rajasthan',
    'kota': 'Rajasthan',
    
    // Punjab
    'punjab': 'Punjab',
    'chandigarh': 'Punjab',
    'ludhiana': 'Punjab',
    'amritsar': 'Punjab',
    
    // Haryana
    'haryana': 'Haryana',
    'gurgaon': 'Haryana',
    'gurugram': 'Haryana',
    'faridabad': 'Haryana',
    
    // Uttar Pradesh
    'uttar pradesh': 'Uttar Pradesh',
    'lucknow': 'Uttar Pradesh',
    'kanpur': 'Uttar Pradesh',
    'agra': 'Uttar Pradesh',
    'varanasi': 'Uttar Pradesh',
    'allahabad': 'Uttar Pradesh',
    'prayagraj': 'Uttar Pradesh',
    
    // Madhya Pradesh
    'madhya pradesh': 'Madhya Pradesh',
    'bhopal': 'Madhya Pradesh',
    'indore': 'Madhya Pradesh',
    'gwalior': 'Madhya Pradesh',
    'jabalpur': 'Madhya Pradesh',
    
    // Kerala
    'kerala': 'Kerala',
    'kochi': 'Kerala',
    'cochin': 'Kerala',
    'thiruvananthapuram': 'Kerala',
    'trivandrum': 'Kerala',
    'kozhikode': 'Kerala',
    'calicut': 'Kerala',
    
    // Andhra Pradesh
    'andhra pradesh': 'Andhra Pradesh',
    'visakhapatnam': 'Andhra Pradesh',
    'vizag': 'Andhra Pradesh',
    'vijayawada': 'Andhra Pradesh',
    'tirupati': 'Andhra Pradesh',
    
    // Other major states
    'bihar': 'Bihar',
    'patna': 'Bihar',
    
    'jharkhand': 'Jharkhand',
    'ranchi': 'Jharkhand',
    
    'odisha': 'Odisha',
    'orissa': 'Odisha',
    'bhubaneswar': 'Odisha',
    
    'chhattisgarh': 'Chhattisgarh',
    'raipur': 'Chhattisgarh',
    
    // North East
    'assam': 'Assam',
    'guwahati': 'Assam',
    
    'manipur': 'Manipur',
    'imphal': 'Manipur',
    
    'nagaland': 'Nagaland',
    'kohima': 'Nagaland',
    
    'tripura': 'Tripura',
    'agartala': 'Tripura',
    
    'meghalaya': 'Meghalaya',
    'shillong': 'Meghalaya',
    
    'mizoram': 'Mizoram',
    'aizawl': 'Mizoram',
    
    'arunachal pradesh': 'Arunachal Pradesh',
    'itanagar': 'Arunachal Pradesh',
    
    // Mountain states
    'himachal pradesh': 'Himachal Pradesh',
    'shimla': 'Himachal Pradesh',
    'dharamshala': 'Himachal Pradesh',
    
    'uttarakhand': 'Uttarakhand',
    'dehradun': 'Uttarakhand',
    'haridwar': 'Uttarakhand',
    
    'jammu and kashmir': 'Jammu and Kashmir',
    'jammu': 'Jammu and Kashmir',
    'srinagar': 'Jammu and Kashmir',
    'kashmir': 'Jammu and Kashmir',
    
    'ladakh': 'Ladakh',
    'leh': 'Ladakh',
    
    'sikkim': 'Sikkim',
    'gangtok': 'Sikkim',
    
    // Small states/UTs
    'goa': 'Goa',
    'panaji': 'Goa',
    'margao': 'Goa',
    
    'puducherry': 'Puducherry',
    'pondicherry': 'Puducherry',
    
    'daman and diu': 'Daman and Diu',
    'dadra and nagar haveli': 'Dadra and Nagar Haveli',
    'lakshadweep': 'Lakshadweep',
    'andaman and nicobar': 'Andaman and Nicobar Islands'
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

// Format currency for display
export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount}`
}

// Format date for display
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-IN')
}

// Format time for display
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Format datetime for display
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-IN')
}

// Get status color for SOS requests
export function getSOSStatusColor(status: string): string {
  switch (status) {
    case 'sent': return 'bg-red-100 text-red-800'
    case 'in-progress': return 'bg-orange-100 text-orange-800'
    case 'rescued': return 'bg-green-100 text-green-800'
    case 'cancelled': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Get priority color for hazards
export function getHazardPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800'
    case 'high': return 'bg-orange-100 text-orange-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'low': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}