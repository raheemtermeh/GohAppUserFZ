import { useState, useEffect } from 'react'
import { useStore, useUserReservations } from '../state/apiStore'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { apiService } from '../services/api'
import { formatEventDate } from '../utils/solarHijriCalendar'
import { isTicketSalesClosed, shouldShowEventAsCompleted, canUserRateEvent, isEventCompleted, getCorrectEventStatus } from '../utils/eventStatusUpdater'
import Icon from './Icon'
import type { Comment } from '../data/events'

interface CommentFormProps {
  eventId?: string
  socialHubId?: string
  onClose?: () => void
}

export default function CommentForm({ eventId, socialHubId, onClose }: CommentFormProps) {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const userReservations = useUserReservations()
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [participationError, setParticipationError] = useState<string>('')

  // Get completed events for this venue that the user can comment on
  // First try to get events where user has confirmed reservations
  const userCompletedEvents = state.events.filter(event => 
    event.social_hub?.id === socialHubId && 
    canUserRateEvent(event, userReservations)
  )

  // If no user-specific events, show all completed events for this venue
  // Use centralized event status logic for consistency
  const allCompletedEvents = state.events.filter(event => {
    if (event.social_hub?.id !== socialHubId) return false
    
    // Use centralized function to determine if event is completed
    return isEventCompleted(event)
  })

  // Debug logging
  console.log('=== COMMENT FORM DEBUG ===')
  console.log('socialHubId:', socialHubId)
  console.log('All events for venue:', state.events.filter(e => e.social_hub?.id === socialHubId))
  console.log('User completed events:', userCompletedEvents)
  console.log('All completed events:', allCompletedEvents)
  console.log('User reservations:', userReservations)
  
  // Debug participant counts
  allCompletedEvents.forEach(event => {
    console.log(`Event "${event.name}":`, {
      total_reserved_people: event.total_reserved_people,
      reservations_count: event.reservations_count,
      capacity: event.capacity,
      minimum: event.minimum
    })
  })

  // Use user-specific events if available, otherwise show all completed events
  const venueEvents = userCompletedEvents.length > 0 ? userCompletedEvents : allCompletedEvents

  // Check if user participated in selected event (must have confirmed reservation for completed event)
  const hasParticipated = selectedEventId ? 
    canUserRateEvent(
      state.events.find(e => e.id === selectedEventId)!, 
      userReservations
    ) : false

  // For venue comments, we allow commenting on any completed event (not just user's events)
  const canCommentOnSelectedEvent = selectedEventId ? 
    (userCompletedEvents.length > 0 ? hasParticipated : true) : false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    // For venue comments, validate participation
    if (socialHubId && !eventId) {
      if (!selectedEventId) {
        setParticipationError('لطفاً رویدادی را انتخاب کنید')
        return
      }
      if (!canCommentOnSelectedEvent) {
        setParticipationError('شما در رویداد انتخاب شده حضور نداشتید')
        return
      }
    }

    setParticipationError('')
    setIsSubmitting(true)
    
    try {
      // Create comment data for API - require event
      const targetEventId = eventId || selectedEventId
      if (!targetEventId) {
        alert('لطفاً رویدادی را انتخاب کنید')
        return
      }

      const commentData = {
        comment: comment.trim(),
        customer: state.auth.user!.id,
        event: targetEventId,
        ...(socialHubId && { social_hub: socialHubId }) // Include venue/social_hub if available
      }
      
      // Submit to API
      const newComment = await apiService.comments.create(commentData)
      
      // Add to local state
      dispatch({ type: 'add_comment', comment: newComment })

      // If this is a venue comment, refresh venue data to get updated comments from API
      if (socialHubId) {
        try {
          const batchResponse = await apiService.socialHubs.getWithRelated(socialHubId)
          dispatch({ type: 'set_events', events: batchResponse.events })
          dispatch({ type: 'set_comments', comments: batchResponse.comments })
          dispatch({ type: 'set_ratings', ratings: batchResponse.ratings })
        } catch (error) {
          console.error('Failed to refresh venue data after comment:', error)
          // Don't fail the comment submission if refresh fails
        }
      }

      // Reset form
      setComment('')
      
      // Close modal if provided
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      
      // Check if it's a validation error about attendance
      if (error.response?.data?.event || error.response?.data?.non_field_errors) {
        const errorMessage = error.response.data.event?.[0] || error.response.data.non_field_errors?.[0]
        if (errorMessage && errorMessage.includes('حضور نداشتید')) {
          alert('شما در رویداد برگزار شده حضور نداشتید')
        } else {
          alert(t('pages.reviews.submitFailed'))
        }
      } else {
        alert(t('pages.reviews.submitFailed'))
      }
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
        <h3 className="text-lg font-semibold">{t('pages.reviews.addComment')}</h3>
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
        {/* Event Selection for Venue Comments */}
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

        {/* Comment Text */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t('pages.reviews.writeComment')}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('pages.reviews.writeComment')}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={500}
            required
          />
          <div className="text-xs text-slate-400 mt-1">
            {comment.length}/500 {t('pages.reviews.characterCount')}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!comment.trim() || isSubmitting || (socialHubId && !eventId && venueEvents.length === 0)}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
            !comment.trim() || isSubmitting || (socialHubId && !eventId && venueEvents.length === 0)
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
            t('pages.reviews.postComment')
          )}
        </button>
      </form>
    </div>
  )
}


