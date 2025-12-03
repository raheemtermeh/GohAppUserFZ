import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useStore, useFilteredEvents } from '../state/apiStore'
import Icon from '../components/Icon'
import FilterChip from '../components/FilterChip'
import EventCard from '../components/EventCard'
import BackButton from '../components/BackButton'
import SolarHijriDatePicker from '../components/SolarHijriDatePicker'
import { useLanguage } from '../contexts/LanguageContext'
import { formatPersianNumber, formatNumberWithCommas, parseFormattedNumber } from '../utils/persianNumbers'

export default function FiltersPage() {
  const { state, dispatch } = useStore()
  const { t, isRTL } = useLanguage()
  const filteredEvents = useFilteredEvents()
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedMinPrice, setSelectedMinPrice] = useState<number>(0)
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number | null>(null)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedMinCapacity, setSelectedMinCapacity] = useState<number>(0)
  const [isApplying, setIsApplying] = useState(false)

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleClearFilters = () => {
    dispatch({ type: 'clear_filters' })
    setSelectedCategories([])
    setSelectedMinPrice(0)
    setSelectedMaxPrice(null)
    setSelectedRating(null)
    setSelectedDate('')
    setSelectedMinCapacity(0)
  }

  const handleMinPriceChange = (value: number) => {
    setSelectedMinPrice(value)
  }

  const handleMaxPriceChange = (value: number | null) => {
    setSelectedMaxPrice(value)
  }

  const handleMinPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFormattedNumber(e.target.value)
    handleMinPriceChange(parsed)
  }

  const handleMaxPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '') {
      handleMaxPriceChange(null)
    } else {
      const parsed = parseFormattedNumber(value)
      handleMaxPriceChange(parsed)
    }
  }

  const handleRatingChange = (rating: number | null) => {
    setSelectedRating(rating)
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
  }

  const handleMinCapacityChange = (capacity: number) => {
    setSelectedMinCapacity(capacity)
  }

  const handleApplyFilters = () => {
    setIsApplying(true)
    // Apply all selected filters
    dispatch({ type: 'clear_filters' })
    
    // Apply categories
    selectedCategories.forEach(categoryId => {
      // Find the category object from store categories
      const categoryObj = (state.eventCategories || []).find(cat => cat.id === categoryId)
      if (categoryObj) {
        dispatch({ type: 'toggle_category', category: categoryObj })
      }
    })
    
    // Apply maximum price filter (store only supports max price)
    if (selectedMaxPrice !== null) {
      dispatch({ type: 'set_max_price', value: selectedMaxPrice })
    }
    
    // Apply rating filter
    if (selectedRating) {
      dispatch({ type: 'set_rating', value: selectedRating })
    }
    
    // Apply date filter only if user selected a date
    if (selectedDate && selectedDate.trim() !== '') {
      dispatch({ type: 'set_date', value: selectedDate })
    }
    
    // Apply capacity filter only if user selected a minimum capacity
    if (selectedMinCapacity > 0) {
      dispatch({ type: 'set_min_capacity', value: selectedMinCapacity })
    }
    // brief visual feedback so user sees the click worked
    setTimeout(() => setIsApplying(false), 800)
  }

  const hasActiveFilters = 
    state.filters.categories.length > 0 ||
    state.filters.maxPrice !== undefined ||
    state.filters.rating !== undefined ||
    state.filters.date !== undefined ||
    state.filters.minCapacity !== undefined

  return (
    <div className={`space-y-6 md:space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton fallbackPath="/" />
          <div className={`text-center sm:text-left`}>
            <h1 className="text-responsive-2xl font-bold text-gradient">{t('common.filters')}</h1>
            <p className="text-responsive-sm text-slate-400 mt-1">
              {t('common.findPerfectEvents')}
            </p>
          </div>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="btn-ghost text-sm hover-scale w-full sm:w-auto"
          >
            <Icon name="close" className="w-4 h-4" />
            <span className={isRTL ? 'mr-1' : 'ml-1'}>{t('common.clearAll')}</span>
          </button>
        )}
      </div>


      {/* Unified Filters Box */}
      <div className="card p-6 md:p-8 space-y-6">
        <h2 className="text-xl md:text-2xl font-bold text-center">{t('common.filters')}</h2>

        {/* Categories */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{t('common.eventCategories')}</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {(state.eventCategories || []).map(category => (
              <FilterChip 
                key={category.id} 
                category={category}
                isActive={selectedCategories.includes(category.id)}
                onClick={() => handleCategoryToggle(category.id)}
              />
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('common.date')}</h3>
          <div className="space-y-2">
            <SolarHijriDatePicker
              value={selectedDate}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full"
            />
          </div>
        </div>

        {/* Minimum Capacity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('common.minimumCapacity')}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{t('common.minimumCapacity')}</span>
              <span className="text-sm font-medium">{selectedMinCapacity} {t('common.people')}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={selectedMinCapacity}
              onChange={(e) => handleMinCapacityChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>0 {t('common.people')}</span>
              <span>100+ {t('common.people')}</span>
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('common.priceRange')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Minimum Price */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400">{t('common.minimumPrice')}</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">$</span>
                <input
                  type="text"
                  value={formatNumberWithCommas(selectedMinPrice)}
                  onChange={handleMinPriceInputChange}
                  className="w-full input text-center"
                  placeholder="0"
                />
              </div>
            </div>
            
            {/* Maximum Price */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400">{t('common.maximumPrice')}</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">$</span>
                <input
                  type="text"
                  value={selectedMaxPrice !== null ? formatNumberWithCommas(selectedMaxPrice) : ''}
                  onChange={handleMaxPriceInputChange}
                  className="w-full input text-center"
                  placeholder={t('common.noLimit')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rating Filter */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{t('common.minimumRating')}</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => handleRatingChange(selectedRating === rating ? null : rating)}
                className={`chip transition-all duration-200 hover-scale flex-shrink-0 ${
                  selectedRating === rating ? 'chip-active' : ''
                }`}
              >
                <div className="flex items-center gap-1">
                  {[...Array(rating)].map((_, i) => (
                    <Icon key={i} name="star" className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-xs sm:text-sm">{isRTL ? formatPersianNumber(rating) : rating}+</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Apply Filters Button */}
      <div className="flex justify-center items-center gap-3">
        <button
          onClick={handleApplyFilters}
          disabled={isApplying}
          className={`btn-primary px-8 py-3 text-lg font-semibold hover-scale ${isApplying ? 'opacity-80 cursor-not-allowed' : ''}`}
        >
          {isApplying ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              {t('common.applyFilters')}
            </span>
          ) : (
            t('common.applyFilters')
          )}
        </button>
        {isRTL && (
          <button
            onClick={handleClearFilters}
            className="btn-ghost px-8 py-3 text-lg font-semibold hover-scale"
          >
            (پاک کردن همه)
          </button>
        )}
      </div>

      {/* Results */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-lg md:text-xl font-bold text-center sm:text-left">
            {t('common.results')} ({filteredEvents.length} {t('common.events')})
          </h2>
          {hasActiveFilters && (
            <div className="flex items-center justify-center sm:justify-start gap-2 text-responsive-sm text-slate-400">
              <Icon name="filter" className="w-4 h-4" />
              <span>{t('common.filtersApplied')}</span>
            </div>
          )}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="search" className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">{t('pages.events.noEventsFound')}</h3>
            <p className="text-responsive-sm text-slate-500 mb-6">
              {t('pages.events.tryAdjustingSearch')}
            </p>
            <button
              onClick={handleClearFilters}
              className="btn-primary hover-scale"
            >
              {t('pages.events.clearAllFilters')}
            </button>
          </div>
        ) : (
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filteredEvents.map(event => (
              <div key={event.id} className="min-w-[240px] sm:min-w-[280px] md:min-w-[320px] lg:min-w-[360px] snap-start flex-shrink-0">
                <EventCard e={event} />
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}