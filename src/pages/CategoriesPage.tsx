import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../state/apiStore'
import Icon from '../components/Icon'
import BackButton from '../components/BackButton'
import { useLanguage } from '../contexts/LanguageContext'
import { formatPersianNumber, formatNumber } from '../utils/persianNumbers'

export default function CategoriesPage() {
  const [searchParams] = useSearchParams()
  const { state, dispatch } = useStore()
  const { t, isRTL, language } = useLanguage()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const searchParam = searchParams.get('search')

  // Initialize search query from URL parameter
  useEffect(() => {
    if (searchParam) {
      setSearchQuery(searchParam)
    }
  }, [searchParam])

  const handleCategorySelect = (categoryId: string) => {
    // Navigate to events page with category filter using the category ID
    navigate(`/events?category=${categoryId}`)
  }

  // Map API eventCategories to display format with icons and colors
  const allCategories = (state.eventCategories || []).map(category => {
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
      id: category.id,
      name: category.name,
      description: category.description,
      icon: iconMap[category.name] || '/مافیا.svg',
      color: colorMap[category.name] || 'from-gray-500 to-gray-600'
    }
  })

  // Filter categories based on search
  const categories = allCategories
    .filter(category => {
      if (!searchQuery.trim()) return true
      return category.name.toLowerCase().includes(searchQuery.toLowerCase())
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className={`space-y-6 md:space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <BackButton fallbackPath="/" />
        <div>
          <h1 className="text-responsive-2xl sm:text-responsive-3xl font-bold text-gradient">
            {t('common.categories')}
          </h1>
          <p className="text-responsive-sm text-slate-400 mt-1">
            {t('common.exploreCategories')}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4 md:p-6">
        <div className="relative">
          <Icon name="search" className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 ${isRTL ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            placeholder={t('common.searchCategories')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {categories && categories.length > 0 ? categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategorySelect(category.id)}
            className="bg-slate-800 p-4 md:p-6 text-left transition-all duration-300 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-purple-500"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-20 h-20 flex items-center justify-center text-2xl`}>
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
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-white">{t(`common.categoryNames.${category.name}`) || category.name}</h3>
                <p className="text-sm text-slate-400">{category.description || t('common.exploreEvents')}</p>
              </div>
            </div>
            <div className="text-sm text-slate-300">
              {(() => {
                // Count events for this category
                const eventCount = (state.events || []).filter(event => event.category?.id === category.id).length
                return `${formatNumber(eventCount, language)} ${t('common.events')}`
              })()}
            </div>
          </button>
        )) : (
          <div className="col-span-full text-center py-8">
            <div className="w-12 h-12 text-slate-600 mx-auto mb-4">📅</div>
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No categories available</h3>
            <p className="text-sm text-slate-500">Categories are being loaded...</p>
          </div>
        )}
      </div>

      {/* Link to view all events */}
      <div className="text-center pt-6">
        <NavLink to="/events" className="btn-primary hover-scale">
          <Icon name="calendar" className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className={isRTL ? 'mr-2' : 'ml-2'}>{t('common.viewAllEvents')}</span>
        </NavLink>
      </div>

    </div>
  )
}