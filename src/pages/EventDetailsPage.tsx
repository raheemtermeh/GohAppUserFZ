import { NavLink, useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../state/apiStore'
import { events } from '../data/events'
import Icon from '../components/Icon'
import BackButton from '../components/BackButton'
import MapComponent from '../components/MapComponent'
import { useLanguage } from '../contexts/LanguageContext'
import { formatPersianCurrency, formatPersianNumber, formatPersianTimeRange, formatNumber, formatCurrency, formatDate, formatTimeRange, formatTimeRange24 } from '../utils/persianNumbers'
import { formatEventDate } from '../utils/solarHijriCalendar'
import { handleImageErrorWithRetry } from '../utils/imageRetry'
import { useState, useEffect } from 'react'
import { apiClient } from '../services/apiClient'

// Helper function to format time range in 24-hour format
function formatTimeRangeHelper(startTime: string, endTime: string, language: Language): string {
  try {
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    // Extract time parts from ISO strings
    const startTimeStr = start.toTimeString().slice(0, 5) // HH:MM format
    const endTimeStr = end.toTimeString().slice(0, 5) // HH:MM format
    
    return formatTimeRange24(startTimeStr, endTimeStr, language)
  } catch (error) {
    console.error('Error formatting time range:', error)
    return startTime // fallback to original time
  }
}

// Interface for better typing - extends the Event interface
interface EventData {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  start_time: string;
  end_time: string;
  price: number;
  capacity: number;
  reservations_count: number;
  spots_left?: number;
  event_status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  category: { id: string; name: string; description?: string; image_url?: string };
  social_hub: {
    id: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    image_url?: string;
    description?: string;
    average_rating?: number;
    events_count: number;
    amenities: string[];
    owner: {
      id: string;
      f_name: string;
      l_name: string;
      name?: string;
      email: string;
      mobile_number: number;
      national_code?: number;
      username?: string;
      address?: string;
      role_name: string;
      balance: number;
      is_active: boolean;
      created_at: string;
    };
  };
  requirements?: string[];
  average_rating?: number;
  ratings_count: number;
  MS?: number; // minimum_group_size - make optional
  minimum_group_size?: number;
  minimum_seats_progress?: {
    currently_reserved: number;
    minimum_required: number;
    remaining_needed: number;
    progress_percentage: number;
    meets_requirement: boolean;
  };
  total_reserved_people: number;
  // Add missing properties from Event interface
  time: string;
  date: string;
  minimum: number;
}

export default function EventDetailsPage() {
  const { id } = useParams()
  const { state, dispatch } = useStore()
  const { t, isRTL, language } = useLanguage()
  const navigate = useNavigate()
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [peopleCount, setPeopleCount] = useState(1)
  const [isReserving, setIsReserving] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showTicketPreview, setShowTicketPreview] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'photos'>('details')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showFullScreenPhoto, setShowFullScreenPhoto] = useState(false)
  
  // Fullscreen photo navigation handlers
  const openFullScreenPhoto = (index: number) => {
    setSelectedImageIndex(index)
    setShowFullScreenPhoto(true)
  }
  const closeFullScreenPhoto = () => setShowFullScreenPhoto(false)
  const showNextPhoto = () => {
    if (eventImages.length === 0) return
    setSelectedImageIndex((prev) => (prev + 1) % eventImages.length)
  }
  const showPrevPhoto = () => {
    if (eventImages.length === 0) return
    setSelectedImageIndex((prev) => (prev - 1 + eventImages.length) % eventImages.length)
  }
  
  // Get event images from the API response
  const getEventImages = () => {
    if (!eventData) return []
    
    const images = []
    
    // Add main image first if available
    if (eventData.image_url) {
      images.push(eventData.image_url)
    }
    
    // Add gallery images, filtering out duplicates (including the main image if it's in gallery)
    if (eventData.gallery_image_urls && Array.isArray(eventData.gallery_image_urls)) {
      const uniqueGalleryImages = eventData.gallery_image_urls.filter(
        (url: string) => url && !images.includes(url)
      )
      images.push(...uniqueGalleryImages)
    }
    
    // If no images, use placeholder
    if (images.length === 0) {
      return ['/placeholder-event.jpg']
    }
    
    return images
  }
  
  const eventImages = getEventImages()
  
  // Keyboard controls for fullscreen viewer (after eventImages is defined)
  useEffect(() => {
    if (!showFullScreenPhoto) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeFullScreenPhoto()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        showNextPhoto()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        showPrevPhoto()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showFullScreenPhoto, eventImages.length])
  
  const getEventStatusTranslation = (status: string) => {
    switch (status) {
      case 'upcoming':
        return t('common.upcoming')
      case 'incoming':
        return t('common.incoming')
      case 'ongoing':
        return t('common.ongoing')
      case 'completed':
        return t('common.completed')
      case 'cancelled':
        return t('common.cancelled')
      default:
        return status
    }
  }

  const handleIncrement = () => {
    if (!eventData) return;
    const maxPeople = eventData.capacity - (eventData.total_reserved_people || 0)
    if (peopleCount < maxPeople) {
      setPeopleCount(peopleCount + 1)
    }
  }

  const handleDecrement = () => {
    if (!eventData) return;
    const minimumTickets = eventData.minimum_group_size || 1
    if (peopleCount > minimumTickets) {
      setPeopleCount(peopleCount - 1)
    }
  }

  const handleTicketPreview = () => {
    if (!state.auth.user) {
      // Store the current URL for redirect after login
      const currentUrl = `/event/${id}`
      dispatch({ type: 'set_redirect_url', url: currentUrl })
      navigate('/login')
      return
    }
    setShowTicketPreview(true)
  }

  const handleDirectReserve = async () => {
    if (!state.auth.user || !eventData) {
      // Store the current URL for redirect after login
      const currentUrl = `/event/${id}`
      dispatch({ type: 'set_redirect_url', url: currentUrl })
      navigate('/login')
      return
    }

    setIsReserving(true)
    
    try {
      // Create reservation via API
      const reservationData = {
        event: eventData.id,
        customer: state.auth.user.id,
        number_of_people: peopleCount,
        total_amount: eventData.price * peopleCount,
        status: 'confirmed' as const,
        reservation_date: new Date().toISOString()
      }
      
      const newReservation = await apiClient.post('reservations/', reservationData)
      
      // Update local state with confirmed status
      dispatch({
        type: 'reserve',
        eventId: eventData.id,
        customerId: state.auth.user.id,
        numberOfPeople: peopleCount,
        status: 'confirmed'
      })
      
      setShowTicketPreview(false)
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Failed to create reservation:', error)
      alert(`Failed to create reservation: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      setIsReserving(false)
    }
  }

  const handlePendingReservation = () => {
    if (!state.auth.user || !eventData) {
      // Store the current URL for redirect after login
      const currentUrl = `/event/${id}`
      dispatch({ type: 'set_redirect_url', url: currentUrl })
      navigate('/login')
      return
    }

    // Add to cart with pending status
    dispatch({
      type: 'add_to_cart',
      event: eventData,
      numberOfPeople: peopleCount,
      status: 'pending'
    })
    
    setShowTicketPreview(false)
    
    // Show success message
    dispatch({
      type: 'show_notification',
      message: t('pages.reservation.addedToCartPending'),
      notificationType: 'success'
    })
  }

  // Fetch event data from API
  useEffect(() => {
    const fetchEventData = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Try to get from API first
        const data = await apiClient.get(`events/${id}/`) as EventData
        setEventData(data)
      } catch (err) {
        console.error('Failed to fetch event data:', err)
        setError('Failed to load event data')
        
        // Fallback to existing data
        const fallbackEvent = state.events.find(x => x.id === id) || events.find(x => x.id === id)
        if (fallbackEvent) {
          setEventData(fallbackEvent as unknown as EventData)
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchEventData()
  }, [id, state.events])
  
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }
  
  if (!eventData) {
    return (
      <div className={`text-center p-8 ${isRTL ? 'rtl' : 'ltr'}`}>
        <Icon name="close" className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-400 mb-2">{t('common.eventNotFound')}</h2>
        <p className="text-slate-500 mb-4">{error || 'Event could not be found'}</p>
        <NavLink to="/" className="btn-primary">
          {t('common.goHome')}
        </NavLink>
      </div>
    )
  }
  
  return (
    <div className={`space-responsive-compact ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Hero Image Section */}
      <div className="relative rounded-2xl overflow-hidden">
        <img 
          src={eventData.image_url || eventData.social_hub.image_url || '/placeholder-event.jpg'} 
          alt={eventData.name} 
          className="w-full h-48 sm:h-56 md:h-64 lg:h-80 object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"/>
        <div className={`absolute top-4 sm:top-6 ${isRTL ? 'right-4 sm:right-6' : 'left-4 sm:left-6'}`}>
          <BackButton fallbackPath="/" />
        </div>
        <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
            <div className="space-y-2">
              <div className="chip text-xs sm:text-sm bg-purple-500/20 border-purple-500/30 text-purple-300">
                {t(`common.categoryNames.${eventData.category.name}`) || eventData.category.name}
              </div>
              <h1 className="text-responsive-2xl sm:text-responsive-3xl font-bold text-white drop-shadow-lg">
                {eventData.name}
              </h1>
            </div>
            <span className="chip text-xs sm:text-sm bg-gradient-to-r from-purple-500 to-teal-500 text-white border-transparent shadow-glow">
              {getEventStatusTranslation(eventData.event_status)}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'details'
              ? 'bg-gradient-to-r from-purple-500 to-teal-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          {t('common.eventDetails')}
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'photos'
              ? 'bg-gradient-to-r from-purple-500 to-teal-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          {t('common.photos')}
        </button>
      </div>

      {/* Event Details Card */}
      {activeTab === 'details' && (
        <>
          <div className="card-spacious space-y-4">
            <h2 className="text-responsive-xl font-semibold text-gradient">{t('common.eventDetails')}</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-800/40 rounded-xl">
            <span className="text-responsive-sm text-slate-400">{t('common.date')} {isRTL ? 'و' : '&'} {t('common.time')}</span>
            <span className="text-responsive-sm font-medium">
              {formatDate(eventData.start_time, language)} • {formatTimeRangeHelper(eventData.start_time, eventData.end_time, language)}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-800/40 rounded-xl">
            <span className="text-responsive-sm text-slate-400">{t('common.venue')}</span>
            <span className="text-responsive-sm font-medium">{eventData.social_hub.name}</span>
          </div>
          <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-800/40 rounded-xl">
            <span className="text-responsive-sm text-slate-400">{t('common.address')}</span>
            <span className={`text-responsive-sm font-medium ${isRTL ? 'text-left' : 'text-right'} max-w-[60%]`}>{eventData.social_hub.address}</span>
          </div>
          {/* Combined Spots Left & Minimum Seats Panel */}
          <div className="p-3 sm:p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-responsive-sm font-medium text-green-400">
                {t('common.availableSpots')}
              </span>
              <span className="text-responsive-sm font-bold text-green-400">
                {formatNumber(eventData.capacity - (eventData.total_reserved_people || 0), language)} {t('common.spotsLeft')}
              </span>
            </div>
            
            {/* Full-width progress panel representing available spots (100% = full capacity) */}
            <div className="relative w-full bg-slate-700 rounded-full h-8 mt-2 mb-6 overflow-visible">
              {(() => {
                const capacity = eventData.capacity
                const reserved = eventData.minimum_seats_progress?.currently_reserved || eventData.total_reserved_people || 0
                // Use minimum (حداقل ظرفیت) - minimum capacity threshold for event completion/cancellation
                const minimumCapacity = eventData.minimum || eventData.minimum_seats_progress?.minimum_required || 0
                const reservedPercentage = Math.min((reserved / capacity) * 100, 100)
                const minimumPercentage = Math.min((minimumCapacity / capacity) * 100, 100)
                
                return (
                  <>
                    {/* Reserved spots progress fill */}
                    <div 
                      className="absolute top-0 left-0 bg-gradient-to-r from-purple-500 to-teal-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${reservedPercentage}%` }}
                    ></div>
                    
                    {/* Minimum capacity requirement marker (yellow vertical line) */}
                    {minimumCapacity > 0 && (
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-yellow-400 z-10 transition-all duration-300 shadow-lg"
                        style={{ left: `calc(${minimumPercentage}% - 2px)` }}
                      >
                        {/* Yellow dot at top */}
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-slate-700 shadow-md"></div>
                        {/* Label below */}
                        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-[10px] text-yellow-400 font-bold whitespace-nowrap">
                          {formatNumber(minimumCapacity, language)}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
            
            {/* Information text below the panel */}
            <div className="flex items-center justify-between mt-2 text-xs">
              <div className="flex items-center gap-4">
                <span className="text-slate-300">
                  {eventData.minimum_seats_progress 
                    ? `${formatNumber(eventData.minimum_seats_progress.currently_reserved, language)}/${formatNumber(eventData.capacity, language)} ${t('common.reserved')}`
                    : `${formatNumber(eventData.total_reserved_people || 0, language)}/${formatNumber(eventData.capacity, language)} ${t('common.reserved')}`
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-yellow-400">{t('pages.reservation.minimumCapacity')}: {formatNumber(eventData.minimum || eventData.minimum_seats_progress?.minimum_required || 0, language)}</span>
                </div>
              </div>
            </div>
            
            {/* Status message */}
            {eventData.minimum_seats_progress && (
              <div className="text-xs mt-2">
                <span className={eventData.minimum_seats_progress.meets_requirement ? 'text-green-400' : 'text-yellow-400'}>
                  {eventData.minimum_seats_progress.remaining_needed > 0 
                    ? t('pages.reservation.needMoreSeats', { count: formatNumber(eventData.minimum_seats_progress.remaining_needed, language) })
                    : t('pages.reservation.minimumMet')
                  }
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-800/40 rounded-xl">
            <span className="text-responsive-sm text-slate-400">{t('common.price')}</span>
            <span className="text-responsive-lg font-bold text-green-400">
              {formatCurrency(eventData.price, language, t('common.currency'))}
            </span>
          </div>
          {eventData.average_rating && (
            <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-800/40 rounded-xl">
              <span className="text-responsive-sm text-slate-400">{t('common.rating')}</span>
              <div className="flex items-center gap-1">
                <Icon name="star" className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-responsive-sm font-medium">{formatNumber(eventData.average_rating, language, 1)} ({formatNumber(eventData.ratings_count, language)} {t('common.reviews')})</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="card-spacious">
        <h2 className="text-responsive-xl font-semibold text-gradient mb-4">{t('common.aboutThisEvent')}</h2>
        <p className="text-responsive-base text-slate-300 leading-relaxed">
          {eventData.description || t('common.noDescriptionAvailable')}
        </p>
      </div>

      {/* Venue Info */}
      <div className="card-spacious">
        <h2 className="text-responsive-xl font-semibold text-gradient mb-4">{t('common.venueInformation')}</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img 
              src={eventData.social_hub.image_url || eventData.social_hub.gallery_images?.[0] || '/placeholder-venue.jpg'} 
              className="w-12 h-12 rounded-lg object-cover" 
              alt={eventData.social_hub.name}
              data-original-src={eventData.social_hub.image_url || eventData.social_hub.gallery_images?.[0] || '/placeholder-venue.jpg'}
              onError={(e) => {
                // Try 2 times, then hide image if still failing
                handleImageErrorWithRetry(e, 2, 500)
              }}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-responsive-base">{eventData.social_hub.name}</h3>
              <p className="text-responsive-sm text-slate-400">{eventData.social_hub.address}</p>
            </div>
          </div>
          
          {/* Mini Map */}
          {eventData.social_hub.latitude && eventData.social_hub.longitude && (
            <div className="rounded-lg overflow-hidden">
              <MapComponent 
                venues={[{
                  id: eventData.social_hub.id,
                  name: eventData.social_hub.name,
                  address: eventData.social_hub.address,
                  latitude: eventData.social_hub.latitude,
                  longitude: eventData.social_hub.longitude,
                  rating: eventData.social_hub.average_rating,
                  category: 'venue'
                }]}
                center={[eventData.social_hub.latitude, eventData.social_hub.longitude]}
                zoom={15}
                height="150px"
                showVenues={true}
                favorites={state.favorites}
              />
            </div>
          )}
          
          {/* View Venue Button */}
          <button 
            onClick={() => navigate(`/venue/${eventData.social_hub.id}`)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-lg"
          >
            <Icon name="arrow-right" className="w-4 h-4" />
            <span>{t('common.viewDetails')}</span>
          </button>
          {eventData.social_hub.description && (
            <p className="text-responsive-sm text-slate-300">{eventData.social_hub.description}</p>
          )}
          <div className="flex items-center gap-4 text-responsive-sm text-slate-400">
            <div className="flex items-center gap-1">
              <Icon name="star" className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{eventData.social_hub.average_rating ? formatNumber(eventData.social_hub.average_rating, language, 1) : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="calendar" className="w-4 h-4 text-blue-400" />
              <span>{formatNumber(eventData.social_hub.events_count, language)} {t('common.events')}</span>
            </div>
          </div>
          
          {/* Venue Amenities */}
          {eventData.social_hub.amenities && eventData.social_hub.amenities.length > 0 && (
            <div className="pt-4 border-t border-slate-700/50">
              <h4 className="text-responsive-base font-semibold text-slate-300 mb-3">{t('pages.venueDetail.amenities')}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {eventData.social_hub.amenities.map((amenity: string, index: number) => {
                  const amenityMap: Record<string, { icon: string; name: string }> = {
                    'wifi': { icon: 'globe', name: t('pages.venueDetail.amenityLabels.wifi') },
                    'parking': { icon: 'location', name: t('pages.venueDetail.amenityLabels.parking') },
                    'foodService': { icon: 'coffee', name: t('pages.venueDetail.amenityLabels.foodService') },
                    'airConditioning': { icon: 'warning', name: t('pages.venueDetail.amenityLabels.airConditioning') },
                    'tvScreens': { icon: 'play', name: t('pages.venueDetail.amenityLabels.tvScreens') },
                    'bar': { icon: 'heart', name: t('pages.venueDetail.amenityLabels.bar') },
                    'gamingEquipment': { icon: 'play', name: t('pages.venueDetail.amenityLabels.gamingEquipment') },
                    'soundSystem': { icon: 'warning', name: t('pages.venueDetail.amenityLabels.soundSystem') },
                    'projector': { icon: 'play', name: t('pages.venueDetail.amenityLabels.projector') },
                    'kitchen': { icon: 'coffee', name: t('pages.venueDetail.amenityLabels.kitchen') },
                    'restrooms': { icon: 'user', name: t('pages.venueDetail.amenityLabels.restrooms') },
                    'security': { icon: 'warning', name: t('pages.venueDetail.amenityLabels.security') },
                    'outdoorSpace': { icon: 'location', name: t('pages.venueDetail.amenityLabels.outdoorSpace') },
                    'privateRooms': { icon: 'home', name: t('pages.venueDetail.amenityLabels.privateRooms') },
                    'wheelchairAccessible': { icon: 'user', name: t('pages.venueDetail.amenityLabels.wheelchairAccessible') },
                    'petFriendly': { icon: 'heart', name: t('pages.venueDetail.amenityLabels.petFriendly') },
                    'access24_7': { icon: 'clock', name: t('pages.venueDetail.amenityLabels.access24_7') },
                    'lockerStorage': { icon: 'cart', name: t('pages.venueDetail.amenityLabels.lockerStorage') },
                    'library': { icon: 'book', name: t('pages.venueDetail.amenityLabels.library') },
                    'smokingArea': { icon: 'smoking', name: t('pages.venueDetail.amenityLabels.smokingArea') }
                  }
                  
                  const amenityData = amenityMap[amenity] || { icon: 'check' as const, name: amenity }
                  
                  return (
                    <div key={index} className="flex items-center gap-2 p-2 bg-slate-800/40 rounded-lg">
                      <Icon name={amenityData.icon as any} className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span className="text-responsive-sm text-slate-300">{amenityData.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Requirements */}
      {eventData.requirements && eventData.requirements.length > 0 && (
        <div className="card-spacious">
          <h2 className="text-responsive-xl font-semibold text-gradient mb-4">{t('pages.eventRequirements.title')}</h2>
          <div className="space-y-2">
            {eventData.requirements.map((requirement: string, index: number) => {
              // Map common requirement strings to translation keys
              const getRequirementTranslation = (req: string) => {
                const requirementMap: Record<string, string> = {
                  'gamingSkills': t('pages.eventRequirements.gamingSkills'),
                  'registrationRequired': t('pages.eventRequirements.registrationRequired'),
                  'beginnerFriendly': t('pages.eventRequirements.beginnerFriendly'),
                  'reservationRecommended': t('pages.eventRequirements.reservationRecommended'),
                  'membershipRequired': t('pages.eventRequirements.membershipRequired'),
                  'ageRestriction': t('pages.eventRequirements.ageRestriction'),
                  'equipmentProvided': t('pages.eventRequirements.equipmentProvided'),
                  'teamRegistration': t('pages.eventRequirements.teamRegistration'),
                  'soloParticipation': t('pages.eventRequirements.soloParticipation'),
                  'menuPurchaseRequired': t('pages.eventRequirements.menuPurchaseRequired'),
                  'idRequired': t('pages.eventRequirements.idRequired'),
                  // English fallbacks
                  'Gaming Skills Required': t('pages.eventRequirements.gamingSkills'),
                  'Registration Required': t('pages.eventRequirements.registrationRequired'),
                  'Beginner Friendly': t('pages.eventRequirements.beginnerFriendly'),
                  'Reservation Recommended': t('pages.eventRequirements.reservationRecommended'),
                  'Membership Required': t('pages.eventRequirements.membershipRequired'),
                  'Age Restriction': t('pages.eventRequirements.ageRestriction'),
                  'Equipment Provided': t('pages.eventRequirements.equipmentProvided'),
                  'Team Registration': t('pages.eventRequirements.teamRegistration'),
                  'Solo Participation': t('pages.eventRequirements.soloParticipation'),
                  'Menu Purchase Required': t('pages.eventRequirements.menuPurchaseRequired'),
                  'ID Required': t('pages.eventRequirements.idRequired'),
                  // Persian fallbacks
                  'مهارت‌های بازی مورد نیاز': t('pages.eventRequirements.gamingSkills'),
                  'ثبت‌نام الزامی': t('pages.eventRequirements.registrationRequired'),
                  'مناسب برای مبتدیان': t('pages.eventRequirements.beginnerFriendly'),
                  'رزرو توصیه می‌شود': t('pages.eventRequirements.reservationRecommended'),
                  'عضویت الزامی است': t('pages.eventRequirements.membershipRequired'),
                  'محدودیت سنی': t('pages.eventRequirements.ageRestriction'),
                  'تجهیزات ارائه می‌شود': t('pages.eventRequirements.equipmentProvided'),
                  'ثبت‌نام تیمی': t('pages.eventRequirements.teamRegistration'),
                  'شرکت انفرادی': t('pages.eventRequirements.soloParticipation'),
                  'خرید از منو الزامی است': t('pages.eventRequirements.menuPurchaseRequired'),
                  'ارائه کارت شناسایی الزامی است': t('pages.eventRequirements.idRequired')
                }
                
                return requirementMap[req] || req
              }
              
              return (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl">
                  <Icon name="check" className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-responsive-sm text-slate-300">{getRequirementTranslation(requirement)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
        </>
      )}

      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <div className="space-y-4">
          <h3 className="text-responsive-lg font-semibold">{t('common.eventPhotos')}</h3>
          {eventImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {eventImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => openFullScreenPhoto(index)}
                  className="aspect-square rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200"
                >
                  <img 
                    src={image} 
                    className="w-full h-full object-cover" 
                    alt={`Event photo ${index + 1}`}
                    onError={(e) => {
                      // Handle broken images
                      e.currentTarget.src = '/placeholder-event.jpg'
                    }}
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-slate-400 mb-2">
                <Icon name="image" className="w-12 h-12 mx-auto mb-3" />
                <p className="text-responsive-base">{t('common.noPhotosAvailable')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Photo Viewer */}
      {showFullScreenPhoto && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={closeFullScreenPhoto}>
          <button
            aria-label="Close"
            onClick={(e) => { e.stopPropagation(); closeFullScreenPhoto() }}
            className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center`}
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
          {eventImages.length > 1 && (
            <>
              <button
                aria-label="Previous"
                onClick={(e) => { e.stopPropagation(); showPrevPhoto() }}
                className={`absolute left-3 sm:left-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center`}
              >
                <Icon name={isRTL ? 'arrow-right' : 'arrow-left'} className="w-6 h-6" />
              </button>
              <button
                aria-label="Next"
                onClick={(e) => { e.stopPropagation(); showNextPhoto() }}
                className={`absolute right-3 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center`}
              >
                <Icon name={isRTL ? 'arrow-left' : 'arrow-right'} className="w-6 h-6" />
              </button>
            </>
          )}
          <img
            src={eventImages[selectedImageIndex]}
            alt={`Event photo ${selectedImageIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[95vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-event.jpg' }}
          />
        </div>
      )}

      {/* Action Button */}
      <div className="h-20 sm:h-24 md:h-28"/>
      <div className="fixed bottom-24 sm:bottom-28 md:bottom-32 left-0 right-0 z-30">
        <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl xl:max-w-4xl 2xl:max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* People Counter */}
            <div className="flex items-center gap-2 bg-slate-800/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-slate-700/50">
              <button 
                onClick={handleDecrement}
                disabled={peopleCount <= (eventData?.minimum_group_size || 1)}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <Icon name="minus" className="w-4 h-4 text-white" />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-responsive-base font-medium text-white min-w-[2rem] text-center">
                  {formatNumber(peopleCount, language)}
                </span>
                <span className="text-xs text-slate-400">
                  {formatPersianNumber(eventData?.minimum_group_size || 1)} {t('pages.reservation.minimumTeamSize')}
                </span>
              </div>
              <button 
                onClick={handleIncrement}
                disabled={peopleCount >= (eventData.capacity - (eventData.total_reserved_people || 0))}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <Icon name="plus" className="w-4 h-4 text-white" />
              </button>
            </div>
            
            {/* Reserve Button */}
            <button
              onClick={handleTicketPreview}
              disabled={!eventData || peopleCount > (eventData.capacity - (eventData.total_reserved_people || 0)) || peopleCount < (eventData?.minimum_group_size || 1) || isReserving}
              className="btn-primary flex-1 text-center hover-scale shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isReserving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t('common.processing')}</span>
                </div>
              ) : eventData ? t('common.reserveFor') : 'Loading...'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 md:p-8 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mx-auto grid place-items-center shadow-glow">
              <Icon name="check" className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div>
              <h2 className="text-responsive-xl font-bold text-gradient mb-2">{t('pages.reservation.reservationConfirmed')}</h2>
              <p className="text-responsive-sm text-slate-400">
                {t('pages.reservation.reservationConfirmedDesc', { eventName: eventData.name })}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.reservation.event')}</span>
                <span className="text-responsive-sm font-medium">{eventData.name}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.reservation.dateTime')}</span>
                <span className="text-responsive-sm font-medium">{formatDate(eventData.start_time, language)} • {formatTimeRangeHelper(eventData.start_time, eventData.end_time, language)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.reservation.people')}</span>
                <span className="text-responsive-sm font-medium">{formatNumber(peopleCount, language)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.reservation.total')}</span>
                <span className="text-responsive-sm font-bold text-green-400">{formatCurrency(eventData.price * peopleCount, language, t('common.currency'))}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/profile')}
                className="btn-ghost flex-1"
              >
                {t('pages.reservation.viewReservations')}
              </button>
              <button 
                onClick={() => {
                  setShowSuccessModal(false)
                  navigate('/')
                }}
                className="btn-primary flex-1"
              >
                {t('pages.reservation.continueExploring')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Preview Modal */}
      {showTicketPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 md:p-8 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 mx-auto grid place-items-center shadow-glow">
              <Icon name="ticket" className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div>
              <h2 className="text-responsive-xl font-bold text-gradient mb-2">{t('pages.reservation.ticketPreview')}</h2>
              <p className="text-responsive-sm text-slate-400">
                {t('pages.reservation.ticketPreviewDesc')}
              </p>
            </div>
            
            {/* Event Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.reservation.event')}</span>
                <span className="text-responsive-sm font-medium">{eventData.name}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.reservation.dateTime')}</span>
                <span className="text-responsive-sm font-medium">
                  {new Date(eventData.start_time).toLocaleDateString(isRTL ? 'fa-IR' : 'en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} • {formatTimeRangeHelper(eventData.start_time, eventData.end_time, language)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.reservation.venue')}</span>
                <span className="text-responsive-sm font-medium">{eventData.social_hub.name}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.reservation.people')}</span>
                <span className="text-responsive-sm font-medium">{formatNumber(peopleCount, language)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.reservation.pricePerPerson')}</span>
                <span className="text-responsive-sm font-medium">{formatCurrency(eventData.price, language, t('common.currency'))}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border-t border-slate-700">
                <span className="text-responsive-sm font-semibold text-slate-300">{t('pages.reservation.total')}</span>
                <span className="text-responsive-lg font-bold text-green-400">{formatCurrency(eventData.price * peopleCount, language, t('common.currency'))}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowTicketPreview(false)}
                className="btn-ghost flex-1"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handlePendingReservation}
                className="btn-secondary flex-1 hover-scale shadow-glow"
              >
                {t('pages.reservation.pendingReservation')}
              </button>
              <button 
                onClick={handleDirectReserve}
                disabled={isReserving}
                className="btn-primary flex-1 hover-scale shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReserving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t('common.processing')}</span>
                  </div>
                ) : (
                  t('pages.reservation.confirmReservation')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}