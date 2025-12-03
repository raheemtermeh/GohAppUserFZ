import { useState, useEffect } from 'react'
import { useUserReservations } from '../state/apiStore'
import { apiClient } from '../services/apiClient'

export function useEnrichedReservations() {
  const userReservations = useUserReservations()
  const [enrichedReservations, setEnrichedReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const enrichReservations = async () => {
      if (userReservations.length === 0) {
        setEnrichedReservations([])
        return
      }

      setLoading(true)
      try {
        // Check if reservations already have event_full field from API
        const enriched = userReservations.map((reservation) => {
          // If event_full is provided by the API, use it
          if (reservation.event_full) {
            return {
              ...reservation,
              event: reservation.event_full
            }
          }

          // If event is already a full object, return as is
          if (typeof reservation.event === 'object' && reservation.event && reservation.event.id) {
            return reservation
          }

          // If event is just an ID string, try to use event_name and other metadata
          if (typeof reservation.event === 'string') {
            // Create fallback event from reservation metadata
            const fallbackEvent = {
              id: reservation.event,
              name: reservation.event_name || 'Event Not Available',
              description: 'Event details are no longer available',
              image_url: null,
              price: reservation.total_amount ? reservation.total_amount / (reservation.number_of_people || 1) : 0,
              category: { name: 'Unknown' },
              social_hub: { 
                name: reservation.venue_name || 'Unknown Venue',
                image_url: null
              },
              event_status: 'cancelled',
              start_time: reservation.event_time || reservation.reservation_date || new Date().toISOString(),
              end_time: reservation.event_time || reservation.reservation_date || new Date().toISOString(),
              date: reservation.event_date || null,
              capacity: 0,
              minimum: 0,
              total_reserved_people: reservation.number_of_people || 0,
              ticket_closing_timer: null,
              requirements: [],
              isDeleted: true, // Flag to identify deleted events
              isFallback: true
            }
            return {
              ...reservation,
              event: fallbackEvent
            }
          }

          // If event is undefined or null, create fallback
          if (!reservation.event) {
            const fallbackEvent = {
              id: null,
              name: reservation.event_name || 'Event Deleted',
              description: 'This event has been deleted',
              image_url: null,
              price: reservation.total_amount ? reservation.total_amount / (reservation.number_of_people || 1) : 0,
              category: { name: 'Unknown' },
              social_hub: { 
                name: reservation.venue_name || 'Unknown Venue',
                image_url: null
              },
              event_status: 'cancelled',
              start_time: reservation.event_time || reservation.reservation_date || new Date().toISOString(),
              end_time: reservation.event_time || reservation.reservation_date || new Date().toISOString(),
              date: reservation.event_date || null,
              capacity: 0,
              minimum: 0,
              total_reserved_people: reservation.number_of_people || 0,
              ticket_closing_timer: null,
              requirements: [],
              isDeleted: true,
              isFallback: true
            }
            return {
              ...reservation,
              event: fallbackEvent
            }
          }

          return reservation
        })

        setEnrichedReservations(enriched)
      } catch (error) {
        console.error('Error enriching reservations:', error)
        setEnrichedReservations(userReservations)
      } finally {
        setLoading(false)
      }
    }

    enrichReservations()
  }, [userReservations])

  return { enrichedReservations, loading }
}
