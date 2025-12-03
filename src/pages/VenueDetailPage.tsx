import { useState, useEffect } from 'react'
import { useParams, NavLink, useNavigate } from 'react-router-dom'
import { useStore, usePastEvents } from '../state/apiStore'
import { apiService } from '../services/api'
import EventCard from '../components/EventCard'
import PastEventCard from '../components/PastEventCard'
import RatingReview from '../components/RatingReview'
import ReviewsList from '../components/ReviewsList'
import MapComponent from '../components/MapComponent'
import Icon from '../components/Icon'
import BackButton from '../components/BackButton'
import SignInPopup from '../components/SignInPopup'
import { useLanguage } from '../contexts/LanguageContext'
import { formatPersianNumber, formatPersianCurrency, formatNumber, formatCurrency } from '../utils/persianNumbers'
import { formatSolarHijriDate } from '../utils/solarHijriCalendar'
import { toggleFavoriteWithBackend } from '../utils/favoriteUtils'
import { handleImageErrorWithRetry } from '../utils/imageRetry'
import { filterEventsWithOpenTicketSales, isTicketSalesClosed, shouldShowEventAsCompleted, shouldShowEventAsCancelled } from '../utils/eventStatusUpdater'

export default function VenueDetailPage() {
  const { id } = useParams()
  const { state, dispatch } = useStore()
  const { t, isRTL, language } = useLanguage()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'events' | 'reviews' | 'info' | 'photos'>('events')
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [showSignInPopup, setShowSignInPopup] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showFullScreenPhoto, setShowFullScreenPhoto] = useState(false)
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0)
  const [venueData, setVenueData] = useState<any>(null)
  const [venueEvents, setVenueEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  // Fetch venue data when component mounts
  useEffect(() => {
    const fetchVenueData = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        setError(null)
        
        // OPTIMIZED: Single batch API call instead of 4 separate calls
        const batchResponse = await apiService.socialHubs.getWithRelated(id)
        
        // Set all data from single response
        setVenueData(batchResponse.social_hub)
        setVenueEvents(batchResponse.events)
        dispatch({ type: 'set_events', events: batchResponse.events })
        dispatch({ type: 'set_comments', comments: batchResponse.comments })
        dispatch({ type: 'set_ratings', ratings: batchResponse.ratings })
        
      } catch (err) {
        console.error('Failed to fetch venue data:', err)
        setError('Failed to load venue data')
        
        // Fallback to existing data from state
        const fallbackHub = state.socialHubs.find(h => h.id === id)
        if (fallbackHub) {
          setVenueData(fallbackHub)
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchVenueData()
  }, [id, dispatch, state.socialHubs])
  
  const hub = venueData || state.socialHubs.find(h => h.id === id)
  const hubEvents = venueEvents.length > 0 ? venueEvents : state.events.filter(e => e.social_hub?.id === id)
  const isFavorite = state.favorites.includes(id || '')
  
  // Get past events for this venue
  const allPastEvents = usePastEvents()
  const hubPastEvents = allPastEvents.filter(e => e.social_hub?.id === id)

  // Get real venue images from the API response
  const getVenueImages = () => {
    const images = []
    
    // Add main image if available
    if (hub?.image_url) {
      images.push(hub.image_url)
    }
    
    // Add gallery images if available
    if (hub?.gallery_images && Array.isArray(hub.gallery_images)) {
      images.push(...hub.gallery_images)
    }
    
    // If no images, use placeholder
    if (images.length === 0) {
      images.push('/placeholder-venue.jpg')
    }
    
    return images
  }
  
  const venueImages = getVenueImages()

  // Photo navigation functions
  const openFullScreenPhoto = (index: number) => {
    setFullScreenImageIndex(index)
    setShowFullScreenPhoto(true)
  }

  const closeFullScreenPhoto = () => {
    setShowFullScreenPhoto(false)
  }

  const navigateToPreviousPhoto = () => {
    setFullScreenImageIndex(prev => 
      prev === 0 ? venueImages.length - 1 : prev - 1
    )
  }

  const navigateToNextPhoto = () => {
    setFullScreenImageIndex(prev => 
      prev === venueImages.length - 1 ? 0 : prev + 1
    )
  }

  // Keyboard navigation for full-screen photo viewer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showFullScreenPhoto) return

      switch (event.key) {
        case 'Escape':
          closeFullScreenPhoto()
          break
        case 'ArrowLeft':
          navigateToPreviousPhoto()
          break
        case 'ArrowRight':
          navigateToNextPhoto()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showFullScreenPhoto])

  // Map amenity keys to display data
  const getAmenityDisplayData = (amenityKey: string) => {
    const amenityMap: Record<string, { icon: string; name: string }> = {
      'wifi': { icon: 'wifi', name: t('pages.venueDetail.amenityLabels.wifi') },
      'parking': { icon: 'car', name: t('pages.venueDetail.amenityLabels.parking') },
      'foodService': { icon: 'coffee', name: t('pages.venueDetail.amenityLabels.foodService') },
      'airConditioning': { icon: 'snowflake', name: t('pages.venueDetail.amenityLabels.airConditioning') },
      'tvScreens': { icon: 'tv', name: t('pages.venueDetail.amenityLabels.tvScreens') },
      'gamingEquipment': { icon: 'gamepad-2', name: t('pages.venueDetail.amenityLabels.gamingEquipment') },
      'soundSystem': { icon: 'volume-2', name: t('pages.venueDetail.amenityLabels.soundSystem') },
      'projector': { icon: 'monitor', name: t('pages.venueDetail.amenityLabels.projector') },
      'restrooms': { icon: 'bath', name: t('pages.venueDetail.amenityLabels.restrooms') },
      'outdoorSpace': { icon: 'tree-pine', name: t('pages.venueDetail.amenityLabels.outdoorSpace') },
      'library': { icon: 'book', name: t('pages.venueDetail.amenityLabels.library') },
      'smokingArea': { icon: 'smoking', name: t('pages.venueDetail.amenityLabels.smokingArea') }
    }
    
    return amenityMap[amenityKey] || { icon: 'check', name: amenityKey }
  }

  // Get real amenities from venue data
  const venueAmenities = hub?.amenities?.map(amenityKey => ({
    ...getAmenityDisplayData(amenityKey),
    available: true
  })) || []


  // Loading state
  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-slate-400 mb-2">{t('pages.venueDetail.loadingVenue')}</h2>
        <p className="text-slate-500">{t('pages.venueDetail.fetchingVenueDetails')}</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center p-8">
        <Icon name="alert-circle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Venue</h2>
        <p className="text-slate-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Venue not found
  if (!hub) {
    return (
      <div className="text-center p-8">
        <Icon name="location" className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-400 mb-2">{t('pages.venueDetail.venueNotFound')}</h2>
        <p className="text-slate-500">{t('pages.venueDetail.venueNotFoundDescription')}</p>
      </div>
    )
  }

  const handleToggleFavorite = async () => {
    // Check if user is authenticated
    if (!state.auth.user || !state.auth.isLoggedIn) {
      setShowSignInPopup(true)
      return
    }
    
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      console.error('No access token found');
      return;
    }

    await toggleFavoriteWithBackend({
      socialHubId: hub.id,
      userId: state.auth.user?.id || '',
      accessToken,
      dispatch,
      navigate,
      state
    });
  }

  // Filter events into current and past based on dynamic status determination
  const currentEvents = hubEvents.filter(event => {
    // Keep events that are still upcoming (ticket sales open)
    if (event.event_status === 'upcoming' && !isTicketSalesClosed(event)) {
      return true
    }
    // Keep events that have closed ticket sales but haven't been determined as completed/cancelled yet
    if (event.event_status === 'upcoming' && isTicketSalesClosed(event)) {
      return false // These should go to past events
    }
    return false
  })
  
  // Get all past events without duplicates
  const pastEvents = [
    ...hubPastEvents,
    // Add events that have closed ticket sales and should be considered past
    ...hubEvents.filter(event => {
      // Only include if not already in hubPastEvents
      const isAlreadyInPastEvents = hubPastEvents.some(pastEvent => pastEvent.id === event.id)
      return !isAlreadyInPastEvents && isTicketSalesClosed(event) && (
        shouldShowEventAsCompleted(event) || 
        shouldShowEventAsCancelled(event) ||
        event.event_status === 'completed' ||
        event.event_status === 'cancelled'
      )
    })
  ]
  
  // Get all categories from API data
  const availableCategories = state.eventCategories || []
  
  // Map category names to icons and colors (same as CategoriesPage)
  const getCategoryData = (categoryName: string) => {
    const iconMap: Record<string, string> = {
      'مافیا': '/مافیا.svg',
      'تماشای فیلم': '/تماشای فیلم.svg',
      'تماشای مسابقات ورزشی': '/تماشای مسابقات ورزشی.svg',
      'بازی های گروهی': '/بازی های گروهی.svg',
      'بازی‌های گروهی': '/بازی های گروهی.svg',
      'بازی های رومیزی': '/بازی های رومیزی.svg',
      'بازی‌های رومیزی': '/بازی های رومیزی.svg',
      'موسیقی زنده': '/موسیقی زنده.svg',
      'کتابخوانی': '/کتابخوانی.svg',
      'ادایی': '/ادایی.svg'
    }
    
    const colorMap: Record<string, string> = {
      'مافیا': 'from-gray-700 to-gray-900',
      'تماشای فیلم': 'from-purple-500 to-pink-500',
      'تماشای مسابقات ورزشی': 'from-green-500 to-teal-500',
      'بازی های گروهی': 'from-blue-500 to-indigo-500',
      'بازی‌های گروهی': 'from-blue-500 to-indigo-500',
      'بازی های رومیزی': 'from-indigo-500 to-purple-500',
      'بازی‌های رومیزی': 'from-indigo-500 to-purple-500',
      'موسیقی زنده': 'from-pink-500 to-red-500',
      'کتابخوانی': 'from-amber-500 to-orange-500',
      'ادایی': 'from-purple-600 to-purple-800'
    }
    
    return {
      icon: iconMap[categoryName] || '/مافیا.svg',
      color: colorMap[categoryName] || 'from-gray-500 to-gray-600'
    }
  }
  
  // Filter events by selected category
  const filteredCurrentEvents = selectedCategory && selectedCategory !== 'all'
    ? currentEvents.filter(event => event.category?.id === selectedCategory)
    : currentEvents
    
  const filteredPastEvents = selectedCategory && selectedCategory !== 'all'
    ? pastEvents.filter(event => event.category?.id === selectedCategory)
    : pastEvents

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero Section with Image Gallery */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="relative">
          <img 
            src={venueImages[selectedImageIndex]} 
            alt={hub.name} 
            className="w-full h-48 sm:h-56 md:h-64 lg:h-80 object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"/>
          
          {/* Top Section with Venue Info and Navigation */}
          <div className="absolute top-4 left-4 right-4">
            {/* Back Button */}
            <div className="mb-4">
              <BackButton fallbackPath="/venues" />
            </div>
            {/* Venue Information - Top Left */}
            <div className="mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full text-xs">
                    <span className="text-white">
                      {hub.average_rating && hub.average_rating > 0 ? formatPersianNumber(hub.average_rating, 1) : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full text-xs">
                    <Icon name="calendar" className="w-3 h-3 text-blue-400" />
                    <span className="text-white">{formatPersianNumber(hub.events_count)} {t('common.events')}</span>
                  </div>
                  <button
                    onClick={handleToggleFavorite}
                    className={`flex items-center justify-center bg-black/60 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                      isFavorite 
                        ? 'bg-red-500/80 text-white' 
                        : 'text-white hover:bg-red-500/80'
                    }`}
                  >
                    <Icon name="heart" className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <h1 className="text-responsive-xl sm:text-responsive-2xl font-bold text-white drop-shadow-lg">
                  {hub.name}
                </h1>
                <div className="flex items-center gap-1 text-white/90 text-responsive-sm">
                  <Icon name="location" className="w-4 h-4" />
                  <span>{hub.address}</span>
                </div>
              </div>
            </div>

            {/* Navigation Controls - Top Right */}
            <div className="flex items-start justify-end">
              <div className="flex gap-2">
                {/* Rating button removed */}
              </div>
            </div>
          </div>

          {/* Image Thumbnails */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {venueImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedImageIndex === index 
                      ? 'border-white shadow-glow' 
                      : 'border-white/50 hover:border-white/80'
                  }`}
                >
                  <img 
                    src={image} 
                    className="w-full h-full object-cover" 
                    alt={`Venue image ${index + 1}`} 
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>



      {/* Tabs */}
      <div className="card p-4 md:p-6">
        <div className="mb-6 bg-slate-800/40 p-1 rounded-xl relative">
          {/* Scroll fade indicators */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-800/40 to-transparent pointer-events-none z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-slate-800/40 to-transparent pointer-events-none z-10"></div>
          
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 scroll-smooth">
            {[
              { key: 'events', label: t('pages.venueDetail.tabs.events'), icon: 'calendar' },
              { key: 'reviews', label: t('pages.venueDetail.tabs.reviews'), icon: 'star' },
              { key: 'photos', label: t('pages.venueDetail.tabs.photos'), icon: 'user' },
              { key: 'info', label: t('pages.venueDetail.tabs.info'), icon: 'location' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-shrink-0 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.key 
                    ? 'bg-gradient-to-r from-purple-500 to-teal-500 text-white shadow-glow' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                style={{ minWidth: '90px' }}
              >
                <Icon name={tab.icon as any} className="w-4 h-4 flex-shrink-0" />
                <span className="text-responsive-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {!selectedCategory ? (
              // Show categories first
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-responsive-lg font-semibold">{t('pages.venueDetail.chooseEventCategory')}</h3>
                  <span className="text-responsive-sm text-slate-400">{availableCategories.length} {t('pages.venueDetail.categories')}</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableCategories.map(category => {
                    const categoryEventsCount = hubEvents.filter(event => event.category?.id === category.id).length
                    const categoryData = getCategoryData(category.name)
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className="card p-px text-center hover:scale-105 transition-all duration-200 hover:shadow-lg group"
                      >
                        <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                          <img 
                            src={categoryData.icon} 
                            alt={t(`common.categoryNames.${category.name}`) || category.name}
                            className="w-12 h-12 object-contain"
                          />
                        </div>
                        <h4 className="font-semibold text-responsive-sm mb-1 group-hover:text-purple-400 transition-colors">
                          {t(`common.categoryNames.${category.name}`) || category.name}
                        </h4>
                          <p className="text-xs text-slate-400">{formatPersianNumber(categoryEventsCount)} {t('pages.venueDetail.events')}</p>
                      </button>
                    )
                  })}
                </div>
                
                {/* Recent Events Horizontal Scroll */}
                {currentEvents.length > 0 && (
                  <div className="pt-6 border-t border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-responsive-lg font-semibold">{t('pages.venueDetail.recentEvents')}</h3>
                      <span className="text-responsive-sm text-slate-400">{currentEvents.length} {t('pages.venueDetail.events')}</span>
                    </div>
                    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {currentEvents.slice(0, 5).map(event => (
                        <div key={event.id} className="min-w-[240px] sm:min-w-[280px] md:min-w-[320px] lg:min-w-[360px] snap-start flex-shrink-0">
                          <EventCard e={event} />
                        </div>
                      ))}
                    </div>
                    {currentEvents.length > 5 && (
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className="btn-primary text-sm hover-scale"
                        >
                          <Icon name="arrow-right" className="w-4 h-4" />
                          <span className="ml-2">{t('common.seeMore')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Show events for selected category
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="btn-ghost p-2 rounded-lg hover:bg-slate-700/50"
                    >
                      <Icon name="arrow-right" className={`w-4 h-4 ${isRTL ? '' : 'rotate-180'}`} />
                    </button>
                    <div>
                      <h3 className="text-responsive-lg font-semibold">
                        {selectedCategory === 'all' 
                          ? t('pages.venueDetail.events') 
                          : `${availableCategories.find(cat => cat.id === selectedCategory)?.name} ${t('pages.venueDetail.events')}`
                        }
                      </h3>
                      <p className="text-responsive-sm text-slate-400">
                        {filteredCurrentEvents.length} {t('pages.venueDetail.upcomingEvents')}
                      </p>
                    </div>
                  </div>
                </div>
                
                {filteredCurrentEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon name="calendar" className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">{t('pages.venueDetail.noUpcomingEventsInCategory')}</p>
                  </div>
                ) : (
                  <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {filteredCurrentEvents.map(event => (
                      <div key={event.id} className="min-w-[240px] sm:min-w-[280px] md:min-w-[320px] lg:min-w-[360px] snap-start flex-shrink-0">
                        <EventCard e={event} />
                      </div>
                    ))}
                  </div>
                )}

                {filteredPastEvents.length > 0 && (
                  <div className="pt-6 border-t border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-responsive-lg font-semibold">{t('pages.venueDetail.pastEvents')}</h3>
                      <span className="text-responsive-sm text-slate-400">{filteredPastEvents.length} {t('pages.venueDetail.events')}</span>
                    </div>
                    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {filteredPastEvents.slice(0, 3).map(event => (
                        <div key={event.id} className="min-w-[240px] sm:min-w-[280px] md:min-w-[320px] lg:min-w-[360px] snap-start flex-shrink-0">
                          <PastEventCard e={event} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-responsive-lg font-semibold">{t('pages.venueDetail.reviewsAndRatings')}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="btn-primary text-sm hover-scale"
                >
                  <Icon name="star" className="w-4 h-4" />
                  <span className="ml-1">{t('pages.venueDetail.rateVenue')}</span>
                </button>
              </div>
            </div>
            
            <ReviewsList socialHubId={hub.id} />
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-4">
            <h3 className="text-responsive-lg font-semibold">{t('pages.venueDetail.photoGallery')}</h3>
            {venueImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {venueImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => openFullScreenPhoto(index)}
                    className="aspect-square rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200"
                  >
                    <img 
                      src={image} 
                      className="w-full h-full object-cover" 
                      alt={`Venue photo ${index + 1}`}
                      data-original-src={image}
                      onError={(e) => {
                        // Try 2 times, then hide image if still failing
                        handleImageErrorWithRetry(e, 2, 500)
                      }}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-2">
                  <Icon name="image" className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-responsive-base">{t('pages.venueDetail.noPhotosAvailable')}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-6">
            <h3 className="text-responsive-lg font-semibold">{t('pages.venueDetail.venueInformation')}</h3>
            
            {/* Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.venueDetail.address')}</span>
                <span className="text-responsive-sm font-medium text-right max-w-[60%]">{hub.address}</span>
              </div>
              
              
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.venueDetail.totalEvents')}</span>
                <span className="text-responsive-sm font-medium">{formatNumber(hub.events_count, language)}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.venueDetail.averageRating')}</span>
                <div className="flex items-center gap-1">
                  <Icon name="star" className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-responsive-sm font-medium">
                    {hub.average_rating && hub.average_rating > 0 ? formatNumber(hub.average_rating, language, 1) : '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Info */}
            <div>
              <h4 className="text-responsive-base font-semibold mb-3">{t('pages.venueDetail.owner')}</h4>
              <div className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                  {hub.owner?.f_name?.[0] || hub.owner?.name?.[0] || 'O'}
                </div>
                <div className="flex-1">
                  <p className="text-responsive-sm font-medium">
                    {hub.owner?.f_name && hub.owner?.l_name 
                      ? `${hub.owner.f_name} ${hub.owner.l_name}`
                      : hub.owner?.name || t('pages.venueDetail.unknownOwner')
                    }
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Icon name="calendar" className="w-3 h-3" />
                      <span>
                        {t('pages.venueDetail.established')} {hub.owner?.created_at ? formatSolarHijriDate(hub.owner.created_at, 'YYYY') : '۱۴۰۰'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="star" className="w-3 h-3" />
                      <span>
                        {hub.average_rating && hub.average_rating > 0 ? formatPersianNumber(hub.average_rating, 1) : ''} {t('pages.venueDetail.rating')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {hub.description && (
              <div>
                <h4 className="text-responsive-base font-semibold mb-3">{t('pages.venueDetail.aboutThisVenue')}</h4>
                <div className="p-3 bg-slate-800/40 rounded-xl">
                  <p className="text-responsive-sm text-slate-300 leading-relaxed">
                    {hub.description}
                  </p>
                </div>
              </div>
            )}

            {/* Amenities */}
            <div>
              <h4 className="text-responsive-base font-semibold mb-3">{t('pages.venueDetail.amenities')}</h4>
              {venueAmenities.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {venueAmenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <Icon name={amenity.icon as any} className="w-4 h-4 text-green-400" />
                      <span className="text-responsive-sm text-green-300">
                        {amenity.name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Icon name="info" className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400">{t('pages.venueDetail.noAmenitiesAvailable')}</p>
                </div>
              )}
            </div>

            {/* Location Map */}
            <div>
              <h4 className="text-responsive-base font-semibold mb-3">{t('pages.venueDetail.location')}</h4>
              <div className="rounded-lg overflow-hidden">
                {hub.latitude && hub.longitude ? (
                  <MapComponent 
                    venues={[{
                      id: hub.id,
                      name: hub.name,
                      address: hub.address,
                      latitude: hub.latitude,
                      longitude: hub.longitude,
                      rating: hub.average_rating,
                      category: 'venue'
                    }]}
                    center={[hub.latitude, hub.longitude]}
                    zoom={15}
                    height="200px"
                    showVenues={true}
                    favorites={state.favorites}
                  />
                ) : (
                  <div className="w-full h-48 bg-slate-800/40 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Icon name="map" className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400">{t('pages.venueDetail.locationNotAvailable')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <NavLink 
          to={`/venues`}
          className="btn-ghost flex-1 text-center hover-scale"
        >
          <Icon name="arrow-right" className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
          <span className="ml-2">{t('pages.venueDetail.backToVenues')}</span>
        </NavLink>
        
        <button 
          onClick={handleToggleFavorite}
          className={`btn-primary flex-1 hover-scale ${
            isFavorite ? 'bg-red-500 hover:bg-red-600' : ''
          }`}
        >
          <Icon name="heart" className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-current' : ''}`} />
          <span className="ml-2">{isFavorite ? t('pages.venueDetail.removeFromFavorites') : t('pages.venueDetail.addToFavorites')}</span>
        </button>
      </div>
      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <RatingReview 
              socialHubId={hub.id} 
              onClose={() => setShowRatingModal(false)} 
            />
          </div>
        </div>
      )}

      <SignInPopup
        isOpen={showSignInPopup}
        onClose={() => setShowSignInPopup(false)}
        redirectUrl={window.location.pathname + window.location.search}
      />

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
          {venueImages.length > 1 && (
            <>
              <button
                aria-label="Previous"
                onClick={(e) => { e.stopPropagation(); navigateToPreviousPhoto() }}
                className={`absolute left-3 sm:left-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center`}
              >
                <Icon name={isRTL ? 'arrow-left' : 'arrow-right'} className="w-6 h-6" />
              </button>
              <button
                aria-label="Next"
                onClick={(e) => { e.stopPropagation(); navigateToNextPhoto() }}
                className={`absolute right-3 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center`}
              >
                <Icon name={isRTL ? 'arrow-right' : 'arrow-left'} className="w-6 h-6" />
              </button>
            </>
          )}
          <img
            src={venueImages[fullScreenImageIndex]}
            alt={`Venue photo ${fullScreenImageIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[95vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
            data-original-src={venueImages[fullScreenImageIndex]}
            onError={(e) => {
              // Try 2 times, then hide image if still failing
              handleImageErrorWithRetry(e, 2, 500)
            }}
          />
        </div>
      )}

    </div>
  )
}
