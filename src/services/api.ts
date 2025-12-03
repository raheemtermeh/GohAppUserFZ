// API service for Django backend integration
import { updateEventsStatus } from '../utils/eventStatusUpdater'
import { apiClient } from './apiClient'
import { API_CONFIG } from '../config/api'

// Mock image URLs for venues and events (you can replace these with real images)
const MOCK_VENUE_IMAGES = [
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1535223289827-42f1e9919769?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'
]

const MOCK_EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop', // Gaming
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800&auto=format&fit=crop', // Music
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop', // Entertainment
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop', // Education
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop', // Sports
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop', // Food
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop', // Workshop
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=800&auto=format&fit=crop', // Study
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800&auto=format&fit=crop', // Cowork
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop'  // Tournament
]

// Helper function to get a mock image URL for venues
const getMockVenueImageUrl = (id: string): string => {
  const index = Math.abs(id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % MOCK_VENUE_IMAGES.length
  return MOCK_VENUE_IMAGES[index]
}

// Helper function to get a mock image URL for events
const getMockEventImageUrl = (id: string, categoryName?: string): string => {
  // Use category-based images if available
  const categoryIndex = categoryName ? 
    Math.abs(categoryName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % MOCK_EVENT_IMAGES.length :
    Math.abs(id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % MOCK_EVENT_IMAGES.length
  
  return MOCK_EVENT_IMAGES[categoryIndex]
}

// Types matching Django models
export interface Customer {
  id: string
  f_name: string
  l_name: string
  mobile_number: number
  national_code?: number
  username?: string
  email?: string
  address?: string
  role_name: string
  balance: number
  is_active: boolean
  created_at: string
  latitude?: number
  longitude?: number
  birthday?: string
  favorites: string[]
}

export interface Owner {
  id: string
  f_name: string
  l_name: string
  name?: string // Keep for backward compatibility
  email: string
  mobile_number: number
  national_code?: number
  username?: string
  address?: string
  role_name: string
  balance: number
  is_active: boolean
  created_at: string
}

export interface SocialHub {
  id: string
  name: string
  address: string
  latitude?: number
  longitude?: number
  owner: Owner
  description?: string
  average_rating?: number
  image_url?: string
  postal_code?: number
  events_count: number
  amenities?: string[]
}

export interface EventCategory {
  id: string
  name: string
  description?: string
  image_url?: string
}

export interface Event {
  id: string
  name: string
  description?: string
  start_time: string
  end_time: string
  price: number
  time: string
  category: EventCategory
  social_hub: SocialHub
  average_rating?: number
  date: string
  capacity: number
  event_status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  minimum: number
  reservations_count: number
  ratings_count: number
  total_reserved_people: number
  image_url?: string // Added for mock images
  ticket_closing_timer?: number // Hours before event start when tickets close
  requirements?: string[] // Event requirements as JSON array
}

export interface Reservation {
  id: string
  reservation_date: string
  number_of_people: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  customer: Customer
  event: Event
}

export interface Rating {
  id: string
  rating: 1 | 2 | 3 | 4 | 5
  social_hub: SocialHub
  customer: Customer
  event: Event
}

export interface Comment {
  id: string
  comment: string
  created_at: string
  customer: Customer
  event?: Event
  social_hub?: SocialHub
  parent_comment?: string | null
  replies?: Comment[]
}

export interface TicketComment {
  id: string
  ticket: string
  user: string
  author_name: string
  content: string
  is_admin: boolean
  created_at: string
}

export interface SupportTicket {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'Technical' | 'Payment' | 'Account' | 'Billing' | 'Feature Request' | 'Other'
  user: string
  user_name: string
  customer_id?: string
  owner_id?: string
  created_at: string
  updated_at: string
  comments: TicketComment[]
  comment_count: number
}

// API Response types
interface ApiResponse<T> {
  count: number
  next?: string
  previous?: string
  results: T[]
}

interface ApiError {
  detail?: string
  [key: string]: any
}

// Removed duplicate ApiClient class - using centralized one from apiClient.ts

// Use the centralized API client from apiClient.ts

// API Service functions with caching
export const apiService = {
  // Customers
  customers: {
    list: (params?: Record<string, any>) => 
      apiClient.get<ApiResponse<Customer>>('/customers/', params, {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5 minutes
        tags: ['customers', 'customers_list'],
      }),
    
    get: (id: string) => 
      apiClient.get<Customer>(`/customers/${id}/`, undefined, {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5 minutes
        tags: ['customers', `customer_${id}`],
      }),
    
    create: (data: Partial<Customer>) => 
      apiClient.post<Customer>('/customers/', data, ['customers', 'customers_list']),
    
    update: (id: string, data: Partial<Customer>) => 
      apiClient.put<Customer>(`/customers/${id}/`, data, ['customers', 'customers_list', `customer_${id}`]),
    
    partialUpdate: (id: string, data: Partial<Customer>) => 
      apiClient.patch<Customer>(`/customers/${id}/`, data, ['customers', 'customers_list', `customer_${id}`]),
    
    delete: (id: string) => 
      apiClient.delete<void>(`/customers/${id}/`, ['customers', 'customers_list', `customer_${id}`]),
    
    addFavorite: (customerId: string, socialHubId: string) =>
      apiClient.post('/customers/add-favorite/', {
        customer_id: customerId,
        social_hub_id: socialHubId,
        message: 'Added to favorites'
      }, ['customers', `customer_${customerId}`, 'social_hubs', `social_hub_${socialHubId}`]),
    
    removeFavorite: (customerId: string, socialHubId: string) =>
      apiClient.post('/customers/remove-favorite/', {
        customer_id: customerId,
        social_hub_id: socialHubId,
        message: 'Removed from favorites'
      }, ['customers', `customer_${customerId}`, 'social_hubs', `social_hub_${socialHubId}`]),
  },

  // Social Hubs
  socialHubs: {
    list: (params?: Record<string, any>, cacheOptions?: { ttl?: number; enabled?: boolean }) => 
      apiClient.get<ApiResponse<SocialHub>>('/social-hubs/', params, {
        enabled: cacheOptions?.enabled !== false,
        ttl: cacheOptions?.ttl ?? 1 * 60 * 1000, // 1 minute default (home page requirement)
        tags: ['social_hubs', 'social_hubs_list'],
      }),
    
    get: (id: string) => 
      apiClient.get<SocialHub>(`/social-hubs/${id}/`, undefined, {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5 minutes
        tags: ['social_hubs', `social_hub_${id}`],
      }),
    
    // NEW: Batch endpoint for venue details with all related data
    getWithRelated: (id: string) => 
      apiClient.get<{
        social_hub: SocialHub;
        events: Event[];
        ratings: Rating[];
        comments: Comment[];
      }>(`/social-hubs/${id}/details_with_related/`, undefined, {
        enabled: true,
        ttl: 3 * 60 * 1000, // 3 minutes (shorter TTL for dynamic data)
        tags: ['social_hubs', `social_hub_${id}`, 'events', 'ratings', 'comments'],
      }),
    
    create: (data: Partial<SocialHub>) => 
      apiClient.post<SocialHub>('/social-hubs/', data, ['social_hubs', 'social_hubs_list']),
    
    update: (id: string, data: Partial<SocialHub>) => 
      apiClient.put<SocialHub>(`/social-hubs/${id}/`, data, ['social_hubs', 'social_hubs_list', `social_hub_${id}`]),
    
    partialUpdate: (id: string, data: Partial<SocialHub>) => 
      apiClient.patch<SocialHub>(`/social-hubs/${id}/`, data, ['social_hubs', 'social_hubs_list', `social_hub_${id}`]),
    
    delete: (id: string) => 
      apiClient.delete<void>(`/social-hubs/${id}/`, ['social_hubs', 'social_hubs_list', `social_hub_${id}`, 'events']),
  },

  // Events
  events: {
    list: (params?: Record<string, any>, cacheOptions?: { ttl?: number; enabled?: boolean }) => 
      apiClient.get<ApiResponse<Event>>('/events/', params, {
        enabled: cacheOptions?.enabled !== false,
        ttl: cacheOptions?.ttl ?? 1 * 60 * 1000, // 1 minute default (home page requirement)
        tags: ['events', 'events_list'],
      }),
    
    get: (id: string) => 
      apiClient.get<Event>(`/events/${id}/`, undefined, {
        enabled: true,
        ttl: 3 * 60 * 1000, // 3 minutes
        tags: ['events', `event_${id}`],
      }),
    
    create: (data: Partial<Event>) => 
      apiClient.post<Event>('/events/', data, ['events', 'events_list', 'social_hubs']),
    
    update: (id: string, data: Partial<Event>) => 
      apiClient.put<Event>(`/events/${id}/`, data, ['events', 'events_list', `event_${id}`, 'social_hubs']),
    
    partialUpdate: (id: string, data: Partial<Event>) => 
      apiClient.patch<Event>(`/events/${id}/`, data, ['events', 'events_list', `event_${id}`, 'social_hubs']),
    
    delete: (id: string) => 
      apiClient.delete<void>(`/events/${id}/`, ['events', 'events_list', `event_${id}`, 'social_hubs', 'reservations']),
  },

  // Event Categories
  eventCategories: {
    list: (params?: Record<string, any>) => 
      apiClient.get<ApiResponse<EventCategory>>('/event-categories/', params, {
        enabled: true,
        ttl: 10 * 60 * 1000, // 10 minutes (categories change rarely)
        tags: ['event_categories', 'event_categories_list'],
      }),
    
    get: (id: string) => 
      apiClient.get<EventCategory>(`/event-categories/${id}/`, undefined, {
        enabled: true,
        ttl: 10 * 60 * 1000, // 10 minutes
        tags: ['event_categories', `event_category_${id}`],
      }),
    
    create: (data: Partial<EventCategory>) => 
      apiClient.post<EventCategory>('/event-categories/', data, ['event_categories', 'event_categories_list']),
    
    update: (id: string, data: Partial<EventCategory>) => 
      apiClient.put<EventCategory>(`/event-categories/${id}/`, data, ['event_categories', 'event_categories_list', `event_category_${id}`]),
    
    partialUpdate: (id: string, data: Partial<EventCategory>) => 
      apiClient.patch<EventCategory>(`/event-categories/${id}/`, data, ['event_categories', 'event_categories_list', `event_category_${id}`]),
    
    delete: (id: string) => 
      apiClient.delete<void>(`/event-categories/${id}/`, ['event_categories', 'event_categories_list', `event_category_${id}`, 'events']),
  },

  // Reservations
  reservations: {
    list: (params?: Record<string, any>) => 
      apiClient.get<ApiResponse<Reservation>>('/reservations/', params, {
        enabled: true,
        ttl: 2 * 60 * 1000, // 2 minutes (reservations change frequently)
        tags: ['reservations', 'reservations_list'],
      }),
    
    get: (id: string) => 
      apiClient.get<Reservation>(`/reservations/${id}/`, undefined, {
        enabled: true,
        ttl: 2 * 60 * 1000, // 2 minutes
        tags: ['reservations', `reservation_${id}`],
      }),
    
    create: (data: Partial<Reservation>) => 
      apiClient.post<Reservation>('/reservations/', data, ['reservations', 'reservations_list', 'events', 'customers']),
    
    update: (id: string, data: Partial<Reservation>) => 
      apiClient.put<Reservation>(`/reservations/${id}/`, data, ['reservations', 'reservations_list', `reservation_${id}`]),
    
    partialUpdate: (id: string, data: Partial<Reservation>) => 
      apiClient.patch<Reservation>(`/reservations/${id}/`, data, ['reservations', 'reservations_list', `reservation_${id}`]),
    
    delete: (id: string) => 
      apiClient.delete<void>(`/reservations/${id}/`, ['reservations', 'reservations_list', `reservation_${id}`, 'events']),
  },

  // Ratings
  ratings: {
    list: (params?: Record<string, any>) => 
      apiClient.get<ApiResponse<Rating>>('/ratings/', params, {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5 minutes
        tags: ['ratings', 'ratings_list'],
      }),
    
    get: (id: string) => 
      apiClient.get<Rating>(`/ratings/${id}/`, undefined, {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5 minutes
        tags: ['ratings', `rating_${id}`],
      }),
    
    create: (data: Partial<Rating>) => 
      apiClient.post<Rating>('/ratings/', data, ['ratings', 'ratings_list', 'events', 'social_hubs']),
    
    update: (id: string, data: Partial<Rating>) => 
      apiClient.put<Rating>(`/ratings/${id}/`, data, ['ratings', 'ratings_list', `rating_${id}`, 'events', 'social_hubs']),
    
    partialUpdate: (id: string, data: Partial<Rating>) => 
      apiClient.patch<Rating>(`/ratings/${id}/`, data, ['ratings', 'ratings_list', `rating_${id}`, 'events', 'social_hubs']),
    
    delete: (id: string) => 
      apiClient.delete<void>(`/ratings/${id}/`, ['ratings', 'ratings_list', `rating_${id}`, 'events', 'social_hubs']),
  },

  // Comments
  comments: {
    list: (params?: Record<string, any>) => 
      apiClient.get<ApiResponse<Comment>>('/comments/', params, {
        enabled: true,
        ttl: 3 * 60 * 1000, // 3 minutes
        tags: ['comments', 'comments_list'],
      }),
    
    get: (id: string) => 
      apiClient.get<Comment>(`/comments/${id}/`, undefined, {
        enabled: true,
        ttl: 3 * 60 * 1000, // 3 minutes
        tags: ['comments', `comment_${id}`],
      }),
    
    create: (data: Partial<Comment>) => 
      apiClient.post<Comment>('/comments/', data, ['comments', 'comments_list', 'events', 'social_hubs']),
    
    update: (id: string, data: Partial<Comment>) => 
      apiClient.put<Comment>(`/comments/${id}/`, data, ['comments', 'comments_list', `comment_${id}`, 'events', 'social_hubs']),
    
    partialUpdate: (id: string, data: Partial<Comment>) => 
      apiClient.patch<Comment>(`/comments/${id}/`, data, ['comments', 'comments_list', `comment_${id}`, 'events', 'social_hubs']),
    
    delete: (id: string) => 
      apiClient.delete<void>(`/comments/${id}/`, ['comments', 'comments_list', `comment_${id}`, 'events', 'social_hubs']),
    
    getReplies: async (commentId: string) => {
      // Use query parameter on the comments list endpoint
      // Pass parent_comment as params object, not in URL string
      // Disable cache to ensure fresh data
      try {
        const response = await apiClient.get<ApiResponse<Comment>>('/comments/', { parent_comment: commentId }, {
          enabled: false, // Disable cache for replies to get fresh data
          ttl: 0,
          tags: ['comments', `comment_${commentId}`, 'replies'],
        })
        console.log(`getReplies response for comment ${commentId}:`, response)
        return response
      } catch (error) {
        console.error(`Error fetching replies for comment ${commentId}:`, error)
        throw error
      }
    },
  },

  // Support Tickets
  support: {
    tickets: {
      list: (params?: Record<string, any>) => 
        apiClient.get<ApiResponse<SupportTicket>>('/support/tickets/', params, {
          enabled: true,
          ttl: 2 * 60 * 1000, // 2 minutes
          tags: ['support', 'support_tickets'],
        }),
      
      get: (id: string) => 
        apiClient.get<SupportTicket>(`/support/tickets/${id}/`, undefined, {
          enabled: true,
          ttl: 2 * 60 * 1000, // 2 minutes
          tags: ['support', `support_ticket_${id}`],
        }),
      
      create: (data: { title: string; description: string; category: string; priority?: string }) => 
        apiClient.post<SupportTicket>('/support/tickets/', data, ['support', 'support_tickets']),
      
      addComment: (ticketId: string, content: string) => 
        apiClient.post<TicketComment>(`/support/tickets/${ticketId}/add-comment/`, { content }, ['support', `support_ticket_${ticketId}`, 'support_tickets']),
      
      updateStatus: (ticketId: string, status: string) => 
        apiClient.patch<SupportTicket>(`/support/tickets/${ticketId}/update-status/`, { status }, ['support', `support_ticket_${ticketId}`, 'support_tickets']),
      
      getStats: () => 
        apiClient.get<{
          total: number
          open: number
          in_progress: number
          resolved: number
          closed: number
          by_priority: Record<string, number>
          by_category: Record<string, number>
        }>('/support/tickets/stats/', undefined, {
          enabled: true,
          ttl: 1 * 60 * 1000, // 1 minute
          tags: ['support', 'support_stats'],
        }),
    },
  },
}

// Helper function to fetch all pages of data
const fetchAllPages = async <T>(listFunction: (params?: Record<string, any>) => Promise<ApiResponse<T>>, params?: Record<string, any>): Promise<T[]> => {
  const allResults: T[] = []
  let nextUrl: string | undefined = undefined
  let page = 1
  
  do {
    try {
      const response = await listFunction({ ...params, page })
      allResults.push(...response.results)
      nextUrl = response.next
      page++
    } catch (error) {
      console.error('Error fetching page:', error)
      break
    }
  } while (nextUrl)
  
  return allResults
}

// Utility functions for common operations
export const apiUtils = {
  // Get all events (all pages) with automatic status updates
  getAllEvents: async (params?: Record<string, any>, forceRefresh?: boolean) => {
    const cacheOptions = forceRefresh ? { enabled: false } : { ttl: 1 * 60 * 1000 } // 1 minute for home page
    const listFunction = (p?: Record<string, any>) => apiService.events.list(p, cacheOptions)
    const events = await fetchAllPages(listFunction, params)
    return updateEventsStatus(events)
  },

  // Get all social hubs (all pages)
  getAllSocialHubs: (params?: Record<string, any>, forceRefresh?: boolean) => {
    const cacheOptions = forceRefresh ? { enabled: false } : { ttl: 1 * 60 * 1000 } // 1 minute for home page
    const listFunction = (p?: Record<string, any>) => apiService.socialHubs.list(p, cacheOptions)
    return fetchAllPages(listFunction, params)
  },

  // Get all event categories (all pages)
  getAllEventCategories: (params?: Record<string, any>) =>
    fetchAllPages(apiService.eventCategories.list, params),

  // Get events by social hub with automatic status updates
  getEventsBySocialHub: async (socialHubId: string) => {
    const response = await apiService.events.list({ social_hub: socialHubId })
    return {
      ...response,
      results: updateEventsStatus(response.results)
    }
  },

  // Get events by category with automatic status updates
  getEventsByCategory: async (categoryId: string) => {
    const response = await apiService.events.list({ category: categoryId })
    return {
      ...response,
      results: updateEventsStatus(response.results)
    }
  },

  // Get upcoming events with automatic status updates
  getUpcomingEvents: async () => {
    const response = await apiService.events.list({ event_status: 'upcoming' })
    return {
      ...response,
      results: updateEventsStatus(response.results)
    }
  },

  // Get reservations by customer
  getReservationsByCustomer: (customerId: string) =>
    apiService.reservations.list({ customer: customerId }),

  // Get ratings by social hub
  getRatingsBySocialHub: (socialHubId: string) =>
    apiService.ratings.list({ social_hub: socialHubId }),

  // Get comments by social hub
  getCommentsBySocialHub: (socialHubId: string) =>
    apiService.comments.list({ social_hub: socialHubId }),

  // Search events (client-side search) with automatic status updates
  searchEvents: async (query: string) => {
    const response = await apiService.events.list({ search: query })
    return {
      ...response,
      results: updateEventsStatus(response.results)
    }
  },

  // Search social hubs (venues) (client-side search)
  searchSocialHubs: (query: string) =>
    apiService.socialHubs.list({ search: query }),

  // Search event categories (client-side search)
  searchEventCategories: (query: string) =>
    apiService.eventCategories.list({ search: query }),

  // Filter events by price range with automatic status updates
  filterEventsByPrice: async (minPrice: number, maxPrice: number) => {
    const response = await apiService.events.list({ price__gte: minPrice, price__lte: maxPrice })
    return {
      ...response,
      results: updateEventsStatus(response.results)
    }
  },

  // Filter events by date with automatic status updates
  filterEventsByDate: async (date: string) => {
    const response = await apiService.events.list({ date: date })
    return {
      ...response,
      results: updateEventsStatus(response.results)
    }
  },
}

export default apiService
