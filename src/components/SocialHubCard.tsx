import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from '../state/apiStore'
import { useLanguage } from '../contexts/LanguageContext'
import { formatPersianNumber, formatNumber } from '../utils/persianNumbers'
import { toggleFavoriteWithBackend } from '../utils/favoriteUtils'
import { handleImageErrorWithRetry } from '../utils/imageRetry'
import Icon from './Icon'
import SignInPopup from './SignInPopup'
import type { SocialHub } from '../services/api'

interface SocialHubCardProps {
  hub: SocialHub
  variant?: 'default' | 'compact' | 'featured'
}

export default function SocialHubCard({ hub, variant = 'default' }: SocialHubCardProps) {
  const { state, dispatch } = useStore()
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const [showSignInPopup, setShowSignInPopup] = useState(false)
  
  // Add null check for hub
  if (!hub || !hub.id) {
    return null
  }
  
  const isFavorite = state.favorites.includes(hub.id)

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
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

  if (variant === 'compact') {
    return (
      <>
        <NavLink 
        to={`/venue/${hub.id}`} 
        className="block card-compact hover:bg-slate-800/60 transition-all duration-300 group hover-lift"
      >
        <div className="flex gap-3 sm:gap-4">
          <div className="relative flex-shrink-0">
            <img 
              src={hub.image_url || hub.gallery_images?.[0] || '/placeholder-venue.jpg'} 
              className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-cover rounded-lg transition-transform duration-200 group-hover:scale-105" 
              alt={hub.name}
              data-original-src={hub.image_url || hub.gallery_images?.[0] || '/placeholder-venue.jpg'}
              onError={(e) => {
                // Try 2 times, then hide image if still failing
                handleImageErrorWithRetry(e, 2, 500)
              }}
            />
            <button
              onClick={handleToggleFavorite}
              className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 ${
                isFavorite 
                  ? 'bg-red-500 text-white shadow-glow-pink' 
                  : 'bg-black/60 text-white hover:bg-red-500/80'
              }`}
            >
              <Icon name="heart" className={`w-3 h-3 sm:w-4 sm:h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
          <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-responsive-base line-clamp-2 group-hover:text-purple-400 transition-colors">
                {hub.name}
              </h3>
              <div className="flex items-center gap-1 text-xs sm:text-sm">
                <Icon name="star" className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                <span className="text-slate-300">{hub.average_rating ? formatNumber(hub.average_rating, language, 1) : 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400 text-responsive-sm">
              <Icon name="location" className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="line-clamp-1">{hub.address}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
              <span className="text-responsive-sm text-slate-300">
                {formatNumber(hub.events_count, language)} {t('common.events')}
              </span>
              <span className="text-responsive-sm text-green-400 font-medium">
                {hub.owner.name}
              </span>
            </div>
          </div>
        </div>
      </NavLink>
      
      <SignInPopup
        isOpen={showSignInPopup}
        onClose={() => setShowSignInPopup(false)}
        redirectUrl={window.location.pathname + window.location.search}
      />
      </>
    )
  }

  if (variant === 'featured') {
    return (
      <>
        <NavLink 
        to={`/venue/${hub.id}`} 
        className="block card-featured hover:bg-slate-800/60 transition-all duration-300 group hover-lift"
      >
        <div className="relative">
          <img 
            src={hub.image_url || hub.gallery_images?.[0] || '/placeholder-venue.jpg'} 
            className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-t-xl transition-transform duration-200 group-hover:scale-105" 
            alt={hub.name}
            data-original-src={hub.image_url || hub.gallery_images?.[0] || '/placeholder-venue.jpg'}
            onError={(e) => {
              // Try 2 times, then hide image if still failing
              handleImageErrorWithRetry(e, 2, 500)
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-t-xl" />
          
          <button
            onClick={handleToggleFavorite}
            className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${
              isFavorite 
                ? 'bg-red-500 text-white shadow-glow-pink' 
                : 'bg-black/60 text-white hover:bg-red-500/80'
            }`}
          >
            <Icon name="heart" className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
              {hub.name}
            </h3>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Icon name="location" className="w-4 h-4" />
              <span className="line-clamp-1">{hub.address}</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Icon name="star" className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-slate-300 font-medium">
                {hub.average_rating && hub.average_rating > 0 ? formatNumber(hub.average_rating, language, 1) : ''}
              </span>
            </div>
            <span className="text-green-400 font-medium text-sm">
              {hub.owner.name}
            </span>
          </div>

          <p className="text-slate-400 text-responsive-sm line-clamp-2 mb-4">
            {hub.description || 'No description available'}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-responsive-sm text-slate-300">
              {formatNumber(hub.events_count, language)} {t('common.eventsAvailable')}
            </span>
            <div className="flex items-center gap-1 text-purple-400 text-sm font-medium">
              <span>{t('common.viewDetail')}</span>
              <Icon name="arrow-right" className="w-4 h-4" />
            </div>
          </div>
        </div>
      </NavLink>
      
      <SignInPopup
        isOpen={showSignInPopup}
        onClose={() => setShowSignInPopup(false)}
        redirectUrl={window.location.pathname + window.location.search}
      />
      </>
    )
  }

  // Default variant
  return (
    <>
      <NavLink 
      to={`/venue/${hub.id}`} 
      className="block card hover:bg-slate-800/60 transition-all duration-300 group hover-lift"
    >
      <div className="relative">
        <img 
          src={hub.image_url || hub.gallery_images?.[0] || '/placeholder-venue.jpg'} 
          className="w-full h-40 sm:h-48 object-cover rounded-t-xl transition-transform duration-200 group-hover:scale-105" 
          alt={hub.name}
          data-original-src={hub.image_url || hub.gallery_images?.[0] || '/placeholder-venue.jpg'}
          onError={(e) => {
            // Try 2 times, then hide image if still failing
            handleImageErrorWithRetry(e, 2, 500)
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-t-xl" />
        
        <button
          onClick={handleToggleFavorite}
          className={`absolute top-3 right-3 p-1.5 rounded-full transition-all duration-200 ${
            isFavorite 
              ? 'bg-red-500 text-white shadow-glow-pink' 
              : 'bg-black/60 text-white hover:bg-red-500/80'
          }`}
        >
          <Icon name="heart" className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
            {hub.name}
          </h3>
          <div className="flex items-center gap-1 text-white/80 text-sm">
            <Icon name="location" className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="line-clamp-1">{hub.address}</span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Icon name="star" className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-slate-300 font-medium">
              {hub.average_rating && hub.average_rating > 0 ? formatNumber(hub.average_rating, language, 1) : ''}
            </span>
          </div>
          <span className="text-green-400 font-medium text-sm">
            {hub.owner.name}
          </span>
        </div>

        <p className="text-slate-400 text-responsive-sm line-clamp-2 mb-4">
          {hub.description || 'No description available'}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-responsive-sm text-slate-300">
            {formatNumber(hub.events_count, language)} {t('common.events')}
          </span>
          <div className="flex items-center gap-1 text-purple-400 text-sm font-medium">
            <span>{t('common.viewDetail')}</span>
            <Icon name="arrow-right" className="w-4 h-4" />
          </div>
        </div>
      </div>
    </NavLink>
    
    <SignInPopup
      isOpen={showSignInPopup}
      onClose={() => setShowSignInPopup(false)}
      redirectUrl={window.location.pathname + window.location.search}
    />
    </>
  )
}
