import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useStore, useCart, useCartTotal } from '../state/apiStore'
import Icon from '../components/Icon'
import { useLanguage } from '../contexts/LanguageContext'
import { formatPersianCurrency, formatPersianNumber, toPersianNumbers, formatCountdown, formatCurrency } from '../utils/persianNumbers'
import { apiClient } from '../services/apiClient'

export default function CartPage() {
  const { state, dispatch } = useStore()
  const { t, isRTL, language } = useLanguage()
  const navigate = useNavigate()
  const cartItems = useCart()
  const cartTotal = useCartTotal()
  
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isReserving, setIsReserving] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [reservedEvent, setReservedEvent] = useState<any>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  const inProgressItems = cartItems.filter(item => item.status === 'in_progress')
  const pendingItems = cartItems.filter(item => item.status === 'pending')
  
  // Calculate time remaining for cart items (10 minutes = 600 seconds)
  const CART_EXPIRY_TIME = 10 * 60 * 1000 // 10 minutes in milliseconds
  
  // Get the oldest cart item to calculate countdown
  const oldestCartItem = cartItems.length > 0 ? 
    cartItems.reduce((oldest, current) => 
      new Date(current.addedAt) < new Date(oldest.addedAt) ? current : oldest
    ) : null
  
  // Calculate time remaining
  useEffect(() => {
    if (!oldestCartItem) {
      setTimeRemaining(0)
      return
    }
    
    const addedTime = new Date(oldestCartItem.addedAt).getTime()
    const currentTime = new Date().getTime()
    const elapsed = currentTime - addedTime
    const remaining = Math.max(0, CART_EXPIRY_TIME - elapsed)
    
    setTimeRemaining(remaining)
    
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const newElapsed = now - addedTime
      const newRemaining = Math.max(0, CART_EXPIRY_TIME - newElapsed)
      
      setTimeRemaining(newRemaining)
      
      // If time is up, remove expired items
      if (newRemaining === 0) {
        const expiredItems = cartItems.filter(item => {
          const itemAddedTime = new Date(item.addedAt).getTime()
          const itemElapsed = now - itemAddedTime
          return itemElapsed >= CART_EXPIRY_TIME
        })
        
        expiredItems.forEach(item => {
          dispatch({ type: 'remove_from_cart', cartItemId: item.id })
        })
        
        if (expiredItems.length > 0) {
          dispatch({
            type: 'show_notification',
            message: t('pages.cart.itemsExpired'),
            notificationType: 'warning'
          })
        }
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [cartItems, dispatch, t, oldestCartItem, CART_EXPIRY_TIME])
  
  // Format time remaining as MM:SS with Persian numbers
  const formatTimeRemaining = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return formatCountdown(0, minutes, seconds, language)
  }
  

  const handleCancelReservation = (reservationId: string) => {
    // In a real app, this would make an API call
    console.log('Cancel reservation:', reservationId)
  }

  const handleCheckout = () => {
    // In real app, process payment here
    setShowConfirmation(true)
    setTimeout(() => setShowConfirmation(false), 3000)
  }

  const handleDirectReserve = async (cartItem: any) => {
    if (!state.auth.user) {
      // Store the current URL for redirect after login
      const currentUrl = `/cart`
      dispatch({ type: 'set_redirect_url', url: currentUrl })
      navigate('/login')
      return
    }

    setIsReserving(cartItem.id)
    
    try {
      // Create reservation via API
      const reservationData = {
        event: cartItem.event.id,
        customer: state.auth.user.id,
        number_of_people: cartItem.numberOfPeople,
        status: 'confirmed' as const,
        reservation_date: new Date().toISOString()
      }
      
      const newReservation = await apiClient.post('reservations/', reservationData)
      
      // Remove from cart since it's now a confirmed reservation
      dispatch({
        type: 'remove_from_cart',
        cartItemId: cartItem.id
      })
      
      // Update local state with confirmed status
      dispatch({
        type: 'reserve',
        eventId: cartItem.event.id,
        customerId: state.auth.user.id,
        numberOfPeople: cartItem.numberOfPeople,
        status: 'confirmed'
      })
      
      setReservedEvent(cartItem.event)
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Failed to create reservation:', error)
      alert(`Failed to create reservation: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      setIsReserving(null)
    }
  }

  const removeItem = (cartItemId: string) => {
    dispatch({ type: 'remove_from_cart', cartItemId })
  }

  const handleBulkConfirmReservations = async () => {
    if (!state.auth.user) {
      // Store the current URL for redirect after login
      const currentUrl = `/cart`
      dispatch({ type: 'set_redirect_url', url: currentUrl })
      navigate('/login')
      return
    }

    setIsReserving('bulk')
    
    try {
      const allCartItems = [...inProgressItems, ...pendingItems]
      const confirmedReservations = []
      const errors = []

      // Process all reservations
      for (const cartItem of allCartItems) {
        try {
          const reservationData = {
            event: cartItem.event.id,
            customer: state.auth.user.id,
            number_of_people: cartItem.numberOfPeople,
            status: 'confirmed' as const,
            reservation_date: new Date().toISOString()
          }
          
          const newReservation = await apiClient.post('reservations/', reservationData)
          confirmedReservations.push(newReservation)
          
          // Remove from cart since it's now a confirmed reservation
          dispatch({
            type: 'remove_from_cart',
            cartItemId: cartItem.id
          })
          
          // Update local state with confirmed status
          dispatch({
            type: 'reserve',
            eventId: cartItem.event.id,
            customerId: state.auth.user.id,
            numberOfPeople: cartItem.numberOfPeople,
            status: 'confirmed'
          })
        } catch (error) {
          console.error(`Failed to create reservation for ${cartItem.event.name}:`, error)
          errors.push(`${cartItem.event.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      if (confirmedReservations.length > 0) {
        setReservedEvent({ name: `${confirmedReservations.length} reservations` })
        setShowSuccessModal(true)
      }

      if (errors.length > 0) {
        alert(`Some reservations failed:\n${errors.join('\n')}`)
      }
    } catch (error) {
      console.error('Failed to create bulk reservations:', error)
      alert(`Failed to create reservations: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      setIsReserving(null)
    }
  }

  if (showConfirmation) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-6 sm:space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-r from-green-500 to-teal-500 mx-auto grid place-items-center shadow-glow-teal animate-scale-in">
          <Icon name="check" className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white" />
        </div>
        <div className="space-y-3">
          <h1 className="text-responsive-xl sm:text-responsive-2xl font-bold text-gradient">{t('common.orderConfirmed')}</h1>
          <p className="text-responsive-sm text-slate-400">{t('common.reservationPlacedSuccessfully')}</p>
        </div>
        <div className="space-y-2 sm:space-y-3">
          <p className="text-responsive-sm text-slate-300">{t('common.orderNumber')}: FUNZ-{Date.now().toString().slice(-6)}</p>
          <p className="text-responsive-sm text-slate-300">{t('common.confirmationEmailSent')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <NavLink to="/profile" className="btn-primary">
            {t('common.viewReservations')}
          </NavLink>
          <NavLink to="/events" className="btn-ghost">
            {t('common.browseMoreEvents')}
          </NavLink>
        </div>
      </div>
    )
  }

  if (!state.auth.user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`card p-6 md:p-8 max-w-md w-full text-center space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 mx-auto grid place-items-center shadow-glow">
            <Icon name="cart" className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-responsive-xl font-bold text-gradient">{t('common.signInRequired')}</h1>
            <p className="text-responsive-sm text-slate-400">{t('common.signInToViewCart')}</p>
          </div>
          <NavLink to="/login" className="btn-primary w-full">
            {t('common.signIn')}
          </NavLink>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 md:space-y-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-responsive-2xl font-bold text-gradient">{t('common.myCart')}</h1>
            <p className="text-responsive-sm text-slate-400 mt-1">
              {t('common.manageReservationsAndHistory')}
            </p>
          </div>
        </div>
        
      </div>

      {/* Countdown Timer */}
      {cartItems.length > 0 && timeRemaining > 0 && (
        <div className="card p-4 md:p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
          <div className="flex items-center justify-center gap-3">
            <Icon name="clock" className="w-5 h-5 text-yellow-400" />
            <div className="text-center">
              <div className="text-responsive-xl font-bold text-yellow-400 font-mono">
                {formatTimeRemaining(timeRemaining)}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Cart Content */}
        <div className="space-y-6">
          {inProgressItems.length === 0 && pendingItems.length === 0 ? (
            <div className="card p-6 md:p-8 text-center">
              <Icon name="cart" className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-slate-400 mb-2">{t('common.cartIsEmpty')}</h3>
              <p className="text-responsive-sm text-slate-500 mb-6">
                {t('common.discoverAmazingEvents')}
              </p>
              <NavLink to="/events" className="btn-primary">
                {t('common.browseEvents')}
              </NavLink>
            </div>
          ) : (
            <>
              {/* Pending Items */}
              {pendingItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Icon name="clock" className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-yellow-400">{t('common.pendingReservations')}</h3>
                    <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                      {formatPersianNumber(pendingItems.length)}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {pendingItems.map((cartItem) => (
                      <div key={cartItem.id} className="card p-4 md:p-6 border-l-4 border-yellow-500">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden">
                            {cartItem.event.social_hub?.image_url ? (
                              <img
                                src={cartItem.event.social_hub.image_url}
                                alt={cartItem.event.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-responsive-base truncate">
                                {cartItem.event.name}
                              </h3>
                              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                {t('common.pending')}
                              </span>
                            </div>
                            <p className="text-responsive-sm text-slate-400 mt-1">
                              {cartItem.event.social_hub?.name}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-responsive-sm text-slate-300">
                              <span>{formatPersianNumber(cartItem.numberOfPeople)} {t('common.people')}</span>
                              <span>{formatCurrency(cartItem.totalPrice, language, t('common.currency'))}</span>
                            </div>
                            <div className="mt-2 p-2 bg-yellow-500/10 rounded-lg">
                              <p className="text-xs text-yellow-400">
                                {t('common.pendingReservationWarning')}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(cartItem.id)}
                            className="btn-ghost btn-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Icon name="close" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* In Progress Items */}
              {inProgressItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Icon name="cart" className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-blue-400">{t('common.inProgressReservations')}</h3>
                    <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                      {formatPersianNumber(inProgressItems.length)}
                    </span>
                  </div>
              <div className="space-y-4">
                {inProgressItems.map((cartItem) => (
                  <div key={cartItem.id} className="card p-4 md:p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden">
                        {cartItem.event.social_hub?.image_url ? (
                          <img
                            src={cartItem.event.social_hub.image_url}
                            alt={cartItem.event.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-responsive-base truncate">
                            {cartItem.event.name}
                          </h3>
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                            {t('common.inProgress')}
                          </span>
                        </div>
                        <p className="text-responsive-sm text-slate-400 mt-1">
                          {cartItem.event.social_hub?.name}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-responsive-sm text-slate-300">
                          <span>{formatPersianNumber(cartItem.numberOfPeople)} {t('common.people')}</span>
                          <span>{formatCurrency(cartItem.totalPrice, language, t('common.currency'))}</span>
                        </div>
                        {/* Minimum Seats Progress */}
                        {cartItem.event.minimum_seats_progress && (
                          <div className="mt-3 p-3 bg-slate-800/40 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-responsive-sm text-slate-400">{t('pages.cart.minimumSeats')}</span>
                              <span className="text-responsive-sm font-medium">
                                {cartItem.event.minimum_seats_progress.currently_reserved}/{cartItem.event.minimum_seats_progress.minimum_required}
                              </span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${cartItem.event.minimum_seats_progress.progress_percentage}%` }}
                              ></div>
                            </div>
                            <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                              <span>
                                {cartItem.event.minimum_seats_progress.remaining_needed > 0 
                                  ? t('pages.cart.needMoreSeats', { count: cartItem.event.minimum_seats_progress.remaining_needed })
                                  : t('pages.cart.minimumMet')
                                }
                              </span>
                              <span className={cartItem.event.minimum_seats_progress.meets_requirement ? 'text-green-400' : 'text-yellow-400'}>
                                {Math.round(cartItem.event.minimum_seats_progress.progress_percentage)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(cartItem.id)}
                        className="btn-ghost btn-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Icon name="close" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
                </div>
              )}

              {/* Cart Summary */}
              <div className="card p-4 md:p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-responsive-sm text-slate-400">{t('common.subtotal')}</span>
                    <span className="font-semibold text-responsive-base">{formatCurrency(cartTotal, language, t('common.currency'))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-responsive-sm text-slate-400">{t('common.serviceFee')}</span>
                    <span className="font-semibold text-responsive-base">{formatCurrency(0, language, t('common.currency'))}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-responsive-base font-semibold">{t('common.total')}</span>
                      <span className="text-responsive-lg font-bold text-gradient">{formatCurrency(cartTotal, language, t('common.currency'))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bulk Confirm Button */}
              {(inProgressItems.length > 0 || pendingItems.length > 0) && (
                <div className="card p-4 md:p-6">
                  <div className="text-center space-y-4">
                    <button
                      onClick={handleBulkConfirmReservations}
                      disabled={isReserving === 'bulk'}
                      className="btn-primary btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isReserving === 'bulk' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>{t('common.processing')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Icon name="check" className="w-5 h-5" />
                          <span>{t('pages.cart.confirmAllReservations')}</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      

      {/* Success Modal */}
      {showSuccessModal && reservedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 md:p-8 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mx-auto grid place-items-center shadow-glow">
              <Icon name="check" className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div>
              <h2 className="text-responsive-xl font-bold text-gradient mb-2">{t('pages.reservation.reservationConfirmed')}</h2>
              <p className="text-responsive-sm text-slate-400">
                {t('pages.reservation.reservationConfirmedDesc', { eventName: reservedEvent.name })}
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.reservation.event')}</span>
                <span className="text-responsive-sm font-medium">{reservedEvent.name}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.reservation.dateTime')}</span>
                <span className="text-responsive-sm font-medium">{reservedEvent.time}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.reservation.people')}</span>
                <span className="text-responsive-sm font-medium">{formatPersianNumber(reservedEvent.numberOfPeople || 1)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
                <span className="text-responsive-sm text-slate-400">{t('pages.reservation.total')}</span>
                <span className="text-responsive-sm font-bold text-green-400">{formatCurrency(reservedEvent.price * (reservedEvent.numberOfPeople || 1), language, t('common.currency'))}</span>
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
                onClick={() => {
                  setShowSuccessModal(false)
                  setReservedEvent(null)
                }}
                className="btn-primary flex-1"
              >
                {t('pages.reservation.continueExploring')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
