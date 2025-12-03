import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useUnfilteredEvents, useStore, useRecommendedEvents, useFavoriteSocialHubs } from '../state/apiStore'
import { apiUtils } from '../services/api'
import Icon from '../components/Icon'
import EventCard from '../components/EventCard'
import SocialHubCard from '../components/SocialHubCard'
import SearchResults from '../components/SearchResults'
import { useLanguage } from '../contexts/LanguageContext'
import { formatPersianNumber } from '../utils/persianNumbers'
import { filterEventsWithOpenTicketSales, filterEventsNotSoldOut } from '../utils/eventStatusUpdater'

export default function HomePage() {
  const events = useUnfilteredEvents()
  const recommendedEvents = useRecommendedEvents()
  const favoriteHubs = useFavoriteSocialHubs()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, isRTL } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)



  // Refresh data when navigating to home page - always refresh on page load/refresh
  useEffect(() => {
    // Only run when on home page
    if (location.pathname !== '/') return

    const refreshData = async (forceRefresh: boolean = true) => {
      try {
        // Reload events with 1 minute cache, but force refresh on page load
        dispatch({ type: 'set_loading', key: 'events', value: true })
        const events = await apiUtils.getAllEvents(undefined, forceRefresh)
        dispatch({ type: 'set_events', events: events })
        dispatch({ type: 'set_loading', key: 'events', value: false })
      } catch (error) {
        dispatch({ type: 'set_loading', key: 'events', value: false })
      }

      try {
        // Reload social hubs with 1 minute cache, but force refresh on page load
        dispatch({ type: 'set_loading', key: 'socialHubs', value: true })
        const socialHubs = await apiUtils.getAllSocialHubs(undefined, forceRefresh)
        // Sort social hubs by average rating (highest first) for popular venues display
        const sortedSocialHubs = socialHubs.sort((a, b) => {
          const ratingA = a.average_rating || 0
          const ratingB = b.average_rating || 0
          return ratingB - ratingA
        })
        dispatch({ type: 'set_social_hubs', socialHubs: sortedSocialHubs })
        dispatch({ type: 'set_loading', key: 'socialHubs', value: false })
      } catch (error) {
        dispatch({ type: 'set_loading', key: 'socialHubs', value: false })
      }

      // Event categories are loaded by apiStore, no need to reload them here
    }

    // Always force refresh when visiting home page (bypasses cache)
    // Cache will be used for subsequent requests within 1 minute
    refreshData(true)
  }, [location.pathname, dispatch])

  // Default categories order as specified
  const defaultCategoriesOrder = [
    'مافیا',
    'تماشای مسابقات ورزشی', 
    'تماشای فیلم',
    'کتابخوانی',
    'موسیقی زنده',
    'ادایی',
    'بازی های رومیزی',
    'بازی های گروهی'
  ]

  // Map API eventCategories to display format with icons and colors, sorted by default order
  const categoriesData = (state.eventCategories || [])
    .map(category => {
      const iconMap: Record<string, string> = {
        'مافیا': '/مافیا.svg',
        'تماشای فیلم': '/تماشای فیلم.svg',
        'تماشای مسابقات ورزشی': '/تماشای مسابقات ورزشی.svg',
        'تماشای ورزش': '/تماشای مسابقات ورزشی.svg', // Use same icon as تماشای مسابقات ورزشی
        'بازی های گروهی': '/بازی های گروهی.svg',
        'بازی‌های گروهی': '/بازی های گروهی.svg',
        'گیمینگ گروهی': '/بازی های گروهی.svg', // Use same icon as بازی های گروهی
        'بازی های رومیزی': '/بازی های رومیزی.svg',
        'بازی‌های رومیزی': '/بازی های رومیزی.svg',
        'موسیقی زنده': '/موسیقی زنده.svg',
        'کتابخوانی': '/کتابخوانی.svg',
        'مطالعه کتاب': '/کتابخوانی.svg', // Use same icon as کتابخوانی
        'ادایی': '/ادایی.svg',
        'تظاهر': '/ادایی.svg' // Use same icon as ادایی for sophisticated events
      }
      
      const colorMap: Record<string, string> = {
        'مافیا': 'from-gray-700 to-gray-900',
        'تماشای فیلم': 'from-purple-500 to-pink-500',
        'تماشای مسابقات ورزشی': 'from-green-500 to-teal-500',
        'تماشای ورزش': 'from-green-500 to-teal-500', // Use same color as تماشای مسابقات ورزشی
        'بازی های گروهی': 'from-blue-500 to-indigo-500',
        'بازی‌های گروهی': 'from-blue-500 to-indigo-500',
        'گیمینگ گروهی': 'from-blue-500 to-indigo-500', // Use same color as بازی های گروهی
        'بازی های رومیزی': 'from-indigo-500 to-purple-500',
        'بازی‌های رومیزی': 'from-indigo-500 to-purple-500',
        'موسیقی زنده': 'from-pink-500 to-red-500',
        'کتابخوانی': 'from-amber-500 to-orange-500',
        'مطالعه کتاب': 'from-amber-500 to-orange-500', // Use same color as کتابخوانی
        'ادایی': 'from-purple-600 to-purple-800',
        'تظاهر': 'from-purple-600 to-purple-800' // Use same color as ادایی
      }
      
      return {
        key: category.id,
        id: category.id,
        name: category.name,
        icon: iconMap[category.name] || '🎯',
        color: colorMap[category.name] || 'from-gray-500 to-gray-600',
        order: defaultCategoriesOrder.indexOf(category.name)
      }
    })
    .sort((a, b) => {
      // Sort by default order first, then alphabetically for categories not in the default list
      if (a.order !== -1 && b.order !== -1) {
        return a.order - b.order
      } else if (a.order !== -1) {
        return -1
      } else if (b.order !== -1) {
        return 1
      } else {
        return a.name.localeCompare(b.name)
      }
    })

  // Filter events based on search and filters
  const filteredEvents = (events || []).filter(event => {
    if (!event) return false
    
    // Filter out past events (completed and cancelled) from main display
    if (event.event_status === 'completed' || event.event_status === 'cancelled') return false
    
    // Search filter
    if (searchQuery && 
        !event.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !event.social_hub?.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    return true
  })

  // Filter out events with closed ticket sales and sold-out events
  const eventsWithOpenTicketSales = filterEventsWithOpenTicketSales(filteredEvents)
  const eventsNotSoldOut = filterEventsNotSoldOut(eventsWithOpenTicketSales)

  // Separate past events for display in a dedicated section
  const pastEvents = (events || []).filter(event => {
    if (!event) return false
    return event.event_status === 'completed' || event.event_status === 'cancelled'
  })

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to events page with category filter using the category ID
    navigate(`/events?category=${categoryId}`)
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setShowSearchResults(false)
      return
    }
    setShowSearchResults(true)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    if (value.trim()) {
      setShowSearchResults(true)
    } else {
      setShowSearchResults(false)
    }
  }

  const handleCloseSearchResults = () => {
    setShowSearchResults(false)
    setSearchQuery('')
  }

 const clearFilters = () => {
    setSearchQuery('')
    dispatch({ type: 'clear_filters' })
  }

  return (
    <div className={`space-y-6 md:space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Enhanced Search Bar */}
      <div className="space-y-4">
        <div className="search-bar-compact">
          <Icon name="search" className="text-purple-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder={t('common.searchEvents')}
            value={searchQuery}
            onChange={handleSearchInputChange}
            onKeyPress={handleKeyPress}
            className="bg-transparent flex-1 outline-none text-slate-100 placeholder-slate-400 text-sm sm:text-base"
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          <button
            onClick={handleSearch}
            className="btn-primary px-3 py-2 text-sm hover-scale"
          >
            {t('common.search')}
          </button>
        </div>

        {/* Search Results */}
        {showSearchResults && (
          <SearchResults 
            query={searchQuery} 
            onClose={handleCloseSearchResults}
          />
        )}
      </div>

      {/* Show regular content only when not searching */}
      {!showSearchResults && (
        <>
          {/* Categories */}
      <section className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold">{t('common.eventCategories')}</h2>
          <NavLink to="/categories" className="text-sm md:text-base text-orange-400 hover:text-orange-300 transition-colors">{t('common.seeMore')}</NavLink>
        </div>
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categoriesData.length > 0 ? (
            categoriesData.map(category => (
              <button
                key={category.key}
                onClick={() => handleCategoryClick(category.key)}
                className="min-w-[120px] sm:min-w-[140px] md:min-w-[160px] text-center space-y-3 snap-start flex-shrink-0 hover:scale-105 transition-transform duration-200"
              >
                <div className={`w-20 h-20 mx-auto grid place-items-center text-2xl sm:text-3xl transition-all duration-200`}>
                  {category.icon.startsWith('/') ? (
                    <img 
                      src={category.icon} 
                      alt={category.name}
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    category.icon
                  )}
                </div>
                <span className="text-sm sm:text-base font-medium text-slate-300 hover:text-white transition-colors duration-200">{t(`common.categoryNames.${category.name}`) || category.name}</span>
              </button>
            ))
          ) : state.eventCategories && state.eventCategories.length > 0 ? (
            // Fallback: show categories with proper icon and translation handling
            (() => {
              const iconMap: Record<string, string> = {
                'مافیا': '/مافیا.svg',
                'تماشای فیلم': '/تماشای فیلم.svg',
                'تماشای مسابقات ورزشی': '/تماشای مسابقات ورزشی.svg',
                'تماشای ورزش': '/تماشای مسابقات ورزشی.svg',
                'بازی های گروهی': '/بازی های گروهی.svg',
                'بازی‌های گروهی': '/بازی های گروهی.svg',
                'گیمینگ گروهی': '/بازی های گروهی.svg',
                'بازی های رومیزی': '/بازی های رومیزی.svg',
                'بازی‌های رومیزی': '/بازی های رومیزی.svg',
                'موسیقی زنده': '/موسیقی زنده.svg',
                'کتابخوانی': '/کتابخوانی.svg',
                'مطالعه کتاب': '/کتابخوانی.svg',
                'ادایی': '/ادایی.svg',
                'تظاهر': '/ادایی.svg'
              }
              
              return state.eventCategories.map(category => {
                const icon = iconMap[category.name] || '🎯'
                const displayName = t(`common.categoryNames.${category.name}`) || category.name
                
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className="min-w-[120px] sm:min-w-[140px] md:min-w-[160px] text-center space-y-3 snap-start flex-shrink-0 hover:scale-105 transition-transform duration-200"
                  >
                    <div className="w-20 h-20 mx-auto grid place-items-center text-2xl sm:text-3xl transition-all duration-200">
                      {icon.startsWith('/') ? (
                        <img 
                          src={icon} 
                          alt={category.name}
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        icon
                      )}
                    </div>
                    <span className="text-sm sm:text-base font-medium text-slate-300 hover:text-white transition-colors duration-200">{displayName}</span>
                  </button>
                )
              })
            })()
          ) : (
            <div className="text-center text-slate-400">
              <p>{t('common.loadingCategories')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Popular Venues */}
      {state.socialHubs && state.socialHubs.length > 0 && (
        <section className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="star" className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
              <h2 className="text-lg md:text-xl font-bold">{t('common.popular') + ' ' + t('common.venues')}</h2>
            </div>
            <NavLink 
              to="/venues" 
              className="text-sm md:text-base text-orange-400 hover:text-orange-300 transition-colors duration-200"
            >
              {t('common.seeMore')}
            </NavLink>
          </div>
          
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(state.socialHubs || []).slice(0, 8).map(hub => (
              <div key={hub.id} className="min-w-[280px] sm:min-w-[320px] md:min-w-[360px] snap-start flex-shrink-0">
                <SocialHubCard hub={hub} variant="default" />
              </div>
            ))}
          </div>
          
        </section>
      )}


      {/* Favorite Venues */}
      {(favoriteHubs || []).length > 0 && (
        <section className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="heart" className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
              <h2 className="text-lg md:text-xl font-bold">{t('common.yourFavoriteVenues')}</h2>
            </div>
            <NavLink 
              to="/profile#favorites" 
              className="flex items-center gap-1 text-sm md:text-base text-orange-400 hover:text-orange-300 transition-colors duration-200"
            >
              <span>{t('common.seeMore')}</span>
              <Icon name="arrow-right" className="w-4 h-4" />
            </NavLink>
          </div>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(favoriteHubs || []).slice(0, 8).map(hub => (
              <div key={hub.id} className="min-w-[200px] sm:min-w-[240px] md:min-w-[280px] snap-start flex-shrink-0">
                <SocialHubCard hub={hub} variant="compact" />
              </div>
            ))}
          </div>
          
        </section>
      )}


      {/* Location Based Suggestions */}
      <section className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold">{t('common.nearYou')}</h2>
          <NavLink to="/events?sort=near-you" className="text-sm md:text-base text-orange-400 hover:text-orange-300 transition-colors">{t('common.seeAll')}</NavLink>
        </div>
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(eventsNotSoldOut || []).slice(0, 3).map(event => (
            <div key={event.id} className="min-w-[280px] sm:min-w-[320px] md:min-w-[360px] snap-start flex-shrink-0">
              <EventCard e={event} />
            </div>
          ))}
        </div>
        
      </section>

      {/* Last Second Offers */}
      <section className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold">{t('common.lastSecondOffers')}</h2>
          <button 
            onClick={() => navigate('/events?sort=last-second')}
            className="text-sm md:text-base text-orange-400 hover:text-orange-300 transition-colors"
          >
            {t('pages.lastSecondOffers.viewAll')}
          </button>
        </div>
        
        {/* Recent Events Horizontal Scroll */}
        {(() => {
          // Get recent events (last 5 events or events happening soon)
          const recentEvents = (eventsNotSoldOut || [])
            .filter(event => {
              if (!event || !event.start_time) return false
              const eventDate = new Date(event.start_time)
              const now = new Date()
              const timeDiff = eventDate.getTime() - now.getTime()
              // Show events happening within next 7 days (exclude past events)
              return timeDiff > 0 && timeDiff <= 7 * 24 * 60 * 60 * 1000
            })
            .sort((a, b) => {
              if (!a.start_time || !b.start_time) return 0
              return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
            })
            .slice(0, 5)

          if (recentEvents.length === 0) {
            return (
              <div className="card p-6 text-center">
                <Icon name="calendar" className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-400 mb-2">{t('pages.lastSecondOffers.noRecentEvents')}</h3>
                <p className="text-sm text-slate-500">{t('pages.lastSecondOffers.checkBackSoon')}</p>
              </div>
            )
          }

          return (
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {recentEvents.map(event => (
                <div key={event.id} className="min-w-[240px] sm:min-w-[280px] md:min-w-[320px] lg:min-w-[360px] snap-start flex-shrink-0">
                  <EventCard e={event} />
                </div>
              ))}
            </div>
          )
        })()}
      </section>

      {/* Random Category Events */}
      {(() => {
        // Get a random category that has events
        const categoriesWithEvents = (state.eventCategories || []).filter(category => {
          return (eventsNotSoldOut || []).some(event => event.category?.id === category.id)
        })
        
        if (categoriesWithEvents.length === 0) return null
        
        // Select a random category (truly random on each page refresh)
        const randomIndex = Math.floor(Math.random() * categoriesWithEvents.length)
        const randomCategory = categoriesWithEvents[randomIndex]
        
        // Get events for this category
        const categoryEvents = (eventsNotSoldOut || []).filter(event => {
          if (!event) return false
          return event.category?.id === randomCategory.id
        }).slice(0, 5) // Limit to 5 events for horizontal scroll
        
        if (categoryEvents.length === 0) return null
        
        return (
          <section className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-bold">{randomCategory.name}</h2>
              <NavLink 
                to={`/events?category=${randomCategory.id}`} 
                className="text-sm md:text-base text-orange-400 hover:text-orange-300 transition-colors"
              >
                {t('common.seeAll')}
              </NavLink>
            </div>
            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categoryEvents.map(event => (
                <div key={event.id} className="min-w-[280px] sm:min-w-[320px] md:min-w-[360px] snap-start flex-shrink-0">
                  <EventCard e={event} />
                </div>
              ))}
            </div>
          </section>
        )
      })()}

      {/* Past Events Section */}
      {pastEvents.length > 0 && (
        <section className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="calendar" className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
              <h2 className="text-lg md:text-xl font-bold text-slate-400">{t('common.pastEvents')}</h2>
            </div>
            <span className="text-sm text-slate-500">
              {pastEvents.length} {t('common.events')}
            </span>
          </div>
          
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {pastEvents.slice(0, 6).map(event => (
              <div key={event.id}>
                <EventCard e={event} />
              </div>
            ))}
          </div>
          
          {pastEvents.length > 6 && (
            <div className="text-center">
              <button 
                onClick={() => navigate('/events?filter=past')}
                className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                {t('common.viewAllPastEvents')}
              </button>
            </div>
          )}
        </section>
      )}
        </>
      )}

    </div>
  )
}
