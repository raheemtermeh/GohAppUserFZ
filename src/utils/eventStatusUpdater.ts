import { Event } from '../services/api'

/**
 * Utility functions for automatically updating event status based on date and seat requirements
 */

/**
 * Check if an event's date has passed
 * @param event - The event to check
 * @returns true if the event date has passed, false otherwise
 */
export const isEventDatePassed = (event: Event): boolean => {
  if (!event.start_time) return false
  
  const eventDate = new Date(event.start_time)
  const now = new Date()
  
  return eventDate < now
}

/**
 * Check if an event reached minimum seats before ticket closing
 * @param event - The event to check
 * @returns true if minimum seats were reached before ticket closing, false otherwise
 */
export const hasReachedMinimumSeatsBeforeClosing = (event: Event): boolean => {
  if (!event.minimum || !event.ticket_closing_timer || !event.start_time) {
    // If no minimum seats requirement or no ticket closing timer, consider it as met
    return true
  }
  
  const eventDate = new Date(event.start_time)
  const ticketClosingTime = new Date(eventDate.getTime() - (event.ticket_closing_timer * 60 * 60 * 1000))
  const now = new Date()
  
  // If ticket closing time has passed, check if minimum was reached
  if (now > ticketClosingTime) {
    return (event.total_reserved_people || 0) >= event.minimum
  }
  
  // If ticket closing time hasn't passed yet, we can't determine the final status
  return false
}

/**
 * Determine the appropriate status for an event based on date and seat requirements
 * @param event - The event to evaluate
 * @returns The new status for the event
 */
export const determineEventStatus = (event: Event): 'upcoming' | 'ongoing' | 'completed' | 'cancelled' => {
  // If event date hasn't passed, keep it as upcoming
  if (!isEventDatePassed(event)) {
    return 'upcoming'
  }
  
  // If event date has passed, check if it reached minimum seats before ticket closing
  if (hasReachedMinimumSeatsBeforeClosing(event)) {
    return 'completed'
  } else {
    return 'cancelled'
  }
}

/**
 * Check if an event needs status update
 * @param event - The event to check
 * @returns true if the event status should be updated, false otherwise
 */
export const needsStatusUpdate = (event: Event): boolean => {
  const currentStatus = event.event_status
  const newStatus = determineEventStatus(event)
  
  return currentStatus !== newStatus
}

/**
 * Update event status for a single event
 * @param event - The event to update
 * @returns The event with updated status
 */
export const updateEventStatus = (event: Event): Event => {
  const newStatus = determineEventStatus(event)
  
  return {
    ...event,
    event_status: newStatus
  }
}

/**
 * Update event status for multiple events
 * @param events - Array of events to update
 * @returns Array of events with updated statuses
 */
export const updateEventsStatus = (events: Event[]): Event[] => {
  return events.map(event => updateEventStatus(event))
}

/**
 * Filter events that need status updates
 * @param events - Array of events to check
 * @returns Array of events that need status updates
 */
export const getEventsNeedingStatusUpdate = (events: Event[]): Event[] => {
  return events.filter(event => needsStatusUpdate(event))
}

/**
 * Check if ticket sales for an event are closed based on ticket_closing_timer
 * @param event - The event to check
 * @returns true if ticket sales are closed, false otherwise
 */
export const isTicketSalesClosed = (event: Event): boolean => {
  if (!event.start_time) return false
  
  const eventDate = new Date(event.start_time)
  const now = new Date()
  
  // If event has already started or passed, ticket sales are closed
  if (eventDate <= now) {
    return true
  }
  
  // If no ticket closing timer is set, ticket sales are always open (until event starts)
  if (!event.ticket_closing_timer) {
    return false
  }
  
  // Calculate the ticket closing time
  const ticketClosingTime = new Date(eventDate.getTime() - (event.ticket_closing_timer * 60 * 60 * 1000))
  
  // Check if current time is past the ticket closing time
  return now >= ticketClosingTime
}

/**
 * Check if an event is sold out (no available seats)
 * @param event - The event to check
 * @returns true if event is sold out
 */
export const isEventSoldOut = (event: Event): boolean => {
  const totalReserved = event.total_reserved_people || 0
  return event.capacity <= totalReserved
}

/**
 * Filter out events with closed ticket sales
 * @param events - Array of events to filter
 * @returns Array of events with open ticket sales
 */
export const filterEventsWithOpenTicketSales = (events: Event[]): Event[] => {
  return events.filter(event => !isTicketSalesClosed(event))
}

/**
 * Filter out sold-out events (for home page display)
 * @param events - Array of events to filter
 * @returns Array of events that are not sold out
 */
export const filterEventsNotSoldOut = (events: Event[]): Event[] => {
  return events.filter(event => !isEventSoldOut(event))
}

/**
 * Determine event status after ticket closing based on minimum participants
 * This function checks if the event reached minimum participants when ticket sales closed
 * @param event - The event to check
 * @returns 'completed' if minimum was reached, 'cancelled' if not reached
 */
export const getEventStatusAfterTicketClosing = (event: Event): 'completed' | 'cancelled' => {
  // If ticket sales are not closed yet, we can't determine the final status
  if (!isTicketSalesClosed(event)) {
    return 'completed' // Default to completed if ticket sales are still open
  }
  
  // If no minimum requirement, consider it completed
  if (!event.minimum || event.minimum === 0) {
    return 'completed'
  }
  
  // Check if minimum participants were reached
  const totalReserved = event.total_reserved_people || 0
  return totalReserved >= event.minimum ? 'completed' : 'cancelled'
}

/**
 * Check if an event should show as completed (reached minimum participants)
 * @param event - The event to check
 * @returns true if event should show as completed
 */
export const shouldShowEventAsCompleted = (event: Event): boolean => {
  return getEventStatusAfterTicketClosing(event) === 'completed'
}

/**
 * Check if an event should show as cancelled (didn't reach minimum participants)
 * @param event - The event to check
 * @returns true if event should show as cancelled
 */
export const shouldShowEventAsCancelled = (event: Event): boolean => {
  return getEventStatusAfterTicketClosing(event) === 'cancelled'
}

/**
 * Get the correct event status for display purposes across all components
 * This function provides consistent event status determination throughout the app
 * @param event - The event to check
 * @returns The correct status for the event
 */
export const getCorrectEventStatus = (event: Event): 'upcoming' | 'ongoing' | 'completed' | 'cancelled' => {
  // If event is explicitly marked as completed or cancelled in backend, use that
  if (event.event_status === 'completed' || event.event_status === 'cancelled') {
    return event.event_status
  }
  
  // If ticket sales are closed, determine status based on minimum participants
  if (isTicketSalesClosed(event)) {
    return shouldShowEventAsCompleted(event) ? 'completed' : 'cancelled'
  }
  
  // If event date has passed but ticket sales are still open (shouldn't happen normally)
  if (isEventDatePassed(event)) {
    return 'completed'
  }
  
  // Event is still upcoming
  return 'upcoming'
}

/**
 * Check if an event should be considered completed for all purposes
 * This is the single source of truth for determining if an event is completed
 * @param event - The event to check
 * @returns true if event should be considered completed
 */
export const isEventCompleted = (event: Event): boolean => {
  return getCorrectEventStatus(event) === 'completed'
}

/**
 * Check if an event should be considered cancelled for all purposes
 * This is the single source of truth for determining if an event is cancelled
 * @param event - The event to check
 * @returns true if event should be considered cancelled
 */
export const isEventCancelled = (event: Event): boolean => {
  return getCorrectEventStatus(event) === 'cancelled'
}

/**
 * Check if a user can rate/comment on an event
 * User can only rate/comment on events they actually attended (completed events with confirmed reservation)
 * @param event - The event to check
 * @param userReservations - Array of user reservations
 * @returns true if user can rate/comment on this event
 */
export const canUserRateEvent = (event: Event, userReservations: any[]): boolean => {
  // Event must be completed (reached minimum participants)
  if (!isEventCompleted(event)) {
    return false
  }
  
  // User must have a confirmed reservation for this event
  return userReservations.some(reservation => 
    reservation.event.id === event.id && 
    reservation.status === 'confirmed'
  )
}
