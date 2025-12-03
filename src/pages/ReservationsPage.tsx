import { useState, useEffect } from 'react'
import { useSearchParams, NavLink } from 'react-router-dom'
import { useStore, useUserReservations, useCart } from '../state/apiStore'
import { useEnrichedReservations } from '../hooks/useEnrichedReservations'
import Icon from '../components/Icon'
import BackButton from '../components/BackButton'
import { useLanguage } from '../contexts/LanguageContext'
import { formatNumber, formatDate } from '../utils/persianNumbers'
import { apiClient } from '../services/apiClient'
import { apiService } from '../services/api'
import { getCorrectEventStatus } from '../utils/eventStatusUpdater'

export default function ReservationsPage() {
  const { state, dispatch } = useStore()
  const { t, isRTL, language } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const userReservations = useUserReservations()
  const cartItems = useCart()
  const { enrichedReservations, loading: enriching } = useEnrichedReservations()
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Get status from URL params
  useEffect(() => {
    const status = searchParams.get('status')
    if (status) {
      setSelectedStatus(status)
    }
  }, [searchParams])

  // Filter out pending reservations - they should not be shown
  const nonPendingReservations = enrichedReservations.filter(r => r.status !== 'pending')
  
  // Helper function to determine effective status for a reservation
  // Reservations with completed events should be treated as completed
  const getEffectiveStatus = (reservation: any): string => {
    const event = reservation.event
    if (event) {
      const correctEventStatus = getCorrectEventStatus(event)
      // If event is completed, treat reservation as completed regardless of reservation status
      if (correctEventStatus === 'completed') {
        return 'completed'
      }
      // If event is cancelled or deleted, treat reservation as cancelled
      if (correctEventStatus === 'cancelled' || event.isDeleted) {
        return 'cancelled'
      }
    }
    // Otherwise use the reservation's actual status
    return reservation.status
  }
  
  // Filter reservations by status
  const filteredReservations = nonPendingReservations.filter(reservation => {
    if (selectedStatus === 'all') return true
    
    const effectiveStatus = getEffectiveStatus(reservation)
    return effectiveStatus === selectedStatus
  })

  // Calculate statistics (excluding pending)
  // Count reservations with completed events as completed, not confirmed
  const stats = {
    confirmed: nonPendingReservations.filter(r => {
      const effectiveStatus = getEffectiveStatus(r)
      return effectiveStatus === 'confirmed'
    }).length,
    completed: nonPendingReservations.filter(r => {
      const effectiveStatus = getEffectiveStatus(r)
      return effectiveStatus === 'completed'
    }).length,
    cancelled: nonPendingReservations.filter(r => {
      const effectiveStatus = getEffectiveStatus(r)
      return effectiveStatus === 'cancelled'
    }).length,
    all: nonPendingReservations.length
  }

  const handleStatusClick = (status: string) => {
    setSelectedStatus(status)
    setSearchParams({ status })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'green'
      case 'completed': return 'purple'
      case 'cancelled': return 'red'
      case 'all': return 'blue'
      default: return 'slate'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return t('common.confirmed')
      case 'completed': return t('common.completed')
      case 'cancelled': return t('common.cancelled')
      case 'all': return t('common.all')
      default: return status
    }
  }

  if (!state.auth.user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`card p-6 md:p-8 max-w-md w-full text-center space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-purple-500 to-teal-500 mx-auto grid place-items-center shadow-glow">
            <Icon name="calendar" className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-responsive-xl font-bold text-gradient">{t('common.signInRequired')}</h1>
            <p className="text-responsive-sm text-slate-400">{t('common.signInToViewReservations')}</p>
          </div>
          <NavLink to="/login" className="btn-primary w-full">
            {t('common.signIn')}
          </NavLink>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 md:space-y-8 lg:space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton fallbackPath="/" />
          <div>
            <h1 className="text-responsive-2xl font-bold text-gradient">{t('common.myReservations')}</h1>
            <p className="text-responsive-sm text-slate-400 mt-1">
              {t('common.manageYourReservations')}
            </p>
          </div>
        </div>
        <NavLink to="/profile" className="btn-ghost p-3 rounded-full hover-scale">
          <Icon name="user" className="w-5 h-5 sm:w-6 sm:h-6" />
        </NavLink>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { status: 'all', icon: 'calendar' as const, label: t('common.all') },
          { status: 'confirmed', icon: 'check' as const, label: t('common.confirmed') },
          { status: 'completed', icon: 'star' as const, label: t('common.completed') },
          { status: 'cancelled', icon: 'close' as const, label: t('common.cancelled') }
        ].map(({ status, icon, label }) => (
          <button
            key={status}
            onClick={() => handleStatusClick(status)}
            className={`card p-3 sm:p-4 text-center transition-all duration-200 hover-scale ${
              selectedStatus === status ? 'ring-2 ring-purple-500/50 shadow-glow' : ''
            }`}
          >
            <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-${getStatusColor(status)}-500/20 mx-auto mb-2 sm:mb-3 flex items-center justify-center`}>
              <Icon name={icon} className={`w-4 h-4 sm:w-6 sm:h-6 text-${getStatusColor(status)}-400`} />
            </div>
            <h3 className="font-semibold text-sm sm:text-base">{formatNumber(stats[status as keyof typeof stats], language)}</h3>
            <p className="text-xs sm:text-sm text-slate-400">{label}</p>
          </button>
        ))}
      </div>

      {/* Reservations List */}
      <div className="space-y-6">
        {enriching ? (
          <div className="card p-6 md:p-8 text-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">{t('common.loading')}</p>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="card p-6 md:p-8 text-center">
            <Icon name="calendar" className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-slate-400 mb-2">
              {selectedStatus === 'all' 
                ? t('common.noReservationsYet')
                : t('common.noReservationsForStatus', { status: getStatusText(selectedStatus) })
              }
            </h3>
            <p className="text-responsive-sm text-slate-500 mb-6">
              {selectedStatus === 'all'
                ? t('common.startExploringEventsAndMakeFirstReservation')
                : t('common.tryDifferentStatus')
              }
            </p>
            <NavLink to="/events" className="btn-primary">
              {t('common.browseEvents')}
            </NavLink>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredReservations.map((reservation) => (
              <div key={reservation.id} className="card p-3 sm:p-4 md:p-4">
                {/* Mobile Layout */}
                <div className="flex flex-col md:hidden gap-3">
                  {/* Event Image */}
                  <div className="w-full h-32 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden">
                    {reservation.event?.image_url || reservation.event?.gallery_image_urls?.[0] || reservation.event?.social_hub?.image_url ? (
                      <img
                        src={reservation.event?.image_url || reservation.event?.gallery_image_urls?.[0] || reservation.event?.social_hub?.image_url}
                        alt={reservation.event?.name || 'Event'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="calendar" className="w-12 h-12 text-slate-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Event Name and Status */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-slate-200 flex-1">
                        {reservation.event?.name || 'Unknown Event'}
                      </h3>
                      <span className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap flex-shrink-0 ${
                        (() => {
                          const effectiveStatus = getEffectiveStatus(reservation)
                          return effectiveStatus === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                 effectiveStatus === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                 'bg-red-500/20 text-red-400'
                        })()
                      }`}>
                        {reservation.event ? 
                          (() => {
                            if (reservation.event.isDeleted) {
                              return t('common.eventDeleted')
                            }
                            const correctEventStatus = getCorrectEventStatus(reservation.event)
                            if (correctEventStatus === 'completed') {
                              return t('common.eventCompleted')
                            } else if (correctEventStatus === 'cancelled') {
                              return t('common.eventCancelled')
                            } else {
                              return getStatusText(reservation.status)
                            }
                          })() : 
                          getStatusText(reservation.status)
                        }
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mb-3">
                      {reservation.event?.social_hub?.name || 'Unknown Venue'}
                    </p>
                    
                    {/* Ticket Details Box */}
                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-2">
                      {/* People */}
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
                        <span className="text-xs text-slate-400">{t('common.people')}</span>
                        <span className="text-sm font-bold text-slate-200">
                          {formatNumber(reservation.number_of_people, language)}
                        </span>
                      </div>
                      
                      {/* Total Amount */}
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
                        <span className="text-xs text-slate-400">{t('pages.reservation.totalAmount')}</span>
                        <span className="text-sm font-bold text-green-400">
                          ${formatNumber((reservation.event?.price || 0) * (reservation.number_of_people || 0), language)}
                        </span>
                      </div>
                      
                      {/* Date */}
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-slate-400">{t('common.date')}</span>
                        <span className="text-sm font-bold text-slate-200 text-right">
                          {formatDate(reservation.reservation_date, language, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  {(() => {
                    const effectiveStatus = getEffectiveStatus(reservation)
                    if (selectedStatus === 'confirmed' && effectiveStatus === 'confirmed' && reservation.status === 'confirmed') {
                      return (
                        <button
                          onClick={async () => {
                            if (confirm(t('common.confirmCancelReservation'))) {
                              try {
                                await apiService.reservations.partialUpdate(reservation.id, { status: 'cancelled' })
                                dispatch({ type: 'cancel_reservation', reservationId: reservation.id })
                                if (state.auth.user) {
                                  try {
                                    const reservationsData = await apiService.reservations.list({ customer_id: state.auth.user.id }) as any
                                    dispatch({ type: 'set_reservations', reservations: reservationsData.results || reservationsData })
                                  } catch (refreshError) {
                                    console.error('Failed to refresh reservations:', refreshError)
                                  }
                                }
                                alert(t('common.reservationCancelled'))
                                if (selectedStatus === 'confirmed') {
                                  setSelectedStatus('cancelled')
                                  setSearchParams({ status: 'cancelled' })
                                }
                              } catch (error) {
                                console.error('Failed to cancel reservation:', error)
                                alert(t('common.failedToCancelReservation'))
                              }
                            }
                          }}
                          className="btn-ghost btn-sm w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Icon name="close" className="w-4 h-4" />
                          {t('common.cancel')}
                        </button>
                      )
                    }
                    return null
                  })()}
                </div>

                {/* Desktop/Laptop Layout */}
                <div className="hidden md:flex gap-4">
                  {/* Event Image */}
                  <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden">
                    {reservation.event?.image_url || reservation.event?.gallery_image_urls?.[0] || reservation.event?.social_hub?.image_url ? (
                      <img
                        src={reservation.event?.image_url || reservation.event?.gallery_image_urls?.[0] || reservation.event?.social_hub?.image_url}
                        alt={reservation.event?.name || 'Event'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="calendar" className="w-10 h-10 text-slate-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="flex-1 min-w-0">
                    {/* Event Name, Status, and Venue */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <h3 className="font-semibold text-lg lg:text-xl text-slate-200 flex-1">
                          {reservation.event?.name || 'Unknown Event'}
                        </h3>
                        <span className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap flex-shrink-0 ${
                          (() => {
                            const effectiveStatus = getEffectiveStatus(reservation)
                            return effectiveStatus === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                   effectiveStatus === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                   'bg-red-500/20 text-red-400'
                          })()
                        }`}>
                          {reservation.event ? 
                            (() => {
                              if (reservation.event.isDeleted) {
                                return t('common.eventDeleted')
                              }
                              const correctEventStatus = getCorrectEventStatus(reservation.event)
                              if (correctEventStatus === 'completed') {
                                return t('common.eventCompleted')
                              } else if (correctEventStatus === 'cancelled') {
                                return t('common.eventCancelled')
                              } else {
                                return getStatusText(reservation.status)
                              }
                            })() : 
                            getStatusText(reservation.status)
                          }
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        {reservation.event?.social_hub?.name || 'Unknown Venue'}
                      </p>
                    </div>
                    
                    {/* Ticket Details Box */}
                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 lg:p-4">
                      <div className="grid grid-cols-3 gap-4 lg:gap-6">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400 mb-1">{t('common.people')}</span>
                          <span className="text-lg lg:text-xl font-bold text-slate-200">
                            {formatNumber(reservation.number_of_people, language)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400 mb-1">{t('pages.reservation.totalAmount')}</span>
                          <span className="text-lg lg:text-xl font-bold text-green-400">
                            ${formatNumber((reservation.event?.price || 0) * (reservation.number_of_people || 0), language)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400 mb-1">{t('common.date')}</span>
                          <span className="text-lg lg:text-xl font-bold text-slate-200">
                            {formatDate(reservation.reservation_date, language, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col justify-start gap-2 flex-shrink-0">
                    {(() => {
                      const effectiveStatus = getEffectiveStatus(reservation)
                      if (selectedStatus === 'confirmed' && effectiveStatus === 'confirmed' && reservation.status === 'confirmed') {
                        return (
                          <button
                            onClick={async () => {
                              if (confirm(t('common.confirmCancelReservation'))) {
                                try {
                                  await apiService.reservations.partialUpdate(reservation.id, { status: 'cancelled' })
                                  dispatch({ type: 'cancel_reservation', reservationId: reservation.id })
                                  if (state.auth.user) {
                                    try {
                                      const reservationsData = await apiService.reservations.list({ customer_id: state.auth.user.id }) as any
                                      dispatch({ type: 'set_reservations', reservations: reservationsData.results || reservationsData })
                                    } catch (refreshError) {
                                      console.error('Failed to refresh reservations:', refreshError)
                                    }
                                  }
                                  alert(t('common.reservationCancelled'))
                                  if (selectedStatus === 'confirmed') {
                                    setSelectedStatus('cancelled')
                                    setSearchParams({ status: 'cancelled' })
                                  }
                                } catch (error) {
                                  console.error('Failed to cancel reservation:', error)
                                  alert(t('common.failedToCancelReservation'))
                                }
                              }
                            }}
                            className="btn-ghost btn-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 whitespace-nowrap"
                          >
                            <Icon name="close" className="w-4 h-4" />
                            {t('common.cancel')}
                          </button>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
