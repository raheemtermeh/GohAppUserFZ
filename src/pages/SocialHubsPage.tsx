import { useState, useEffect } from 'react'
import { NavLink, useSearchParams } from 'react-router-dom'
import { useStore } from '../state/apiStore'
import Icon from '../components/Icon'
import SocialHubCard from '../components/SocialHubCard'
import { useLanguage } from '../contexts/LanguageContext'
import { formatNumber } from '../utils/persianNumbers'

export default function SocialHubsPage() {
  const [searchParams] = useSearchParams()
  const { state, dispatch } = useStore()
  const { t, isRTL, language } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'events'>('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const searchParam = searchParams.get('search')

  // Initialize search query from URL parameter
  useEffect(() => {
    if (searchParam) {
      setSearchQuery(searchParam)
    }
  }, [searchParam])


  // Filter and sort social hubs
  const filteredHubs = state.socialHubs
    .filter(hub => hub && hub.id) // Filter out undefined/null hubs
    .filter(hub => 
      hub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hub.address.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0)
        case 'events':
          return b.events_count - a.events_count
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

  return (
    <div className={`space-y-6 md:space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-responsive-2xl font-bold text-gradient">{t('pages.venues.title')}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="location" className="w-5 h-5 text-purple-400" />
          <span className="text-responsive-sm text-slate-400 style={{ fontSize: '20%' }} ">
            {t('pages.venues.venuesCount').replace('{count}', formatNumber(state.socialHubs.length, language))}
          </span>
        </div>
      </div>
      
      {/* Subtitle */}
      <div className={`${isRTL ? 'text-left' : 'text-left'}`}>
        <p className="text-responsive-sm text-slate-400 mt-1">
          {t('pages.venues.subtitle')}
        </p>
      </div>

      {/* Search and Controls */}
      <div className="card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Icon name="search" className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                placeholder={t('pages.venues.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'events')}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
            >
              <option value="name">{t('pages.venues.sortByName')}</option>
              <option value="rating">{t('pages.venues.sortByRating')}</option>
              <option value="events">{t('pages.venues.sortByEvents')}</option>
            </select>
            
            <div className="flex border border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon name="grid" className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon name="list" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-responsive-lg font-semibold">
            {filteredHubs.length === 1 
              ? t('pages.venues.venueFound').replace('{count}', formatNumber(filteredHubs.length, language))
              : t('pages.venues.venuesFound').replace('{count}', formatNumber(filteredHubs.length, language))
            }
          </h2>
          
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="btn-ghost text-sm"
            >
              {t('pages.venues.clearSearch')}
            </button>
          )}
        </div>

        {filteredHubs.length === 0 ? (
          <div className="card p-8 text-center">
            <Icon name="location" className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">{t('pages.venues.noVenuesFound')}</h3>
            <p className="text-slate-500 mb-4">
              {searchQuery ? t('pages.venues.tryAdjustingSearch') : t('pages.venues.noVenuesMessage')}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn-primary"
              >
                {t('pages.venues.clearSearch')}
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
              : 'space-y-4'
          }>
            {filteredHubs.map(hub => (
              <SocialHubCard
                key={hub.id}
                hub={hub}
                variant={viewMode === 'list' ? 'compact' : 'default'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}










