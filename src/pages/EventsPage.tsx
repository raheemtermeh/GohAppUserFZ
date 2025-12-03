import { useState, useEffect } from 'react'
import { useSearchParams, NavLink } from 'react-router-dom'
import { useStore, useUnfilteredEvents } from '../state/apiStore'
import EventCard from '../components/EventCard'
import FilterChip from '../components/FilterChip'
import Icon from '../components/Icon'
import BackButton from '../components/BackButton'
import { useLanguage } from '../contexts/LanguageContext'
import { formatPersianNumber } from '../utils/persianNumbers'
import { filterEventsWithOpenTicketSales, filterEventsNotSoldOut } from '../utils/eventStatusUpdater'

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in km
}

export default function EventsPage() {
  const [searchParams] = useSearchParams()
  const { state, dispatch } = useStore()
  const { t, isRTL } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'near-you' | 'last-second' | 'expensive' | 'cheap'>('near-you')
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  
  const categoryId = searchParams.get('category')
  const filterType = searchParams.get('filter')
  const searchParam = searchParams.get('search')
  const sortParam = searchParams.get('sort')
  const category = categoryId ? (state.eventCategories || []).find(cat => cat.id === categoryId) : null
  
  // Initialize search query from URL parameter
  useEffect(() => {
    if (searchParam) {
      setSearchQuery(searchParam)
    }
  }, [searchParam])

  // Initialize sort from URL parameter
  useEffect(() => {
    if (sortParam && ['near-you', 'last-second', 'expensive', 'cheap'].includes(sortParam)) {
      setSortBy(sortParam as 'near-you' | 'last-second' | 'expensive' | 'cheap')
    }
  }, [sortParam])

  // Get user location for "Near you" sorting
  useEffect(() => {
    if (navigator.geolocation && sortBy === 'near-you' && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (error) => {
          console.log('Geolocation error:', error)
          // Default to Tehran if geolocation fails
          setUserLocation({ lat: 35.6892, lon: 51.3890 })
        }
      )
    }
  }, [sortBy, userLocation])

  // Filter events based on URL parameters
  const allEvents = useUnfilteredEvents()
  const filteredEvents = allEvents.filter(event => {
    if (!event) return false
    
    // Filter out past events (completed and cancelled) unless specifically viewing past events
    if (filterType !== 'past' && (event.event_status === 'completed' || event.event_status === 'cancelled')) {
      return false
    }
    
    // For past events filter, only show completed and cancelled events
    if (filterType === 'past' && event.event_status !== 'completed' && event.event_status !== 'cancelled') {
      return false
    }
    
    if (categoryId && event.category.id !== categoryId) return false
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase()
      const matches = (
        event.name?.toLowerCase().includes(searchTerm) ||
        event.social_hub?.name?.toLowerCase().includes(searchTerm) ||
        event.category?.name?.toLowerCase().includes(searchTerm)
      )
      if (!matches) return false
    }
    
    // Handle near-time filter
    if (filterType === 'near-time') {
      if (!event.start_time) return false
      const eventDate = new Date(event.start_time)
      const now = new Date()
      const timeDiff = eventDate.getTime() - now.getTime()
      // Show events happening within next 7 days (exclude past events)
      return timeDiff > 0 && timeDiff <= 7 * 24 * 60 * 60 * 1000
    }
    
    return true
  })

  // Filter out events with closed ticket sales and sold-out events (only for non-past events)
  const eventsWithOpenTicketSales = filterType === 'past' 
    ? filteredEvents 
    : filterEventsWithOpenTicketSales(filteredEvents)
  
  const eventsNotSoldOut = filterType === 'past' 
    ? eventsWithOpenTicketSales 
    : filterEventsNotSoldOut(eventsWithOpenTicketSales)

  // Sort and filter events based on sort option
  let eventsToSort = [...eventsNotSoldOut]
  
  // For "Last second offers", filter events happening soon (within next 7 days)
  if (sortBy === 'last-second') {
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    eventsToSort = eventsToSort.filter(event => {
      if (!event.start_time) return false
      const eventDate = new Date(event.start_time)
      return eventDate > now && eventDate <= sevenDaysFromNow
    })
  }

  // Sort events
  const sortedEvents = eventsToSort.sort((a, b) => {
    switch (sortBy) {
      case 'near-you':
        if (!userLocation) {
          // If no location, sort by date as fallback
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        }
        const aLat = a.social_hub?.latitude
        const aLon = a.social_hub?.longitude
        const bLat = b.social_hub?.latitude
        const bLon = b.social_hub?.longitude
        
        if (!aLat || !aLon) return 1 // Events without location go to end
        if (!bLat || !bLon) return -1
        
        const distanceA = calculateDistance(userLocation.lat, userLocation.lon, aLat, aLon)
        const distanceB = calculateDistance(userLocation.lat, userLocation.lon, bLat, bLon)
        return distanceA - distanceB
        
      case 'last-second':
        // Sort by start time (soonest first)
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        
      case 'expensive':
        // Sort by price descending
        return b.price - a.price
        
      case 'cheap':
        // Sort by price ascending
        return a.price - b.price
        
      default:
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    }
  })

  // Clear category filter when component unmounts
  useEffect(() => {
    return () => {
      if (categoryId) {
        dispatch({ type: 'clear_filters' })
      }
    }
  }, [categoryId, dispatch])

  return (
    <div className={`space-y-6 md:space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <BackButton fallbackPath="/" />
        <div>
          <h1 className="text-responsive-2xl sm:text-responsive-3xl font-bold text-gradient">
            {filterType === 'near-time' 
              ? t('common.lastSecondOffers')
              : category 
                ? t('pages.events.categoryTitle').replace('{category}', category.name) 
                : t('pages.events.title')
            }
          </h1>
          {filterType === 'near-time' && (
            <p className="text-responsive-sm text-slate-400 mt-1">
              {t('pages.lastSecondOffers.subtitle')}
            </p>
          )}
          {category && !filterType && (
            <p className="text-responsive-sm text-slate-400 mt-1">
              {category.description || ''}
            </p>
          )}
        </div>
      </div>

      {/* Search and Sort */}
      <div className="card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Icon name="search" className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                placeholder={t('pages.events.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
              />
            </div>
          </div>
          
        </div>
      </div>

      {/* Events Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-responsive-lg font-semibold">
            {sortedEvents.length === 1 
              ? t('pages.events.eventFound').replace('{count}', formatPersianNumber(sortedEvents.length))
              : t('pages.events.eventsFound').replace('{count}', formatPersianNumber(sortedEvents.length))
            }
          </h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'near-you' | 'last-second' | 'expensive' | 'cheap')}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
          >
            <option value="near-you">{t('pages.events.sortNearYou')}</option>
            <option value="last-second">{t('pages.events.sortLastSecond')}</option>
            <option value="expensive">{t('pages.events.sortExpensive')}</option>
            <option value="cheap">{t('pages.events.sortCheap')}</option>
          </select>
        </div>

        {sortedEvents.length === 0 ? (
          <div className="card p-8 text-center">
            <Icon name="calendar" className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">{t('pages.events.noEventsFound')}</h3>
            <p className="text-slate-500 mb-4">
              {searchQuery ? t('pages.events.tryAdjustingSearch') : t('pages.events.noEventsMessage')}
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                dispatch({ type: 'clear_filters' })
              }}
              className="btn-primary"
            >
              {t('pages.events.clearAllFilters')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map(event => (
              <EventCard key={event.id} e={event} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

