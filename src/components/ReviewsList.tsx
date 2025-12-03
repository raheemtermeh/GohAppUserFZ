import { useState, useEffect } from 'react'
import { useStore } from '../state/apiStore'
import Icon from './Icon'
import type { Comment, Rating } from '../data/events'
import { useLanguage } from '../contexts/LanguageContext'
import { formatSolarHijriDate } from '../utils/solarHijriCalendar'
import { apiService } from '../services/api'

interface ReviewsListProps {
  eventId?: string
  socialHubId?: string
}

export default function ReviewsList({ eventId, socialHubId }: ReviewsListProps) {
  const { state } = useStore()
  const { t } = useLanguage()
  const [reviewsWithReplies, setReviewsWithReplies] = useState<Comment[]>([])
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({})
  
  // Get venue data if socialHubId is provided
  const venue = socialHubId ? state.socialHubs.find(h => h.id === socialHubId) : null
  
  // Filter reviews for this event or social hub (exclude replies)
  const reviews = state.comments.filter(comment => {
    // Skip replies (comments with parent_comment)
    if (comment.parent_comment) return false
    
    const matchesEvent = eventId && (comment.event?.id === eventId || comment.event === eventId)
    const matchesSocialHub = socialHubId && (comment.social_hub?.id === socialHubId || comment.social_hub === socialHubId)
    return matchesEvent || matchesSocialHub
  })

  // Fetch replies for each comment
  useEffect(() => {
    const fetchReplies = async () => {
      const reviewsWithRepliesData = await Promise.all(
        reviews.map(async (review) => {
          try {
            setLoadingReplies(prev => ({ ...prev, [review.id]: true }))
            const repliesResponse = await apiService.comments.getReplies(review.id)
            
            // Handle response format - could be array or paginated object
            let repliesData: Comment[] = []
            if (Array.isArray(repliesResponse)) {
              repliesData = repliesResponse
            } else if (repliesResponse && typeof repliesResponse === 'object') {
              // Check if it's a paginated response
              if ('results' in repliesResponse && Array.isArray(repliesResponse.results)) {
                repliesData = repliesResponse.results
              } else if ('data' in repliesResponse && Array.isArray(repliesResponse.data)) {
                repliesData = repliesResponse.data
              }
            }
            
            console.log(`Replies for comment ${review.id}:`, {
              rawResponse: repliesResponse,
              repliesData,
              count: repliesData.length
            })
            
            // Show all replies - in practice, only owners can reply to comments
            // Filter to ensure we have valid replies with customer data
            const ownerReplies = repliesData.filter((reply: Comment) => {
              // Must have a customer
              if (!reply.customer) {
                return false
              }
              
              // Show all replies that have a customer
              // In practice, only owners can reply, so all replies are from owners
              return true
            })
            
            return {
              ...review,
              replies: ownerReplies
            }
          } catch (err) {
            console.error(`Error fetching replies for comment ${review.id}:`, err)
            return {
              ...review,
              replies: []
            }
          } finally {
            setLoadingReplies(prev => ({ ...prev, [review.id]: false }))
          }
        })
      )
      
      setReviewsWithReplies(reviewsWithRepliesData)
    }

    if (reviews.length > 0) {
      fetchReplies()
    } else {
      setReviewsWithReplies([])
    }
  }, [reviews.map(r => r.id).join(',')])

  // Get ratings for this event or social hub
  const ratings = state.ratings.filter(rating =>
    (eventId && rating.event?.id === eventId) ||
    (socialHubId && rating.social_hub?.id === socialHubId)
  )

  // Use venue's average rating if available, otherwise calculate from individual ratings
  const averageRating = venue?.average_rating || (ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
    : 0)

  const ratingCounts = [5, 4, 3, 2, 1].map(star => 
    ratings.filter(rating => rating.rating === star).length
  )

  if (reviews.length === 0 && ratings.length === 0) {
    return (
      <div className="card p-6 text-center">
        <Icon name="star" className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-400 mb-2">{t('pages.reviews.noReviewsYet')}</h3>
        <p className="text-responsive-sm text-slate-500">
          {t('pages.reviews.beFirstToShare')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {ratings.length > 0 && (
        <div className="card p-4 md:p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient">{averageRating.toFixed(1)}</div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Icon
                    key={star}
                    name="star"
                    className={`w-4 h-4 ${
                      star <= Math.round(averageRating) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {t('pages.reviews.basedOnRatings').replace('{count}', (venue?.ratings_count || ratings.length).toString()).replace('{plural}', (venue?.ratings_count || ratings.length) !== 1 ? 's' : '')}
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star, index) => {
                const count = ratingCounts[index]
                const totalRatings = venue?.ratings_count || ratings.length
                const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0
                
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-sm text-slate-300 w-6">{star}</span>
                    <Icon name="star" className="w-3 h-3 text-yellow-400 fill-current" />
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-400 w-8">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('pages.reviews.reviewsCount').replace('{count}', reviews.length.toString())}</h3>
        </div>
        
        {reviews.length === 0 ? (
          <div className="card p-6 text-center">
            <Icon name="message-circle" className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">{t('pages.reviews.noWrittenReviewsYet')}</h3>
            <p className="text-responsive-sm text-slate-500">
              {t('pages.reviews.shareYourThoughts')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviewsWithReplies.length > 0 ? (
              reviewsWithReplies.map((review) => {
                const fullName = review.customer?.f_name && review.customer?.l_name
                  ? `${review.customer.f_name} ${review.customer.l_name}`
                  : review.customer?.username || t('pages.reviews.anonymous')
                
                return (
                  <div key={review.id} className="card p-4 md:p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-semibold">
                          {fullName[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-responsive-base">
                            {fullName}
                          </h4>
                          <span className="text-responsive-sm text-slate-400">
                            {formatSolarHijriDate(review.created_at, 'YYYY/MM/DD')}
                          </span>
                        </div>
                        <p className="text-responsive-sm text-slate-300 leading-relaxed break-words">
                          {review.comment}
                        </p>
                        
                        {/* Event tag */}
                        {review.event && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-900/30 text-blue-300 border border-blue-700/50">
                              {review.event.name}
                            </span>
                          </div>
                        )}
                        
                        {review.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Icon
                                key={star}
                                name="star"
                                className={`w-3 h-3 ${
                                  star <= review.rating! 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-slate-600'
                                }`}
                              />
                            ))}
                            <span className="text-xs text-slate-400 ml-1">
                              {review.rating}/5
                            </span>
                          </div>
                        )}

                        {/* Replies Section - Only show if owner has replied to this comment */}
                        {review.replies && review.replies.length > 0 && (
                          <div className="mt-4 space-y-3 border-t border-slate-700 pt-4">
                            <h5 className="text-responsive-sm font-medium text-slate-300 mb-2">
                              پاسخ مالک:
                            </h5>
                            {review.replies.map((reply) => {
                              const replyFullName = reply.customer?.f_name && reply.customer?.l_name
                                ? `${reply.customer.f_name} ${reply.customer.l_name}`
                                : reply.customer?.username || 'مالک'
                              
                              return (
                                <div key={reply.id} className="bg-slate-700/50 p-3 rounded-lg ml-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-responsive-xs font-medium text-purple-400">
                                      {replyFullName}
                                    </span>
                                    <span className="text-responsive-xs text-slate-400">
                                      {formatSolarHijriDate(reply.created_at, 'YYYY/MM/DD')}
                                    </span>
                                  </div>
                                  <p className="text-responsive-sm text-slate-300 break-words">{reply.comment}</p>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Loading indicator for replies */}
                        {loadingReplies[review.id] && (
                          <div className="mt-4 text-responsive-xs text-slate-400">
                            در حال بارگذاری پاسخ‌ها...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="card p-4 md:p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {review.customer?.username?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-responsive-base">
                          {review.customer?.username || t('pages.reviews.anonymous')}
                        </h4>
                        <span className="text-responsive-sm text-slate-400">
                          {formatSolarHijriDate(review.created_at, 'YYYY/MM/DD')}
                        </span>
                      </div>
                      <p className="text-responsive-sm text-slate-300 leading-relaxed break-words">
                        {review.comment}
                      </p>
                      
                      {/* Event tag */}
                      {review.event && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-900/30 text-blue-300 border border-blue-700/50">
                            {review.event.name}
                          </span>
                        </div>
                      )}
                      
                      {review.rating && (
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Icon
                              key={star}
                              name="star"
                              className={`w-3 h-3 ${
                                star <= review.rating! 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-slate-600'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-slate-400 ml-1">
                            {review.rating}/5
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}