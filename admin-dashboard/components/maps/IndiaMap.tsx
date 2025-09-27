'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface IndiaMapProps {
  sosData: any[] // Change to actual SOS array instead of state counts
  safeHouses?: any[]
  hazards?: any[]
}

export default function IndiaMap({ sosData, safeHouses, hazards }: IndiaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: 'weekly',
        libraries: ['places']
      })

      try {
        await loader.load()
        
        if (mapRef.current) {
          const mapInstance = new google.maps.Map(mapRef.current, {
            center: { lat: 20.5937, lng: 78.9629 }, // Center of India
            zoom: 5,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [
              {
                featureType: 'administrative',
                elementType: 'geometry',
                stylers: [{ visibility: 'off' }]
              },
              {
                featureType: 'poi',
                stylers: [{ visibility: 'off' }]
              }
            ]
          })

          setMap(mapInstance)
          setIsLoaded(true)
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error)
      }
    }

    initMap()
  }, [])

  useEffect(() => {
    if (!map || !isLoaded) return

    // Clear existing markers
    
    // Add individual SOS markers using REAL coordinates from database
    if (sosData && Array.isArray(sosData)) {
      sosData
        .filter(sos => sos.status === 'sent' || sos.status === 'in-progress') // Only active SOS
        .forEach((sos, index) => {
          if (sos.location?.latitude && sos.location?.longitude) {
            const sosMarker = new google.maps.Marker({
              position: { 
                lat: sos.location.latitude, 
                lng: sos.location.longitude 
              },
              map: map,
              title: `SOS - ${sos.digiPin}`,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6, // Smaller size
                fillColor: sos.status === 'sent' ? '#ef4444' : '#f97316',
                fillOpacity: 0.9,
                strokeColor: sos.status === 'sent' ? '#dc2626' : '#ea580c',
                strokeWeight: 1,
              }
            })

            const sosInfo = new google.maps.InfoWindow({
              content: `
                <div class="p-2">
                  <h4 class="font-bold text-red-600 text-sm">🆘 Emergency</h4>
                  <p class="text-xs"><strong>ID:</strong> ${sos.digiPin}</p>
                  <p class="text-xs"><strong>Status:</strong> ${sos.status}</p>
                  <p class="text-xs"><strong>Time:</strong> ${new Date(sos._creationTime).toLocaleTimeString()}</p>
                </div>
              `
            })

            sosMarker.addListener('click', () => {
              sosInfo.open(map, sosMarker)
            })
          }
        })
    }

    // Add Safe House markers using REAL coordinates from database
    if (safeHouses && Array.isArray(safeHouses)) {
      safeHouses.forEach((safeHouse) => {
        if (safeHouse.location?.latitude && safeHouse.location?.longitude) {
          const occupancyRate = (safeHouse.currentOccupancy / safeHouse.capacity) * 100
          
          const safeHouseMarker = new google.maps.Marker({
            position: { 
              lat: safeHouse.location.latitude, 
              lng: safeHouse.location.longitude 
            },
            map: map,
            title: safeHouse.name,
            icon: {
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 8, // Smaller size
              fillColor: occupancyRate > 80 ? '#ef4444' : occupancyRate > 60 ? '#f59e0b' : '#22c55e',
              fillOpacity: 1,
              strokeColor: occupancyRate > 80 ? '#dc2626' : occupancyRate > 60 ? '#d97706' : '#16a34a',
              strokeWeight: 1,
              rotation: 180
            }
          })

          const safeHouseInfo = new google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h4 class="font-bold text-green-600 text-sm">🏠 ${safeHouse.name}</h4>
                <p class="text-xs"><strong>Capacity:</strong> ${safeHouse.currentOccupancy || 0}/${safeHouse.capacity}</p>
                <p class="text-xs"><strong>Status:</strong> ${safeHouse.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            `
          })

          safeHouseMarker.addListener('click', () => {
            safeHouseInfo.open(map, safeHouseMarker)
          })
        }
      })
    }

    // Add Hazard markers using REAL coordinates from database
    if (hazards && Array.isArray(hazards)) {
      hazards
        .filter(hazard => 
          hazard.status === 'pending' || 
          hazard.status === 'ml-verified' || 
          hazard.status === 'human-verified' || 
          hazard.status === 'assigned' || 
          hazard.status === 'in-progress'
        )
        .forEach((hazard) => {
          if (hazard.location?.latitude && hazard.location?.longitude) {
            const hazardMarker = new google.maps.Marker({
              position: { 
                lat: hazard.location.latitude, 
                lng: hazard.location.longitude 
              },
              map: map,
              title: hazard.title,
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: hazard.priority === 'critical' ? 8 : 6, // Smaller sizes
                fillColor: hazard.priority === 'critical' ? '#dc2626' : 
                          hazard.priority === 'high' ? '#f59e0b' : 
                          hazard.priority === 'medium' ? '#eab308' : '#22c55e',
                fillOpacity: 1,
                strokeColor: hazard.priority === 'critical' ? '#991b1b' : 
                            hazard.priority === 'high' ? '#d97706' : 
                            hazard.priority === 'medium' ? '#ca8a04' : '#16a34a',
                strokeWeight: 1,
              }
            })

            const hazardInfo = new google.maps.InfoWindow({
              content: `
                <div class="p-2">
                  <h4 class="font-bold text-orange-600 text-sm">⚠️ ${hazard.title}</h4>
                  <p class="text-xs"><strong>Priority:</strong> ${hazard.priority}</p>
                  <p class="text-xs"><strong>Status:</strong> ${hazard.status}</p>
                </div>
              `
            })

            hazardMarker.addListener('click', () => {
              hazardInfo.open(map, hazardMarker)
            })
          }
        })
    }
  }, [map, isLoaded, sosData, safeHouses, hazards])

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-96 rounded-lg" />
      
      {/* Compact Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border">
        <h4 className="font-semibold text-sm mb-2">Map Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Emergency SOS</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-0 h-0 border-l-1 border-r-1 border-b-3 border-l-transparent border-r-transparent border-b-green-500"></div>
            <span>Safe House</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-0 h-0 border-l-1 border-r-1 border-b-3 border-l-transparent border-r-transparent border-b-orange-500"></div>
            <span>Hazard</span>
          </div>
        </div>
      </div>

      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}