import { useState } from 'react'
import { useStore, useUserReservations } from '../state/apiStore'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { formatEventDate } from '../utils/solarHijriCalendar'
import { isTicketSalesClosed, shouldShowEventAsCompleted, canUserRateEvent } from '../utils/eventStatusUpdater'
import { apiService, apiUtils } from '../services/api'
import Icon from './Icon'
import type { Rating, Comment } from '../data/events'

interface RatingReviewProps {
  eventId?: string
  socialHubId?: string
  onClose?: () => void
}

export default function RatingReview({ eventId, socialHubId, onClose }: RatingReviewProps) {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const userReservations = useUserReservations()
  const [rating, setRating] = useState<number>(0)
  const [review, setReview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [participationError, setParticipationError] = useState<string>('')

  // Get completed events for this venue that the user can rate
  // First try to get events where user has confirmed reservations
  const userCompletedEvents = state.events.filter(event => 
    event.social_hub?.id === socialHubId && 
    canUserRateEvent(event, userReservations)
  )

  // If no user-specific events, show all completed events for this venue
  // Check both backend status and frontend logic for completed events
  const allCompletedEvents = state.events.filter(event => {
    if (event.social_hub?.id !== socialHubId) return false
    
    // Check if event is marked as completed in backend
    if (event.event_status === 'completed') return true
    
    // Check if event should be considered completed based on frontend logic
    if (isTicketSalesClosed(event) && shouldShowEventAsCompleted(event)) return true
    
    // Also check if event date has passed and it has participants (fallback)
    if (event.start_time) {
      const eventDate = new Date(event.start_time)
      const now = new Date()
      if (eventDate < now && (event.total_reserved_people || 0) > 0) return true
    }
    
    return false
  })

  // Use user-specific events if available, otherwise show all completed events
  const venueEvents = userCompletedEvents.length > 0 ? userCompletedEvents : allCompletedEvents

  // Check if user participated in selected event (must have confirmed reservation for completed event)
  const hasParticipated = selectedEventId ? 
    canUserRateEvent(
      state.events.find(e => e.id === selectedEventId)!, 
      userReservations
    ) : false

  // For venue ratings, we allow rating any completed event (not just user's events)
  const canRateSelectedEvent = selectedEventId ? 
    (userCompletedEvents.length > 0 ? hasParticipated : true) : false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate rating
    if (!rating || rating === 0 || rating < 1 || rating > 5) {
      alert('لطفاً امتیازی بین 1 تا 5 انتخاب کنید')
      return
    }

    // For venue ratings, validate participation
    if (socialHubId && !eventId) {
      if (!selectedEventId) {
        setParticipationError('لطفاً رویدادی را انتخاب کنید')
        return
      }
      if (!canRateSelectedEvent) {
        setParticipationError('شما در رویداد انتخاب شده حضور نداشتید')
        return
      }
    }

    setParticipationError('')
    setIsSubmitting(true)
    
    try {
      // Submit rating to API - require event
      const targetEventId = eventId || selectedEventId
      if (!targetEventId) {
        alert('لطفاً رویدادی را انتخاب کنید')
        setIsSubmitting(false)
        return
      }

      // Ensure rating is a valid number between 1-5
      const validRating = Math.max(1, Math.min(5, Math.round(rating)))
      
      const ratingData = {
        rating: validRating, // Number between 1-5
        customer: state.auth.user!.id, // User ID
        event: targetEventId, // Event ID
        ...(socialHubId && { social_hub: socialHubId }) // Venue ID (optional, will be set from event if not provided)
      }
      
      console.log('Submitting rating:', ratingData)
      const newRating = await apiService.ratings.create(ratingData)
      dispatch({ type: 'add_rating', rating: newRating })

      // Submit review to API if provided
      if (review.trim()) {
        const commentData = {
          comment: review.trim(),
          customer: state.auth.user!.id,
          event: targetEventId,
          ...(socialHubId && { social_hub: socialHubId }) // Include venue/social_hub if available
        }
        
        const newComment = await apiService.comments.create(commentData)
        dispatch({ type: 'add_comment', comment: newComment })
      }

      // Refresh social hubs data to get updated average ratings
      try {
        const updatedSocialHubs = await apiUtils.getAllSocialHubs()
        const sortedSocialHubs = updatedSocialHubs.sort((a, b) => {
          const ratingA = a.average_rating || 0
          const ratingB = b.average_rating || 0
          return ratingB - ratingA
        })
        dispatch({ type: 'set_social_hubs', socialHubs: sortedSocialHubs })
      } catch (error) {
        console.error('Failed to refresh social hubs after rating:', error)
      }

      // Reset form
      setRating(0)
      setReview('')
      
      // Close modal if provided
      if (onClose) {
        onClose()
      }
    } catch (error: any) {
      console.error('Error submitting review:', error)
      console.error('Error details:', error.response?.data)
      
      // Extract error message
      let errorMessage = error.message || t('pages.reviews.submitFailed')
      
      // Check for specific error types
      if (error.response?.data) {
        const errorData = error.response.data
        
        // Check for field-specific errors
        if (errorData.rating) {
          errorMessage = Array.isArray(errorData.rating) ? errorData.rating[0] : errorData.rating
        } else if (errorData.event) {
          errorMessage = Array.isArray(errorData.event) ? errorData.event[0] : errorData.event
        } else if (errorData.customer) {
          errorMessage = Array.isArray(errorData.customer) ? errorData.customer[0] : errorData.customer
        } else if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors.join(', ') 
            : errorData.non_field_errors
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
        
        // Check for Persian error messages
        if (typeof errorMessage === 'string' && errorMessage.includes('حضور نداشتید')) {
          errorMessage = 'شما در رویداد برگزار شده حضور نداشتید'
        }
      }
      
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!state.auth.user) {
    return (
      <div className="card p-6 text-center">
        <Icon name="user" className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-400 mb-2">{t('pages.reviews.profileRequired')}</h3>
        <p className="text-responsive-sm text-slate-500 mb-6">
          {t('pages.reviews.profileRequiredMessage')}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="btn-ghost px-6 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => {
              // Store the current page URL for redirect after login
              const currentUrl = window.location.pathname
              dispatch({ type: 'set_redirect_url', url: currentUrl })
              navigate('/login')
            }}
            className="btn-primary px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            {t('common.ok')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t('pages.reviews.leaveReview')}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-700/80 hover:bg-slate-600/80 text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 border border-slate-600/50 hover:border-slate-500"
            aria-label="Close modal"
          >
            <span className="text-lg font-bold">×</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Event Selection for Venue Ratings */}
        {socialHubId && !eventId && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              انتخاب رویداد تکمیل شده
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value)
                setParticipationError('')
              }}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">رویدادی را انتخاب کنید</option>
              {venueEvents.map(event => {
                // Get participant count with fallbacks
                const participantCount = event.total_reserved_people || 
                                       event.reservations_count || 
                                       (event.minimum_seats_progress?.currently_reserved) || 
                                       0
                
                return (
                  <option key={event.id} value={event.id}>
                    ✅ {event.name} - {formatEventDate(event.date)} (تکمیل شده - {participantCount} شرکت‌کننده)
                  </option>
                )
              })}
            </select>
            {participationError && (
              <div className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <Icon name="alert-circle" className="w-4 h-4" />
                {participationError}
              </div>
            )}
            {venueEvents.length === 0 && (
              <div className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                <Icon name="info" className="w-4 h-4" />
                {userCompletedEvents.length === 0 && allCompletedEvents.length === 0 
                  ? 'این مکان هنوز رویداد تکمیل شده‌ای ندارد'
                  : 'شما در هیچ رویداد تکمیل شده‌ای از این مکان شرکت نکرده‌اید'
                }
              </div>
            )}
          </div>
        )}

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t('pages.reviews.ratingRequired')}
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`transition-colors ${
                  star <= rating
                    ? 'text-yellow-400 hover:text-yellow-300'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                <Icon name="star" className="w-6 h-6 fill-current" />
              </button>
            ))}
            {rating > 0 && (
              <span className="text-sm text-slate-400 ml-2">
                {rating} {rating !== 1 ? t('pages.reviews.stars') : t('pages.reviews.star')}
              </span>
            )}
          </div>
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t('pages.reviews.reviewOptional')}
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder={t('pages.reviews.shareExperience')}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={500}
          />
          <div className="text-xs text-slate-400 mt-1">
            {review.length}/500 {t('pages.reviews.characterCount')}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={rating === 0 || isSubmitting || (socialHubId && !eventId && venueEvents.length === 0)}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
            rating === 0 || isSubmitting || (socialHubId && !eventId && venueEvents.length === 0)
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white hover-scale'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {t('pages.reviews.submitting')}
            </div>
          ) : (
            t('pages.reviews.submitReview')
          )}
        </button>
      </form>
    </div>
  )
}
