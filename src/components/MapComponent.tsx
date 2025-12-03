import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLanguage } from '../contexts/LanguageContext'
import { SocialHub } from '../services/api'
import { formatPersianNumber } from '../utils/persianNumbers'
import Icon from './Icon'
import { handleImageErrorWithRetry } from '../utils/imageRetry'

// Fix for default markers in react-leaflet with error handling
try {
  if (L && L.Icon && L.Icon.Default) {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })
  }
} catch (error) {
  console.error('Error initializing Leaflet icons:', error)
}

// Custom marker icon for social hubs with error handling
const createCustomIcon = (color: string = '#3B82F6', isFavorite: boolean = false) => {
  try {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: ${isFavorite ? '35px' : '30px'};
          height: ${isFavorite ? '35px' : '30px'};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: ${isFavorite ? '4px' : '3px'} solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: ${isFavorite ? '16px' : '14px'};
            font-weight: bold;
          ">${isFavorite ? '❤️' : ''}</div>
        </div>
      `,
      iconSize: [isFavorite ? 35 : 30, isFavorite ? 35 : 30],
      iconAnchor: [isFavorite ? 17.5 : 15, isFavorite ? 35 : 30],
      popupAnchor: [0, isFavorite ? -35 : -30]
    })
  } catch (error) {
    console.error('Error creating custom icon:', error)
    // Fallback to default icon
    return undefined
  }
}

interface Venue {
  id: string | number
  name: string
  address: string
  latitude: number
  longitude: number
  rating?: number
  category?: string
}

interface MapComponentProps {
  venues?: Venue[]
  socialHubs?: SocialHub[]
  center?: [number, number]
  zoom?: number
  height?: string
  showVenues?: boolean
  onViewDetails?: (hubId: string) => void
  favorites?: string[] // Array of favorite venue IDs
}

// Component to handle map updates
function MapUpdater({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap()
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13)
    }
  }, [center, zoom, map])
  
  return null
}

// Error boundary for map component with retry limit
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; retryCount: number }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, retryCount: 0 }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Map component error:', error, errorInfo)
    
    // Check if it's a Leaflet-specific error
    if (error.message && (
      error.message.includes('createIcon') || 
      error.message.includes('_leaflet_events') ||
      error.message.includes('Cannot read properties of undefined')
    )) {
      console.warn('Leaflet error detected, this may be due to React Leaflet compatibility issues')
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < 3) {
      this.setState({ hasError: false, retryCount: this.state.retryCount + 1 })
    } else {
      // After 3 retries, show fallback permanently
      this.setState({ hasError: true, retryCount: 3 })
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.retryCount >= 3) {
        return this.props.fallback || (
          <div className="w-full bg-slate-800 rounded-lg flex items-center justify-center text-slate-400" style={{ height: '400px' }}>
            <div className="text-center">
              <p>Map unavailable - Please refresh the page</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      }
      
      return this.props.fallback || (
        <div className="w-full bg-slate-800 rounded-lg flex items-center justify-center text-slate-400" style={{ height: '400px' }}>
          <div className="text-center">
            <p>Map temporarily unavailable</p>
            <button 
              onClick={this.handleRetry}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry ({this.state.retryCount}/3)
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const MapComponent: React.FC<MapComponentProps> = ({
  venues = [],
  socialHubs = [],
  center = [35.6892, 51.3890], // Default to Tehran, Iran
  zoom = 13,
  height = '400px',
  showVenues = true,
  onViewDetails,
  favorites = []
}) => {
  const { t } = useLanguage()
  const [isClient, setIsClient] = useState(false)
  const [mapKey, setMapKey] = useState(0)
  const mapRef = useRef<any>(null)

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup any pending operations
      if (typeof window !== 'undefined') {
        // Remove any global event listeners if needed
        window.removeEventListener('resize', () => {})
      }
    }
  }, [])

  // Reset map only when social hubs change significantly
  useEffect(() => {
    if (socialHubs.length > 0) {
      setMapKey(prev => prev + 1)
    }
  }, [socialHubs.length])

  // Memoize the map key to prevent unnecessary re-renders
  // Only include center coordinates, not zoom to prevent zoom reset issues
  const stableMapKey = useMemo(() => `map-${mapKey}-${center[0]}-${center[1]}`, [mapKey, center])

  // Sample venues data if none provided
  const sampleVenues: Venue[] = venues.length > 0 ? venues : [
    {
      id: 1,
      name: t('common.gaming'),
      address: 'Tehran, Iran',
      latitude: 35.6892,
      longitude: 51.3890,
      rating: 4.5,
      category: 'gaming'
    },
    {
      id: 2,
      name: t('common.cafe'),
      address: 'Tehran, Iran',
      latitude: 35.7000,
      longitude: 51.4000,
      rating: 4.2,
      category: 'cafe'
    },
    {
      id: 3,
      name: t('common.restaurant'),
      address: 'Tehran, Iran',
      latitude: 35.6800,
      longitude: 51.3800,
      rating: 4.8,
      category: 'restaurant'
    }
  ]

  // Convert social hubs to venue format for display
  const socialHubVenues: Venue[] = socialHubs
    .filter(hub => hub.latitude && hub.longitude && hub.id)
    .map((hub, index) => ({
      id: hub.id, // Use the original string ID instead of parsing
      name: hub.name,
      address: hub.address,
      latitude: hub.latitude!,
      longitude: hub.longitude!,
      rating: hub.average_rating,
      category: 'venue'
    }))

  console.log('MapComponent - Social hubs:', socialHubs.length)
  console.log('MapComponent - Converted venues:', socialHubVenues.length)

  // Use social hubs if available, otherwise use sample venues
  const displayVenues = socialHubVenues.length > 0 ? socialHubVenues : sampleVenues
  
  console.log('MapComponent - Final display venues:', displayVenues.length)

  if (!isClient) {
    return (
      <div 
        className="w-full bg-slate-800 rounded-lg flex items-center justify-center text-slate-400"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // Simple fallback map using iframe for OpenStreetMap
  const renderFallbackMap = () => (
    <div className="w-full rounded-lg overflow-hidden" style={{ height }}>
      <iframe
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${center[1]-0.01},${center[0]-0.01},${center[1]+0.01},${center[0]+0.01}&layer=mapnik&marker=${center[0]},${center[1]}`}
        width="100%"
        height="100%"
        style={{ border: 'none' }}
        title="Map"
      />
    </div>
  )

  return (
    <MapErrorBoundary fallback={renderFallbackMap()}>
      <div className="w-full h-full rounded-lg overflow-hidden" style={{ height }}>
        <MapContainer
          key={stableMapKey}
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%', minHeight: '300px' }}
          className="z-0"
          ref={mapRef}
        >
        <MapUpdater center={center} zoom={zoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {showVenues && displayVenues.map((venue, index) => {
          console.log('Rendering marker for venue:', venue.name, 'at', [venue.latitude, venue.longitude])
          
          // Find the corresponding social hub for enhanced functionality
          const socialHub = socialHubs.find(hub => hub.id === venue.id)
          const isFavorite = favorites.includes(venue.id.toString())
          
          // Create stable key for marker that includes map key to force recreation
          // Use index as fallback to ensure uniqueness
          const markerKey = `marker-${mapKey}-${venue.id || index}-${venue.latitude}-${venue.longitude}-${index}`
          
          // Create custom icon for favorites (red) or regular venues (blue)
          const customIcon = createCustomIcon(
            isFavorite ? '#EF4444' : '#3B82F6', // Red for favorites, blue for regular
            isFavorite
          )
          
          return (
            <Marker
              key={markerKey}
              position={[venue.latitude, venue.longitude]}
              icon={customIcon}
            >
              <Popup>
                <div className="p-0 min-w-[280px] max-w-[320px]">
                  {/* Image Header */}
                  {socialHub && (socialHub.image_url || (socialHub as any).gallery_images?.[0]) ? (
                    <div className="w-full h-32 overflow-hidden rounded-t-lg">
                      <img
                        src={socialHub.image_url || (socialHub as any).gallery_images?.[0] || '/placeholder-venue.jpg'}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                        data-original-src={socialHub.image_url || (socialHub as any).gallery_images?.[0] || '/placeholder-venue.jpg'}
                        onError={(e) => {
                          // Try 2 times, then hide image if still failing
                          handleImageErrorWithRetry(e, 2, 500)
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                      <Icon name="map-pin" className="w-12 h-12 text-white opacity-80" />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-4 bg-white">
                    <h3 className="font-bold text-lg text-slate-900 mb-2 leading-tight">
                      {venue.name}
                    </h3>
                    
                    <div className="flex items-start gap-2 mb-3">
                      <Icon name="map-pin" className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {venue.address}
                      </p>
                    </div>
                    
                    {/* Rating */}
                    {venue.rating && (
                      <div className="flex items-center gap-1.5 mb-4 pb-3 border-b border-slate-200">
                        <span className="text-yellow-500 text-lg">⭐</span>
                        <span className="text-sm font-semibold text-slate-700">
                          {formatPersianNumber(venue.rating.toFixed(1))}
                        </span>
                        <span className="text-xs text-slate-500">/5</span>
                      </div>
                    )}
                    
                    {/* View Details Button */}
                    {socialHub && onViewDetails ? (
                      <button
                        onClick={() => onViewDetails(socialHub.id)}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {t('common.viewDetails')}
                      </button>
                    ) : (
                      <button 
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {t('common.viewDetails')}
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
        </MapContainer>
      </div>
    </MapErrorBoundary>
  )
}

export default MapComponent

