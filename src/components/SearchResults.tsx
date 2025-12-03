import { useState, useEffect, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { useStore } from '../state/apiStore'
import EventCard from './EventCard'
import SocialHubCard from './SocialHubCard'
import Icon from './Icon'
import { useLanguage } from '../contexts/LanguageContext'
import type { Event, SocialHub, EventCategory } from '../services/api'

interface SearchResultsProps {
  query: string
  onClose: () => void
}

interface SearchData {
  events: Event[]
  venues: SocialHub[]
  categories: EventCategory[]
}

export default function SearchResults({ query, onClose }: SearchResultsProps) {
  const { t, isRTL } = useLanguage()
  const { state } = useStore()
  const [hasSearched, setHasSearched] = useState(false)

  // Client-side search function
  const searchData = useMemo(() => {
    if (!query.trim()) {
      return { events: [], venues: [], categories: [] }
    }

    const searchTerm = query.toLowerCase().trim()
    
    // Search events by name and venue name
    const filteredEvents = (state.events || []).filter(event => {
      if (!event) return false
      return (
        event.name?.toLowerCase().includes(searchTerm) ||
        event.social_hub?.name?.toLowerCase().includes(searchTerm) ||
        event.category?.name?.toLowerCase().includes(searchTerm)
      )
    })

    // Search venues by name and address
    const filteredVenues = (state.socialHubs || []).filter(venue => {
      if (!venue) return false
      return (
        venue.name?.toLowerCase().includes(searchTerm) ||
        venue.address?.toLowerCase().includes(searchTerm)
      )
    })

    // Search categories by name
    const filteredCategories = (state.eventCategories || []).filter(category => {
      if (!category) return false
      return category.name?.toLowerCase().includes(searchTerm)
    })

    return {
      events: filteredEvents,
      venues: filteredVenues,
      categories: filteredCategories
    }
  }, [query, state.events, state.socialHubs, state.eventCategories])

  useEffect(() => {
    if (query.trim()) {
      setHasSearched(true)
    } else {
      setHasSearched(false)
    }
  }, [query])

  if (!hasSearched && !query.trim()) {
    return null
  }

  const hasResults = searchData.events.length > 0 || searchData.venues.length > 0 || searchData.categories.length > 0

  if (!hasResults) {
    return (
      <div className="space-y-6">
        <div className="card p-6 text-center">
          <Icon name="search" className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">{t('common.noResultsFound')}</h3>
          <p className="text-sm text-slate-500">{t('common.tryDifferentKeywords')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Events Results */}
      {searchData.events.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-200">
              {t('common.events')} ({searchData.events.length})
            </h3>
            <NavLink 
              to={`/events?search=${encodeURIComponent(query)}`}
              className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span>{t('common.seeMore')}</span>
              <Icon name="arrow-right" className="w-4 h-4" />
            </NavLink>
          </div>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {searchData.events.slice(0, 5).map(event => (
              <div key={event.id} className="min-w-[280px] sm:min-w-[320px] md:min-w-[360px] snap-start flex-shrink-0">
                <EventCard e={event} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Venues Results */}
      {searchData.venues.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-200">
              {t('common.venues')} ({searchData.venues.length})
            </h3>
            <NavLink 
              to={`/venues?search=${encodeURIComponent(query)}`}
              className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span>{t('common.seeMore')}</span>
              <Icon name="arrow-right" className="w-4 h-4" />
            </NavLink>
          </div>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {searchData.venues.slice(0, 5).map(venue => (
              <div key={venue.id} className="min-w-[280px] sm:min-w-[320px] md:min-w-[360px] snap-start flex-shrink-0">
                <SocialHubCard hub={venue} variant="default" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories Results */}
      {searchData.categories.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-200">
              {t('common.categories')} ({searchData.categories.length})
            </h3>
            <NavLink 
              to={`/categories?search=${encodeURIComponent(query)}`}
              className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span>{t('common.seeMore')}</span>
              <Icon name="arrow-right" className="w-4 h-4" />
            </NavLink>
          </div>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {searchData.categories.slice(0, 5).map(category => (
              <NavLink
                key={category.id}
                to={`/events?category=${category.id}`}
                className="min-w-[120px] sm:min-w-[140px] md:min-w-[160px] text-center space-y-3 snap-start flex-shrink-0 hover:scale-105 transition-transform duration-200"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 mx-auto grid place-items-center text-2xl sm:text-3xl shadow-glow hover:shadow-glow-lg transition-all duration-200">
                  🎯
                </div>
                <span className="text-sm sm:text-base font-medium text-slate-300 hover:text-white transition-colors duration-200">
                  {category.name}
                </span>
              </NavLink>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
