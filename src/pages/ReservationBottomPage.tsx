import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../state/apiStore'
import { events } from '../data/events'
import Icon from '../components/Icon'
import BackButton from '../components/BackButton'
import { useLanguage } from '../contexts/LanguageContext'
import { formatPersianCurrency, formatPersianNumber, formatCurrency } from '../utils/persianNumbers'
import { apiClient } from '../services/apiClient'

export default function ReservationBottomPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useStore()
  const { t, isRTL, language } = useLanguage()
  const [numberOfPeople, setNumberOfPeople] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'details' | 'confirmation' | 'success'>('details')
  const [eventData, setEventData] = useState<any>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch event data from API
  useEffect(() => {
    const fetchEventData = async () => {
      if (!id) return
      
      try {
        setLoadingEvent(true)
        setError(null)
        
        // Try to get from API first
        const data = await apiClient.get(`events/${id}/`)
        setEventData(data)
      } catch (err) {
        console.error('Failed to fetch event data:', err)
        setError('Failed to load event data')
        
        // Fallback to existing data
        const fallbackEvent = state.events.find(e => e.id === id) || events.find(e => e.id === id)
        if (fallbackEvent) {
          setEventData(fallbackEvent)
        }
      } finally {
        setLoadingEvent(false)
      }
    }
    
    fetchEventData()
  }, [id, state.events])
  
  const event = eventData
  
  if (loadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }
  
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon name="close" className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-400 mb-2">{t('pages.reservation.eventNotFound')}</h2>
          <p className="text-slate-500 mb-4">{error || 'Event could not be found'}</p>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            {t('pages.reservation.goHome')}
          </button>
        </div>
      </div>
    )
  }

  const totalPrice = event.price * numberOfPeople
  const availableSpots = event.capacity - event.reservations_count
  const canReserve = numberOfPeople <= availableSpots && numberOfPeople >= (event.minimum_group_size || 1)

  const handleReserve = async () => {
    if (!state.auth.user) {
      // Store the current URL for redirect after login
      const currentUrl = `/reservation-bottom/${id}`
      dispatch({ type: 'set_redirect_url', url: currentUrl })
      navigate('/login')
      return
    }

    setIsLoading(true)
    
    try {
      // Find the cart item for this event
      const cartItem = state.cart.find(item => item.event.id === event.id && item.status === 'in_progress')
      
      // Create reservation via API
      const reservationData = {
        event: event.id,
        customer: state.auth.user.id,
        number_of_people: numberOfPeople,
        status: 'confirmed' as const,
        reservation_date: new Date().toISOString()
      }
      
      const newReservation = await apiClient.post('reservations/', reservationData)
      
      // Remove from cart since it's now a confirmed reservation
      if (cartItem) {
        dispatch({
          type: 'remove_from_cart',
          cartItemId: cartItem.id
        })
      }
      
      // Update local state with confirmed status
      dispatch({
        type: 'reserve',
        eventId: event.id,
        customerId: state.auth.user.id,
        numberOfPeople,
        status: 'confirmed'
      })
      
      setStep('success')
    } catch (error) {
      console.error('Failed to create reservation:', error)
      // Show user-friendly error message
      alert(`Failed to create reservation: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'details') {
      navigate(`/event/${event.id}`)
    } else if (step === 'confirmation') {
      setStep('details')
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-6 md:p-8 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mx-auto grid place-items-center shadow-glow">
            <Icon name="check" className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <div>
            <h2 className="text-responsive-xl font-bold text-gradient mb-2">{t('pages.reservation.reservationConfirmed')}</h2>
            <p className="text-responsive-sm text-slate-400">
              {t('pages.reservation.reservationConfirmedDesc', { eventName: event.name })}
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
              <span className="text-responsive-sm text-slate-400">{t('pages.reservation.event')}</span>
              <span className="text-responsive-sm font-medium">{event.name}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
              <span className="text-responsive-sm text-slate-400">{t('pages.reservation.dateTime')}</span>
              <span className="text-responsive-sm font-medium">{event.time}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
              <span className="text-responsive-sm text-slate-400">{t('pages.reservation.people')}</span>
              <span className="text-responsive-sm font-medium">{numberOfPeople}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
              <span className="text-responsive-sm text-slate-400">{t('pages.reservation.total')}</span>
              <span className="text-responsive-sm font-bold text-green-400">{formatCurrency(totalPrice, language, t('common.currency'))}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/profile')}
              className="btn-ghost flex-1"
            >
              {t('pages.reservation.viewReservations')}
            </button>
            <button 
              onClick={() => navigate('/')}
              className="btn-primary flex-1"
            >
              {t('pages.reservation.continueExploring')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton fallbackPath="/" />
          <h1 className="text-responsive-lg font-semibold">{t('pages.reservation.title')}</h1>
        </div>
        <div className="w-8 h-8"></div>
      </div>

      <div className="space-y-6">
        {/* Event Info */}
        <div className="card p-4 md:p-6">
          <div className="flex gap-4">
            <img 
              src={event.social_hub.image_url || '/placeholder-event.jpg'} 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover" 
              alt={event.name} 
            />
            <div className="flex-1">
              <h2 className="font-semibold text-responsive-lg">{event.name}</h2>
              <p className="text-responsive-sm text-slate-400 mt-1">{event.social_hub.name}</p>
              <div className="flex items-center gap-4 mt-2 text-responsive-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <Icon name="calendar" className="w-4 h-4" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Icon name="price" className="w-4 h-4" />
                  <span>{formatCurrency(event.price, language, t('common.currency'))}/{t('common.perPerson')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {step === 'details' && (
          <>
            {/* Number of People */}
            <div className="card p-4 md:p-6">
              <h3 className="font-semibold text-responsive-lg mb-4">{t('pages.reservation.numberOfPeople')}</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNumberOfPeople(Math.max(event.minimum_group_size || 1, numberOfPeople - 1))}
                    disabled={numberOfPeople <= (event.minimum_group_size || 1)}
                    className="btn-ghost p-2 rounded-full disabled:opacity-50"
                  >
                    <Icon name="minus" className="w-4 h-4" />
                  </button>
                  <span className="text-responsive-xl font-bold min-w-[3rem] text-center">{formatPersianNumber(numberOfPeople)}</span>
                  <button
                    onClick={() => setNumberOfPeople(Math.min(availableSpots, numberOfPeople + 1))}
                    disabled={numberOfPeople >= availableSpots}
                    className="btn-ghost p-2 rounded-full disabled:opacity-50"
                  >
                    <Icon name="plus" className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-responsive-sm text-slate-400">
                  {t('pages.reservation.spotsAvailable', { count: availableSpots })}
                </div>
              </div>
              <div className="mt-3 p-3 bg-slate-800/40 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-responsive-sm text-slate-400">حداقل تعداد تیم</span>
                  <span className="text-responsive-sm font-medium">{formatPersianNumber(event.minimum_group_size || 1)} {t('pages.reservation.tickets')}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-responsive-sm text-slate-400">{t('pages.reservation.minimumSeats')}</span>
                  <span className="text-responsive-sm font-medium">{formatPersianNumber(event.minimum)} {t('pages.reservation.seats')}</span>
                </div>
                {/* Minimum Seats Progress */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-responsive-sm text-slate-400">{t('pages.reservation.minimumSeatsProgress')}</span>
                    <span className="text-responsive-sm font-medium">
                      {formatPersianNumber(event.reservations_count)}/{formatPersianNumber(event.MS)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (event.reservations_count / event.MS) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={event.reservations_count >= event.MS ? 'text-green-400' : 'text-yellow-400'}>
                      {event.reservations_count < event.MS 
                        ? t('pages.reservation.needMoreSeats', { count: event.MS - event.reservations_count })
                        : t('pages.reservation.minimumMet')
                      }
                    </span>
                    <span className="text-slate-400">
                      {formatPersianNumber(Math.round((event.reservations_count / event.MS) * 100))}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="card p-4 md:p-6">
              <h3 className="font-semibold text-responsive-lg mb-4">{t('pages.reservation.priceBreakdown')}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-responsive-sm text-slate-400">{t('pages.reservation.pricePerPerson')}</span>
                  <span className="text-responsive-sm font-medium">{formatCurrency(event.price, language, t('common.currency'))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-responsive-sm text-slate-400">{t('pages.reservation.numberOfPeople')}</span>
                  <span className="text-responsive-sm font-medium">{formatPersianNumber(numberOfPeople)}</span>
                </div>
                <div className="border-t border-slate-700 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-responsive-lg font-semibold">{t('pages.reservation.total')}</span>
                    <span className="text-responsive-lg font-bold text-green-400">{formatCurrency(totalPrice, language, t('common.currency'))}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                // Add to cart with in-progress status
                dispatch({ 
                  type: 'add_to_cart', 
                  event: event, 
                  numberOfPeople: numberOfPeople 
                })
                setStep('confirmation')
              }}
              disabled={!canReserve}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed hover-scale"
            >
              {t('pages.reservation.continueToConfirmation')}
            </button>
          </>
        )}

        {step === 'confirmation' && (
          <>
            {/* Confirmation Details */}
            <div className="card p-4 md:p-6">
              <h3 className="font-semibold text-responsive-lg mb-4">{t('pages.reservation.confirmReservation')}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                  <span className="text-responsive-sm text-slate-400">{t('pages.reservation.event')}</span>
                  <span className="text-responsive-sm font-medium">{event.name}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                  <span className="text-responsive-sm text-slate-400">{t('pages.reservation.venue')}</span>
                  <span className="text-responsive-sm font-medium">{event.social_hub.name}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                  <span className="text-responsive-sm text-slate-400">{t('pages.reservation.dateTime')}</span>
                  <span className="text-responsive-sm font-medium">{event.time}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                  <span className="text-responsive-sm text-slate-400">{t('pages.reservation.numberOfPeople')}</span>
                  <span className="text-responsive-sm font-medium">{numberOfPeople}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                  <span className="text-responsive-sm text-slate-400">{t('pages.reservation.totalAmount')}</span>
                  <span className="text-responsive-sm font-bold text-green-400">{formatCurrency(totalPrice, language, t('common.currency'))}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="card p-4 md:p-6">
              <h3 className="font-semibold text-responsive-lg mb-3">{t('pages.reservation.termsConditions')}</h3>
              <div className="space-y-2 text-responsive-sm text-slate-400">
                <p>• {t('pages.reservation.terms1')}</p>
                <p>• {t('pages.reservation.terms2')}</p>
                <p>• {t('pages.reservation.terms3')}</p>
                <p>• {t('pages.reservation.terms4')}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('details')}
                className="btn-ghost flex-1"
              >
                {t('pages.reservation.backToDetails')}
              </button>
              <button
                onClick={handleReserve}
                disabled={isLoading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed hover-scale"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t('pages.reservation.processing')}</span>
                  </div>
                ) : (
                  t('pages.reservation.confirmPay', { amount: formatCurrency(totalPrice, language, t('common.currency')) })
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}