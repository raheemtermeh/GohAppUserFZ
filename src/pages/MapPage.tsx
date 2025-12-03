import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { SocialHub } from '../services/api'
import { useSocialHubsMap } from '../hooks/useSocialHubsMap'
import { useStore } from '../state/apiStore'
import MapComponent from '../components/MapComponent'
import Icon from '../components/Icon'
import BackButton from '../components/BackButton'
import { formatPersianNumber } from '../utils/persianNumbers'

interface MapPageProps {
  className?: string
}

export default function MapPage({ className = '' }: MapPageProps) {
  const { t, isRTL } = useLanguage()
  const navigate = useNavigate()
  const { state } = useStore()
  
  const { socialHubs, loading, error, refetch } = useSocialHubsMap()
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.6892, 51.3890]) // Default to Tehran
  const [mapZoom, setMapZoom] = useState(13)
  const [isClient, setIsClient] = useState(false)

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Center map on social hubs when they load
  useEffect(() => {
    console.log('Social hubs loaded:', socialHubs.length, socialHubs)
    if (socialHubs.length > 0) {
      const validHubs = socialHubs.filter(hub => hub.latitude && hub.longitude)
      console.log('Valid hubs with coordinates:', validHubs.length, validHubs)
      
      if (validHubs.length > 0) {
        const lats = validHubs.map(hub => hub.latitude!)
        const lngs = validHubs.map(hub => hub.longitude!)
        const avgLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length
        const avgLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length
        console.log('Setting map center to:', [avgLat, avgLng])
        setMapCenter([avgLat, avgLng])
      }
    }
  }, [socialHubs])

  const handleLocationFound = useCallback((lat: number, lng: number) => {
    setUserLocation([lat, lng])
    setMapCenter([lat, lng])
    setMapZoom(15)
  }, [])


  const handleViewDetails = useCallback((hubId: string) => {
    navigate(`/venue/${hubId}`)
  }, [navigate])

  // Refresh event counts when venues are refetched
  const handleRefetch = useCallback(async () => {
    await refetch()
  }, [refetch])

  const handleCenterOnUser = useCallback(() => {
    if (userLocation) {
      setMapCenter(userLocation)
      setMapZoom(15)
    } else {
      // Request location again
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            setUserLocation([latitude, longitude])
            setMapCenter([latitude, longitude])
            setMapZoom(15)
          },
          (error) => {
            console.warn('Geolocation error:', error)
          }
        )
      }
    }
  }, [userLocation])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-slate-900 ${className}`}>
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <BackButton />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                {t('common.mapView')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 truncate">
                {t('common.exploreVenuesOnMap')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={handleCenterOnUser}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title={t('common.currentLocation')}
            >
              <Icon name="location" className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <button
              onClick={handleRefetch}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              title="Refresh venues"
            >
              <Icon name="map" className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full">
        {loading ? (
          <div className="h-[calc(100vh-70px)] sm:h-[calc(100vh-80px)] bg-slate-800 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">{t('common.mapLoading')}</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-[calc(100vh-70px)] sm:h-[calc(100vh-80px)] bg-slate-800 flex items-center justify-center">
            <div className="text-center">
              <Icon name="map" className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="h-[calc(100vh-70px)] sm:h-[calc(100vh-80px)] w-full">
            <MapComponent
              socialHubs={socialHubs}
              center={mapCenter}
              zoom={mapZoom}
              height="100%"
              showVenues={true}
              onViewDetails={handleViewDetails}
              favorites={state.favorites}
            />
          </div>
        )}
      </div>


    </div>
  )
}