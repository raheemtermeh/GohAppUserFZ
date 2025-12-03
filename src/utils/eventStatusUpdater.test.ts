import { Event } from '../services/api'
import { 
  isEventDatePassed, 
  hasReachedMinimumSeatsBeforeClosing, 
  determineEventStatus, 
  needsStatusUpdate,
  updateEventStatus,
  updateEventsStatus 
} from './eventStatusUpdater'

// Test data for different scenarios
const createTestEvent = (overrides: Partial<Event> = {}): Event => ({
  id: '1',
  name: 'Test Event',
  description: 'Test Description',
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
  price: 100,
  time: '19:00',
  category: { id: '1', name: 'Test Category' },
  social_hub: { 
    id: '1', 
    name: 'Test Hub', 
    address: 'Test Address', 
    owner: { id: '1', f_name: 'John', l_name: 'Doe', email: 'john@test.com', mobile_number: 1234567890, role_name: 'owner', balance: 0, is_active: true, created_at: new Date().toISOString() },
    events_count: 1
  },
  average_rating: 4.5,
  date: new Date().toISOString().split('T')[0],
  capacity: 50,
  event_status: 'upcoming',
  minimum: 10,
  reservations_count: 5,
  ratings_count: 10,
  total_reserved_people: 5,
  ticket_closing_timer: 2, // 2 hours before event
  ...overrides
})

describe('Event Status Updater', () => {
  describe('isEventDatePassed', () => {
    it('should return false for future events', () => {
      const futureEvent = createTestEvent({
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      })
      expect(isEventDatePassed(futureEvent)).toBe(false)
    })

    it('should return true for past events', () => {
      const pastEvent = createTestEvent({
        start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
      })
      expect(isEventDatePassed(pastEvent)).toBe(true)
    })
  })

  describe('hasReachedMinimumSeatsBeforeClosing', () => {
    it('should return true when minimum seats reached before ticket closing', () => {
      const event = createTestEvent({
        start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
        minimum: 10,
        total_reserved_people: 15,
        ticket_closing_timer: 2 // 2 hours before event
      })
      expect(hasReachedMinimumSeatsBeforeClosing(event)).toBe(true)
    })

    it('should return false when minimum seats not reached before ticket closing', () => {
      const event = createTestEvent({
        start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
        minimum: 10,
        total_reserved_people: 5,
        ticket_closing_timer: 2 // 2 hours before event
      })
      expect(hasReachedMinimumSeatsBeforeClosing(event)).toBe(false)
    })

    it('should return true when no minimum requirement', () => {
      const event = createTestEvent({
        start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        minimum: 0
      })
      expect(hasReachedMinimumSeatsBeforeClosing(event)).toBe(true)
    })
  })

  describe('determineEventStatus', () => {
    it('should return "upcoming" for future events', () => {
      const futureEvent = createTestEvent({
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      expect(determineEventStatus(futureEvent)).toBe('upcoming')
    })

    it('should return "completed" for past events that reached minimum seats', () => {
      const completedEvent = createTestEvent({
        start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        minimum: 10,
        total_reserved_people: 15,
        ticket_closing_timer: 2
      })
      expect(determineEventStatus(completedEvent)).toBe('completed')
    })

    it('should return "cancelled" for past events that did not reach minimum seats', () => {
      const cancelledEvent = createTestEvent({
        start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        minimum: 10,
        total_reserved_people: 5,
        ticket_closing_timer: 2
      })
      expect(determineEventStatus(cancelledEvent)).toBe('cancelled')
    })
  })

  describe('needsStatusUpdate', () => {
    it('should return true when status needs updating', () => {
      const event = createTestEvent({
        start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        minimum: 10,
        total_reserved_people: 15,
        ticket_closing_timer: 2,
        event_status: 'upcoming' // Should be 'completed'
      })
      expect(needsStatusUpdate(event)).toBe(true)
    })

    it('should return false when status is already correct', () => {
      const event = createTestEvent({
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        event_status: 'upcoming'
      })
      expect(needsStatusUpdate(event)).toBe(false)
    })
  })

  describe('updateEventStatus', () => {
    it('should update event status correctly', () => {
      const event = createTestEvent({
        start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        minimum: 10,
        total_reserved_people: 15,
        ticket_closing_timer: 2,
        event_status: 'upcoming'
      })
      
      const updatedEvent = updateEventStatus(event)
      expect(updatedEvent.event_status).toBe('completed')
    })
  })

  describe('updateEventsStatus', () => {
    it('should update multiple events correctly', () => {
      const events = [
        createTestEvent({
          id: '1',
          start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          minimum: 10,
          total_reserved_people: 15,
          ticket_closing_timer: 2,
          event_status: 'upcoming'
        }),
        createTestEvent({
          id: '2',
          start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          minimum: 10,
          total_reserved_people: 5,
          ticket_closing_timer: 2,
          event_status: 'upcoming'
        }),
        createTestEvent({
          id: '3',
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          event_status: 'upcoming'
        })
      ]

      const updatedEvents = updateEventsStatus(events)
      
      expect(updatedEvents[0].event_status).toBe('completed')
      expect(updatedEvents[1].event_status).toBe('cancelled')
      expect(updatedEvents[2].event_status).toBe('upcoming')
    })
  })
})

// Example usage demonstration
console.log('=== Event Status Updater Demo ===')

// Create sample events for demonstration
const sampleEvents = [
  createTestEvent({
    id: 'event-1',
    name: 'Gaming Tournament',
    start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    minimum: 8,
    total_reserved_people: 12,
    ticket_closing_timer: 4,
    event_status: 'upcoming'
  }),
  createTestEvent({
    id: 'event-2',
    name: 'Board Game Night',
    start_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    minimum: 6,
    total_reserved_people: 3,
    ticket_closing_timer: 2,
    event_status: 'upcoming'
  }),
  createTestEvent({
    id: 'event-3',
    name: 'Movie Night',
    start_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    minimum: 5,
    total_reserved_people: 8,
    ticket_closing_timer: 1,
    event_status: 'upcoming'
  })
]

console.log('Before status update:')
sampleEvents.forEach(event => {
  console.log(`${event.name}: ${event.event_status}`)
})

const updatedEvents = updateEventsStatus(sampleEvents)

console.log('\nAfter status update:')
updatedEvents.forEach(event => {
  console.log(`${event.name}: ${event.event_status}`)
})

console.log('\nExplanation:')
console.log('- Gaming Tournament: Date passed, reached minimum seats (12/8) → COMPLETED')
console.log('- Board Game Night: Date passed, did not reach minimum seats (3/6) → CANCELLED')
console.log('- Movie Night: Future event → UPCOMING')
