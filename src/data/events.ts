export type EventCategory = 'مافیا' | 'تماشای فیلم' | 'تماشای ورزش' | 'گیمینگ گروهی' | 'موسیقی زنده' | 'مطالعه کتاب' | 'تظاهر'

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface SocialHub {
  id: string
  name: string
  address: string
  latitude?: number
  longitude?: number
  owner: {
    id: string
    name: string
  }
  description?: string
  average_rating?: number
  image_url?: string
  postal_code?: number
  events_count: number
  is_favorite?: boolean
}

export interface EventCategoryType {
  id: string
  name: string
  description?: string
  image_url?: string
}

export interface EventItem {
  id: string
  name: string
  description?: string
  start_time: string
  end_time: string
  price: number
  time: string
  category: EventCategoryType
  social_hub: SocialHub
  average_rating?: number
  date: string
  capacity: number
  event_status: EventStatus
  MT: number  // Minimum tickets that user should buy
  MS: number  // Minimum seats that should be filled to start event
  reservations_count: number
  ratings_count: number
  spots_left?: number
  ticket_closing_timer?: number // Hours before event start when tickets close
}

export interface Customer {
  id: string
  f_name: string
  l_name: string
  mobile_number: number
  national_code?: number
  username?: string
  address?: string
  role_name: string
  balance: number
  is_active: boolean
  created_at: string
  latitude?: number
  longitude?: number
  birthday?: string
  email?: string
  favorites: string[]
}

export interface Reservation {
  id: string
  reservation_date: string
  number_of_people: number
  status: ReservationStatus
  customer: Customer
  event: EventItem
}

export interface Rating {
  id: string
  rating: 1 | 2 | 3 | 4 | 5
  social_hub: SocialHub
  customer: Customer
  event: EventItem
}

export interface Comment {
  id: string
  comment: string
  created_at: string
  customer: Customer
  event?: EventItem
  social_hub?: SocialHub
  parent_comment?: string | null
  replies?: Comment[]
}

// Sample Social Hubs
export const socialHubs: SocialHub[] = [
  {
    id: '1',
    name: 'Gaming Paradise Cafe',
    address: '123 Gaming Street, Tech District',
    latitude: 35.7219,
    longitude: 51.3347,
    owner: { id: 'owner1', name: 'John Gaming' },
    description: 'The ultimate gaming destination with high-end PCs and consoles',
    average_rating: 4.8,
    image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
    postal_code: 12345,
    events_count: 15,
    is_favorite: false
  },
  {
    id: '2',
    name: 'Creative Workspace Hub',
    address: '456 Innovation Ave, Creative Quarter',
    latitude: 35.7319,
    longitude: 51.3447,
    owner: { id: 'owner2', name: 'Sarah Creative' },
    description: 'Modern co-working space perfect for workshops and study groups',
    average_rating: 4.6,
    image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop',
    postal_code: 12346,
    events_count: 12,
    is_favorite: true
  },
  {
    id: '3',
    name: 'Music & Arts Center',
    address: '789 Culture Blvd, Arts District',
    latitude: 35.7419,
    longitude: 51.3547,
    owner: { id: 'owner3', name: 'Mike Artist' },
    description: 'Live music venue and art gallery with regular performances',
    average_rating: 4.9,
    image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop',
    postal_code: 12347,
    events_count: 8,
    is_favorite: false
  }
]

// Sample Event Categories
export const eventCategories: EventCategoryType[] = [
  { id: '1', name: 'مافیا', description: 'Mafia game events and tournaments', image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=200&auto=format&fit=crop' },
  { id: '2', name: 'تماشای فیلم', description: 'Movie watching events and film screenings', image_url: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?q=80&w=200&auto=format&fit=crop' },
  { id: '3', name: 'تماشای ورزش', description: 'Sports viewing events and competitions', image_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=200&auto=format&fit=crop' },
  { id: '4', name: 'گیمینگ گروهی', description: 'Group gaming events and multiplayer games', image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=200&auto=format&fit=crop' },
  { id: '5', name: 'موسیقی زنده', description: 'Live music performances and concerts', image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=200&auto=format&fit=crop' },
  { id: '6', name: 'مطالعه کتاب', description: 'Book reading groups and literary events', image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200&auto=format&fit=crop' },
  { id: '7', name: 'تظاهر', description: 'Pretentious and sophisticated events', image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=200&auto=format&fit=crop' }
]

// Sample Events - Updated with proper dates after 25 مهر 1404 (October 16, 2025)
export const events: EventItem[] = [
  // Future Events (after 25 مهر 1404 - October 16, 2025)
  {
    id: '1',
    name: 'Mafia Game Night',
    description: 'Classic mafia game with friends. Snacks and drinks included.',
    start_time: '2025-10-17T20:00:00Z', // October 17, 2025 (tomorrow)
    end_time: '2025-10-17T23:00:00Z',
    price: 15,
    time: '20:00 - 23:00',
    category: eventCategories[0], // مافیا
    social_hub: socialHubs[0],
    average_rating: 4.7,
    date: '2025-10-17',
    capacity: 12,
    event_status: 'upcoming',
    MT: 2,  // User must buy at least 2 tickets
    MS: 6,  // Event needs at least 6 total seats filled to start
    reservations_count: 8,
    ratings_count: 15,
    spots_left: 4,
    ticket_closing_timer: 1 // Tickets close 1 hour before event
  },
  {
    id: '2',
    name: 'Movie Night: Action Films',
    description: 'Watch the latest action movies on big screen with popcorn.',
    start_time: '2025-10-19T19:00:00Z', // October 19, 2025
    end_time: '2025-10-19T22:00:00Z',
    price: 12,
    time: '19:00 - 22:00',
    category: eventCategories[1], // تماشای فیلم
    social_hub: socialHubs[1],
    average_rating: 4.5,
    date: '2025-10-19',
    capacity: 25,
    event_status: 'upcoming',
    MT: 1,  // User must buy at least 1 ticket
    MS: 5,  // Event needs at least 5 total seats filled to start
    reservations_count: 15,
    ratings_count: 8,
    spots_left: 10,
    ticket_closing_timer: 2 // Tickets close 2 hours before event
  },
  {
    id: '3',
    name: 'Football Match Viewing',
    description: 'Watch the big game together with snacks and drinks.',
    start_time: '2025-10-21T18:00:00Z', // October 21, 2025
    end_time: '2025-10-21T21:00:00Z',
    price: 10,
    time: '18:00 - 21:00',
    category: eventCategories[2], // تماشای ورزش
    social_hub: socialHubs[2],
    average_rating: 4.6,
    date: '2025-10-21',
    capacity: 30,
    event_status: 'upcoming',
    MT: 1,  // User must buy at least 1 ticket
    MS: 8,  // Event needs at least 8 total seats filled to start
    reservations_count: 20,
    ratings_count: 12,
    spots_left: 10
  },
  {
    id: '4',
    name: 'Group Gaming Tournament',
    description: 'Multiplayer gaming tournament with prizes for winners.',
    start_time: '2025-10-23T15:00:00Z', // October 23, 2025
    end_time: '2025-10-23T19:00:00Z',
    price: 20,
    time: '15:00 - 19:00',
    category: eventCategories[3], // گیمینگ گروهی
    social_hub: socialHubs[0],
    average_rating: 4.8,
    date: '2025-10-23',
    capacity: 16,
    event_status: 'upcoming',
    MT: 2,  // User must buy at least 2 tickets
    MS: 8,  // Event needs at least 8 total seats filled to start
    reservations_count: 12,
    ratings_count: 6,
    spots_left: 4,
    ticket_closing_timer: 8 // Tickets close 8 hours before event
  },
  {
    id: '5',
    name: 'Live Jazz Performance',
    description: 'Intimate jazz concert with local musicians.',
    start_time: '2025-10-26T20:00:00Z', // October 26, 2025
    end_time: '2025-10-26T22:00:00Z',
    price: 25,
    time: '20:00 - 22:00',
    category: eventCategories[4], // موسیقی زنده
    social_hub: socialHubs[2],
    average_rating: 4.9,
    date: '2025-10-26',
    capacity: 40,
    event_status: 'upcoming',
    MT: 1,  // User must buy at least 1 ticket
    MS: 10,  // Event needs at least 10 total seats filled to start
    reservations_count: 30,
    ratings_count: 18,
    spots_left: 10
  },
  {
    id: '6',
    name: 'Book Club: Sci-Fi Novels',
    description: 'Discuss the latest science fiction novels with fellow readers.',
    start_time: '2025-10-29T18:00:00Z', // October 29, 2025
    end_time: '2025-10-29T20:00:00Z',
    price: 8,
    time: '18:00 - 20:00',
    category: eventCategories[5], // مطالعه کتاب
    social_hub: socialHubs[1],
    average_rating: 4.4,
    date: '2025-10-29',
    capacity: 15,
    event_status: 'upcoming',
    MT: 1,  // User must buy at least 1 ticket
    MS: 5,  // Event needs at least 5 total seats filled to start
    reservations_count: 10,
    ratings_count: 8,
    spots_left: 5
  },
  {
    id: '7',
    name: 'Wine Tasting Evening',
    description: 'Sophisticated wine tasting with expert sommelier.',
    start_time: '2025-10-31T19:00:00Z', // October 31, 2025
    end_time: '2025-10-31T21:30:00Z',
    price: 50,
    time: '19:00 - 21:30',
    category: eventCategories[6], // تظاهر
    social_hub: socialHubs[2],
    average_rating: 4.7,
    date: '2025-10-31',
    capacity: 20,
    event_status: 'upcoming',
    MT: 1,  // User must buy at least 1 ticket
    MS: 6,  // Event needs at least 6 total seats filled to start
    reservations_count: 15,
    ratings_count: 12,
    spots_left: 5
  },

  // Past Events (before 24 مهر - October 15, 2025) - Each venue has at least one past event
  {
    id: '8',
    name: 'Gaming Paradise - Past Mafia Night',
    description: 'Previous mafia game event that has ended.',
    start_time: '2025-10-10T20:00:00Z', // October 10, 2025 (past)
    end_time: '2025-10-10T23:00:00Z',
    price: 15,
    time: '20:00 - 23:00',
    category: eventCategories[0], // مافیا
    social_hub: socialHubs[0],
    average_rating: 4.6,
    date: '2025-10-10',
    capacity: 12,
    event_status: 'completed', // Reached minimum seats
    MT: 2,
    MS: 6,
    reservations_count: 8,
    ratings_count: 12,
    spots_left: 0,
    ticket_closing_timer: 1
  },
  {
    id: '9',
    name: 'Creative Workspace - Past Workshop',
    description: 'Previous workshop event that has ended.',
    start_time: '2025-10-12T18:00:00Z', // October 12, 2025 (past)
    end_time: '2025-10-12T21:00:00Z',
    price: 20,
    time: '18:00 - 21:00',
    category: eventCategories[1], // تماشای فیلم
    social_hub: socialHubs[1],
    average_rating: 4.3,
    date: '2025-10-12',
    capacity: 20,
    event_status: 'cancelled', // Did not reach minimum seats
    MT: 1,
    MS: 8,
    reservations_count: 3,
    ratings_count: 0,
    spots_left: 17,
    ticket_closing_timer: 2
  },
  {
    id: '10',
    name: 'Music & Arts - Past Concert',
    description: 'Previous music event that has ended.',
    start_time: '2025-10-14T19:00:00Z', // October 14, 2025 (past)
    end_time: '2025-10-14T22:00:00Z',
    price: 30,
    time: '19:00 - 22:00',
    category: eventCategories[4], // موسیقی زنده
    social_hub: socialHubs[2],
    average_rating: 4.8,
    date: '2025-10-14',
    capacity: 35,
    event_status: 'completed', // Reached minimum seats
    MT: 1,
    MS: 12,
    reservations_count: 18,
    ratings_count: 15,
    spots_left: 0,
    ticket_closing_timer: 1
  },
  {
    id: '11',
    name: 'Gaming Paradise - Past Tournament',
    description: 'Previous gaming tournament that has ended.',
    start_time: '2025-10-08T15:00:00Z', // October 8, 2025 (past)
    end_time: '2025-10-08T19:00:00Z',
    price: 25,
    time: '15:00 - 19:00',
    category: eventCategories[3], // گیمینگ گروهی
    social_hub: socialHubs[0],
    average_rating: 4.7,
    date: '2025-10-08',
    capacity: 16,
    event_status: 'cancelled', // Did not reach minimum seats
    MT: 2,
    MS: 10,
    reservations_count: 4,
    ratings_count: 0,
    spots_left: 12,
    ticket_closing_timer: 4
  },
  {
    id: '12',
    name: 'Creative Workspace - Past Study Group',
    description: 'Previous study group event that has ended.',
    start_time: '2025-10-06T17:00:00Z', // October 6, 2025 (past)
    end_time: '2025-10-06T19:00:00Z',
    price: 10,
    time: '17:00 - 19:00',
    category: eventCategories[5], // مطالعه کتاب
    social_hub: socialHubs[1],
    average_rating: 4.2,
    date: '2025-10-06',
    capacity: 12,
    event_status: 'completed', // Reached minimum seats
    MT: 1,
    MS: 4,
    reservations_count: 7,
    ratings_count: 6,
    spots_left: 0,
    ticket_closing_timer: 2
  },
  {
    id: '13',
    name: 'Music & Arts - Past Art Exhibition',
    description: 'Previous art exhibition that has ended.',
    start_time: '2025-10-04T16:00:00Z', // October 4, 2025 (past)
    end_time: '2025-10-04T20:00:00Z',
    price: 20,
    time: '16:00 - 20:00',
    category: eventCategories[6], // تظاهر
    social_hub: socialHubs[2],
    average_rating: 4.5,
    date: '2025-10-04',
    capacity: 25,
    event_status: 'cancelled', // Did not reach minimum seats
    MT: 1,
    MS: 8,
    reservations_count: 2,
    ratings_count: 0,
    spots_left: 23,
    ticket_closing_timer: 3
  }
]

export const categories: EventCategory[] = ['مافیا', 'تماشای فیلم', 'تماشای ورزش', 'گیمینگ گروهی', 'موسیقی زنده', 'مطالعه کتاب', 'تظاهر']


