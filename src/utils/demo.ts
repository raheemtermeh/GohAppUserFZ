import { Event } from '../services/api'
import { updateEventsStatus, determineEventStatus } from './eventStatusUpdater'

// Demo function to show automatic event status updates
export const demonstrateEventStatusUpdate = () => {
  console.log('=== Automatic Event Status Update Demo ===')
  console.log('Today is: 25 مهر 1404 (October 16, 2025)')
  console.log('')

  // Create sample events with different scenarios
  const sampleEvents: Event[] = [
    {
      id: '1',
      name: 'Gaming Tournament',
      description: 'Weekly gaming tournament',
      start_time: new Date('2025-10-14T19:00:00Z').toISOString(), // 2 days ago
      end_time: new Date('2025-10-14T22:00:00Z').toISOString(),
      price: 50,
      time: '19:00',
      category: { id: '1', name: 'Gaming' },
      social_hub: {
        id: '1',
        name: 'Game Center',
        address: '123 Game St',
        owner: {
          id: '1',
          f_name: 'John',
          l_name: 'Doe',
          email: 'john@gamecenter.com',
          mobile_number: 1234567890,
          role_name: 'owner',
          balance: 0,
          is_active: true,
          created_at: new Date().toISOString()
        },
        events_count: 5
      },
      average_rating: 4.5,
      date: '2025-10-14',
      capacity: 20,
      event_status: 'upcoming',
      minimum: 8,
      reservations_count: 3,
      ratings_count: 15,
      total_reserved_people: 12, // Reached minimum (12 >= 8)
      ticket_closing_timer: 4 // 4 hours before event
    },
    {
      id: '2',
      name: 'Board Game Night',
      description: 'Casual board game evening',
      start_time: new Date('2025-10-15T18:00:00Z').toISOString(), // 1 day ago
      end_time: new Date('2025-10-15T21:00:00Z').toISOString(),
      price: 25,
      time: '18:00',
      category: { id: '2', name: 'Board Games' },
      social_hub: {
        id: '2',
        name: 'Cafe Lounge',
        address: '456 Coffee Ave',
        owner: {
          id: '2',
          f_name: 'Jane',
          l_name: 'Smith',
          email: 'jane@cafelounge.com',
          mobile_number: 9876543210,
          role_name: 'owner',
          balance: 0,
          is_active: true,
          created_at: new Date().toISOString()
        },
        events_count: 3
      },
      average_rating: 4.2,
      date: '2025-10-15',
      capacity: 15,
      event_status: 'upcoming',
      minimum: 6,
      reservations_count: 2,
      ratings_count: 8,
      total_reserved_people: 3, // Did not reach minimum (3 < 6)
      ticket_closing_timer: 2 // 2 hours before event
    },
    {
      id: '3',
      name: 'Movie Night',
      description: 'Weekly movie screening',
      start_time: new Date('2025-10-17T20:00:00Z').toISOString(), // 1 day from now
      end_time: new Date('2025-10-17T23:00:00Z').toISOString(),
      price: 30,
      time: '20:00',
      category: { id: '3', name: 'Entertainment' },
      social_hub: {
        id: '3',
        name: 'Cinema Hall',
        address: '789 Movie Blvd',
        owner: {
          id: '3',
          f_name: 'Bob',
          l_name: 'Johnson',
          email: 'bob@cinemahall.com',
          mobile_number: 5555555555,
          role_name: 'owner',
          balance: 0,
          is_active: true,
          created_at: new Date().toISOString()
        },
        events_count: 7
      },
      average_rating: 4.7,
      date: '2025-10-17',
      capacity: 50,
      event_status: 'upcoming',
      minimum: 10,
      reservations_count: 4,
      ratings_count: 25,
      total_reserved_people: 8,
      ticket_closing_timer: 1 // 1 hour before event
    }
  ]

  console.log('Sample Events Before Status Update:')
  console.log('=====================================')
  sampleEvents.forEach(event => {
    console.log(`📅 ${event.name}`)
    console.log(`   Date: ${event.start_time}`)
    console.log(`   Status: ${event.event_status}`)
    console.log(`   Minimum Required: ${event.minimum} people`)
    console.log(`   Reserved: ${event.total_reserved_people} people`)
    console.log(`   Ticket Closing: ${event.ticket_closing_timer} hours before event`)
    console.log('')
  })

  // Apply automatic status updates
  const updatedEvents = updateEventsStatus(sampleEvents)

  console.log('Sample Events After Automatic Status Update:')
  console.log('============================================')
  updatedEvents.forEach(event => {
    const statusIcon = event.event_status === 'completed' ? '✅' : 
                       event.event_status === 'cancelled' ? '❌' : '⏳'
    
    console.log(`${statusIcon} ${event.name}`)
    console.log(`   Status: ${event.event_status.toUpperCase()}`)
    
    if (event.event_status === 'completed') {
      console.log(`   ✅ Event reached minimum seats (${event.total_reserved_people}/${event.minimum})`)
    } else if (event.event_status === 'cancelled') {
      console.log(`   ❌ Event did not reach minimum seats (${event.total_reserved_people}/${event.minimum})`)
    } else {
      console.log(`   ⏳ Future event - status unchanged`)
    }
    console.log('')
  })

  console.log('Logic Summary:')
  console.log('===============')
  console.log('1. Gaming Tournament: Date passed (Oct 14) + Reached minimum (12/8) → COMPLETED')
  console.log('2. Board Game Night: Date passed (Oct 15) + Did not reach minimum (3/6) → CANCELLED')
  console.log('3. Movie Night: Future event (Oct 17) → UPCOMING (unchanged)')
  console.log('')
  console.log('The system automatically:')
  console.log('- Checks if event date has passed')
  console.log('- Verifies if minimum seats were reached before ticket closing time')
  console.log('- Updates status to "completed" if minimum was met')
  console.log('- Updates status to "cancelled" if minimum was not met')
  console.log('- Leaves future events as "upcoming"')
}

// Run the demonstration
if (typeof window === 'undefined') {
  demonstrateEventStatusUpdate()
}
