import { useEffect, useState } from 'react'
import { useStore } from '../state/apiStore'
import { useLanguage } from '../contexts/LanguageContext'

export default function ApiStatusIndicator() {
  const { state } = useStore()
  const { t } = useLanguage()
  const [showSuccess, setShowSuccess] = useState(true)

  const isLoading = state.loading.socialHubs || state.loading.events || state.loading.eventCategories
  const hasError = state.error.socialHubs || state.error.events || state.error.eventCategories
  const hasData = state.socialHubs.length > 0 || state.events.length > 0 || state.eventCategories.length > 0


  // Auto-dismiss success notification after 3 seconds
  useEffect(() => {
    if (hasData && !isLoading && !hasError) {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [hasData, isLoading, hasError])

  if (isLoading) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-blue-500/90 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {t('common.loadingDataFromApi')}
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-red-500/90 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
          <span>⚠️</span>
          {t('common.apiErrorUsingFallback')}
        </div>
      </div>
    )
  }

  if (hasData && showSuccess) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-green-500/90 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
          <span>✅</span>
          {t('common.connectedToApi', { venues: state.socialHubs.length, events: state.events.length })}
          <div className="text-xs opacity-75">
            {t('common.eventsWithImages', { count: state.events.filter(e => e.image_url).length })}
          </div>
        </div>
      </div>
    )
  }

  return null
}
