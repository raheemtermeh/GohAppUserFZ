import React, { createContext, useContext, useMemo, useReducer, useEffect } from 'react'
import { apiService, apiUtils, type Customer, type SocialHub, type Event, type EventCategory, type Reservation, type Rating, type Comment } from '../services/api'
import { apiClient } from '../services/apiClient'

type Filters = {
  categories: EventCategory[]
  socialHubIds: string[]
  maxPrice?: number
  date?: string
  rating?: number
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  minCapacity?: number
}

type AuthState = { 
  user: null | Customer
  isLoggedIn: boolean
}

type CartItem = {
  id: string
  event: Event
  numberOfPeople: number
  totalPrice: number
  status: 'in_progress' | 'confirmed' | 'pending'
  addedAt: string
}

type State = {
  events: Event[]
  socialHubs: SocialHub[]
  eventCategories: EventCategory[]
  filters: Filters
  auth: AuthState
  reservations: Reservation[]
  ratings: Rating[]
  comments: Comment[]
  favorites: string[] // Social hub IDs
  cart: CartItem[] // Cart items
  redirectUrl: string | null // URL to redirect to after login
  notification: {
    message: string | null
    type: 'info' | 'warning' | 'error' | 'success' | null
    show: boolean
  }
  loading: {
    events: boolean
    socialHubs: boolean
    eventCategories: boolean
    reservations: boolean
    ratings: boolean
    comments: boolean
  }
  error: {
    events: string | null
    socialHubs: string | null
    eventCategories: string | null
    reservations: string | null
    ratings: string | null
    comments: string | null
  }
}

type Action =
  | { type: 'toggle_category'; category: EventCategory }
  | { type: 'toggle_social_hub'; socialHubId: string }
  | { type: 'set_max_price'; value?: number }
  | { type: 'set_date'; value?: string }
  | { type: 'set_rating'; value?: number }
  | { type: 'set_status'; value?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' }
  | { type: 'set_min_capacity'; value?: number }
  | { type: 'clear_filters' }
  | { type: 'login'; customer: Customer }
  | { type: 'logout' }
  | { type: 'reserve'; eventId: string; customerId: string; numberOfPeople: number; status?: 'pending' | 'confirmed' }
  | { type: 'add_favorite'; socialHubId: string }
  | { type: 'remove_favorite'; socialHubId: string }
  | { type: 'add_rating'; rating: Rating }
  | { type: 'add_comment'; comment: Comment }
  | { type: 'set_events'; events: Event[] }
  | { type: 'set_social_hubs'; socialHubs: SocialHub[] }
  | { type: 'set_event_categories'; eventCategories: EventCategory[] }
  | { type: 'set_reservations'; reservations: Reservation[] }
  | { type: 'set_ratings'; ratings: Rating[] }
  | { type: 'set_comments'; comments: Comment[] }
  | { type: 'add_to_cart'; event: Event; numberOfPeople: number; status?: 'in_progress' | 'pending' }
  | { type: 'remove_from_cart'; cartItemId: string }
  | { type: 'update_cart_item_status'; cartItemId: string; status: 'in_progress' | 'confirmed' }
  | { type: 'clear_cart' }
  | { type: 'restore_cart'; cartItems: CartItem[] }
  | { type: 'cancel_reservation'; reservationId: string }
  | { type: 'set_loading'; key: keyof State['loading']; value: boolean }
  | { type: 'set_error'; key: keyof State['error']; value: string | null }
  | { type: 'set_redirect_url'; url: string | null }
  | { type: 'expire_pending_reservation'; reservationId: string }
  | { type: 'show_notification'; message: string; notificationType: 'info' | 'warning' | 'error' | 'success' }
  | { type: 'hide_notification' }
  | { type: 'cleanup_stale_reservations' }

const initialState: State = {
  events: [],
  socialHubs: [],
  eventCategories: [],
  filters: { categories: [], socialHubIds: [] },
  auth: { user: null, isLoggedIn: false },
  reservations: [],
  ratings: [],
  comments: [],
  favorites: [],
  cart: [],
  redirectUrl: null,
  notification: {
    message: null,
    type: null,
    show: false
  },
  loading: {
    events: false,
    socialHubs: false,
    eventCategories: false,
    reservations: false,
    ratings: false,
    comments: false
  },
  error: {
    events: null,
    socialHubs: null,
    eventCategories: null,
    reservations: null,
    ratings: null,
    comments: null
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'toggle_category': {
      const exists = state.filters.categories.includes(action.category)
      return {
        ...state,
        filters: {
          ...state.filters,
          categories: exists
            ? state.filters.categories.filter(c => c !== action.category)
            : [...state.filters.categories, action.category],
        },
      }
    }
    case 'toggle_social_hub': {
      const exists = state.filters.socialHubIds.includes(action.socialHubId)
      return {
        ...state,
        filters: {
          ...state.filters,
          socialHubIds: exists
            ? state.filters.socialHubIds.filter(id => id !== action.socialHubId)
            : [...state.filters.socialHubIds, action.socialHubId],
        },
      }
    }
    case 'set_max_price':
      return { ...state, filters: { ...state.filters, maxPrice: action.value } }
    case 'set_date':
      return { ...state, filters: { ...state.filters, date: action.value } }
    case 'set_rating':
      return { ...state, filters: { ...state.filters, rating: action.value } }
    case 'set_status':
      return { ...state, filters: { ...state.filters, status: action.value } }
    case 'set_min_capacity':
      return { ...state, filters: { ...state.filters, minCapacity: action.value } }
    case 'clear_filters':
      return { 
        ...state, 
        filters: { 
          categories: [], 
          socialHubIds: [], 
          maxPrice: undefined, 
          date: undefined, 
          rating: undefined, 
          status: undefined,
          minCapacity: undefined
        } 
      }
    case 'login':
      return { 
        ...state, 
        auth: { user: action.customer, isLoggedIn: true },
        favorites: action.customer.favorites || []
      }
    case 'logout':
      // Clear tokens from localStorage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      return { ...state, auth: { user: null, isLoggedIn: false }, favorites: [], cart: [] }
    case 'reserve':
      const newReservation: Reservation = {
        id: String(state.reservations.length + 1),
        reservation_date: new Date().toISOString(),
        number_of_people: action.numberOfPeople,
        status: action.status || 'confirmed',
        customer: state.auth.user!,
        event: state.events.find(e => e.id === action.eventId)!
      }
      return {
        ...state,
        reservations: [...state.reservations, newReservation],
      }
    case 'add_favorite':
      return {
        ...state,
        favorites: [...state.favorites, action.socialHubId],
        socialHubs: state.socialHubs.map(hub => 
          hub.id === action.socialHubId ? { ...hub, is_favorite: true } : hub
        )
      }
    case 'remove_favorite':
      return {
        ...state,
        favorites: state.favorites.filter(id => id !== action.socialHubId),
        socialHubs: state.socialHubs.map(hub => 
          hub.id === action.socialHubId ? { ...hub, is_favorite: false } : hub
        )
      }
    case 'add_rating':
      return {
        ...state,
        ratings: [...state.ratings, action.rating],
      }
    case 'add_comment':
      return {
        ...state,
        comments: [...state.comments, action.comment],
      }
    case 'set_events':
      return { ...state, events: action.events }
    case 'set_social_hubs':
      return { ...state, socialHubs: action.socialHubs }
    case 'set_event_categories':
      return { ...state, eventCategories: action.eventCategories }
    case 'set_reservations':
      return { ...state, reservations: action.reservations }
    case 'set_ratings':
      return { ...state, ratings: action.ratings }
    case 'set_comments':
      return { ...state, comments: action.comments }
    case 'add_to_cart': {
      const cartItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        event: action.event,
        numberOfPeople: action.numberOfPeople,
        totalPrice: action.event.price * action.numberOfPeople,
        status: action.status || 'in_progress',
        addedAt: new Date().toISOString()
      }
      
      // Also save to backend if user is logged in
      if (state.auth.user) {
        apiClient.post('cart-items/', {
          customer: state.auth.user.id,
          event: action.event.id,
          number_of_people: action.numberOfPeople,
          status: action.status || 'in_progress'
        })
        .catch(error => {
          console.error('Failed to save cart item to backend:', error)
        })
      }
      
      return {
        ...state,
        cart: [...state.cart, cartItem]
      }
    }
    case 'remove_from_cart':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.cartItemId)
      }
    case 'update_cart_item_status':
      return {
        ...state,
        cart: state.cart.map(item => 
          item.id === action.cartItemId 
            ? { ...item, status: action.status }
            : item
        )
      }
    case 'clear_cart':
      return {
        ...state,
        cart: []
      }
    case 'restore_cart':
      return {
        ...state,
        cart: action.cartItems
      }
    case 'cancel_reservation':
      return {
        ...state,
        reservations: state.reservations.map(reservation =>
          reservation.id === action.reservationId
            ? { ...reservation, status: 'cancelled' as const }
            : reservation
        )
      }
    case 'set_loading':
      return { 
        ...state, 
        loading: { ...state.loading, [action.key]: action.value }
      }
    case 'set_error':
      return { 
        ...state, 
        error: { ...state.error, [action.key]: action.value }
      }
    case 'set_redirect_url':
      return {
        ...state,
        redirectUrl: action.url
      }
    case 'expire_pending_reservation':
      return {
        ...state,
        reservations: state.reservations.map(reservation =>
          reservation.id === action.reservationId
            ? { ...reservation, status: 'cancelled' as const }
            : reservation
        )
      }
    case 'show_notification':
      return {
        ...state,
        notification: {
          message: action.message,
          type: action.notificationType,
          show: true
        }
      }
    case 'hide_notification':
      return { 
        ...state, 
        notification: { 
          message: null, 
          type: null, 
          show: false 
        } 
      }
    case 'cleanup_stale_reservations':
      // Remove reservations that reference non-existent events
      const validReservations = state.reservations.filter(reservation => {
        if (typeof reservation.event === 'string') {
          // Check if the event exists in the current events list
          const eventId = reservation.event as string
          return state.events.some(event => event.id === eventId)
        }
        return true // Keep reservations with full event objects
      })
      return { ...state, reservations: validReservations }
    default:
      return state
  }
}

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Restore authentication state and cart from localStorage on app startup
  useEffect(() => {
    const restoreAuthState = async () => {
      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (accessToken && refreshToken) {
        try {
          // Try to get user profile using the stored token
          const userData = await apiClient.get('auth/profile/') as any
          
          // The profile endpoint returns user data, but we need to fetch the full customer data
          if (userData.user_type === 'customer') {
            const customerData = await apiClient.get(`customers/${userData.id}/`) as any
            dispatch({ type: 'login', customer: customerData })
              
            // Also load user reservations using standard REST API
            try {
              const reservationsData = await apiService.reservations.list({ customer_id: userData.id }) as any
              dispatch({ type: 'set_reservations', reservations: reservationsData.results || reservationsData })
            } catch (error) {
              console.error('Failed to load reservations during auth restore:', error)
            }
          }
        } catch (error) {
          console.error('Failed to restore auth state:', error)
          // Clear invalid tokens
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
    }

    // Restore cart from localStorage
    const restoreCart = () => {
      try {
        const savedCart = localStorage.getItem('funzone_cart')
        if (savedCart) {
          const cartItems = JSON.parse(savedCart)
          // Validate cart items and restore them
          if (Array.isArray(cartItems) && cartItems.length > 0) {
            // Validate each cart item before restoring
            const validCartItems = cartItems.filter((item: any) => 
              item.event && item.numberOfPeople && item.totalPrice && item.status
            )
            if (validCartItems.length > 0) {
              dispatch({ type: 'restore_cart', cartItems: validCartItems })
            }
          }
        }
      } catch (error) {
        // Clear invalid cart data
        localStorage.removeItem('funzone_cart')
      }
    }

    restoreAuthState()
    restoreCart()
  }, [])

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (state.cart && state.cart.length > 0) {
      localStorage.setItem('funzone_cart', JSON.stringify(state.cart))
    } else {
      localStorage.removeItem('funzone_cart')
    }
  }, [state.cart])

  // Load initial data from API
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load events (all pages)
        dispatch({ type: 'set_loading', key: 'events', value: true })
        
        const events = await apiUtils.getAllEvents()
        dispatch({ type: 'set_events', events: events })
        dispatch({ type: 'set_loading', key: 'events', value: false })
        
        // Clean up stale reservations after loading events
        dispatch({ type: 'cleanup_stale_reservations' })
      } catch (error) {
        // Use local data as fallback
        try {
          const { events } = await import('../data/events')
          dispatch({ type: 'set_events', events: events as any })
          dispatch({ type: 'set_loading', key: 'events', value: false })
          dispatch({ type: 'set_error', key: 'events', value: null })
        } catch (importError) {
          dispatch({ type: 'set_loading', key: 'events', value: false })
          dispatch({ type: 'set_error', key: 'events', value: 'Failed to load events' })
        }
      }

      try {
        // Load social hubs (all pages)
        dispatch({ type: 'set_loading', key: 'socialHubs', value: true })
        
        const socialHubs = await apiUtils.getAllSocialHubs()
        // Sort social hubs by average rating (highest first) for popular venues display
        const sortedSocialHubs = socialHubs.sort((a, b) => {
          const ratingA = a.average_rating || 0
          const ratingB = b.average_rating || 0
          return ratingB - ratingA
        })
        dispatch({ type: 'set_social_hubs', socialHubs: sortedSocialHubs })
        dispatch({ type: 'set_loading', key: 'socialHubs', value: false })
      } catch (error) {
        // Use local data as fallback
        try {
          const { socialHubs } = await import('../data/events')
          // Sort fallback social hubs by average rating (highest first)
          const sortedFallbackHubs = (socialHubs as any).sort((a: any, b: any) => {
            const ratingA = a.average_rating || 0
            const ratingB = b.average_rating || 0
            return ratingB - ratingA
          })
          dispatch({ type: 'set_social_hubs', socialHubs: sortedFallbackHubs })
          dispatch({ type: 'set_loading', key: 'socialHubs', value: false })
          dispatch({ type: 'set_error', key: 'socialHubs', value: null })
        } catch (importError) {
          dispatch({ type: 'set_loading', key: 'socialHubs', value: false })
          dispatch({ type: 'set_error', key: 'socialHubs', value: 'Failed to load social hubs' })
        }
      }

      try {
        // Load event categories (all pages)
        dispatch({ type: 'set_loading', key: 'eventCategories', value: true })
        
        const eventCategories = await apiUtils.getAllEventCategories()
        dispatch({ type: 'set_event_categories', eventCategories: eventCategories })
        dispatch({ type: 'set_loading', key: 'eventCategories', value: false })
      } catch (error) {
        // Use local data as fallback
        const mockCategories = [
          {
            "id": "539fca64-1cc9-44d1-87dd-68feaaeeadbb",
            "name": "ادایی",
            "description": "نمایش و تئاتر و رویدادهای هنری",
            "image_url": "https://example.com/category_ادایی.jpg"
          },
          {
            "id": "70bd2d73-91a3-4641-8fc6-5ac2f622434a",
            "name": "بازی‌های رومیزی",
            "description": "بازی‌های رومیزی و فکری",
            "image_url": "https://example.com/category_بازی‌های_رومیزی.jpg"
          },
          {
            "id": "eb114b91-1a82-4851-a877-ec524c2b058f",
            "name": "بازی‌های گروهی",
            "description": "بازی‌های گروهی و تفریحی",
            "image_url": "https://example.com/category_بازی‌های_گروهی.jpg"
          },
          {
            "id": "d4fdb680-3581-4cdc-9afd-30b962c17949",
            "name": "تماشای فیلم",
            "description": "سینما و نمایش فیلم",
            "image_url": "https://example.com/category_تماشای_فیلم.jpg"
          },
          {
            "id": "47832025-c97a-41b0-9782-3ba8ca09ca95",
            "name": "تماشای مسابقات ورزشی",
            "description": "تماشای مسابقات ورزشی و رویدادهای ورزشی",
            "image_url": "https://example.com/category_تماشای_مسابقات_ورزشی.jpg"
          },
          {
            "id": "eb11f580-9120-4f3d-99dc-31fbeb6cd9fd",
            "name": "مافیا",
            "description": "بازی‌های گروهی و استراتژیک مافیا",
            "image_url": "https://example.com/category_مافیا.jpg"
          },
          {
            "id": "288e944e-338d-40d5-9e55-1f9da8d9df6d",
            "name": "موسیقی زنده",
            "description": "موسیقی زنده و کنسرت‌ها",
            "image_url": "https://example.com/category_موسیقی_زنده.jpg"
          },
          {
            "id": "193a43de-e259-4fd5-883c-5ae9d769de5c",
            "name": "کتابخوانی",
            "description": "مطالعه و کتاب و رویدادهای ادبی",
            "image_url": "https://example.com/category_کتابخوانی.jpg"
          }
        ]
        
        dispatch({ type: 'set_event_categories', eventCategories: mockCategories })
        dispatch({ type: 'set_loading', key: 'eventCategories', value: false })
        dispatch({ type: 'set_error', key: 'eventCategories', value: null })
      }

      // Reservations are loaded during auth restore, no need to load them again here
    }

    loadInitialData()
  }, [state.auth.user])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('StoreProvider missing')
  return ctx
}

export function useFilteredEvents() {
  const { state } = useStore()
  const { filters } = state
  return useMemo(() => {
    if (!state.events || !Array.isArray(state.events)) return []
    return state.events.filter(e => {
      if (!e) return false
      // Filter out cancelled events
      if (e.event_status === 'cancelled') return false
      
      // Filter out events that have already started or passed
      if (e.start_time) {
        const eventStartTime = new Date(e.start_time)
        const now = new Date()
        if (eventStartTime <= now) return false
      }
      
      if (filters.categories.length && !filters.categories.some(cat => cat.id === e.category?.id)) return false
      if (filters.socialHubIds.length && !filters.socialHubIds.includes(e.social_hub?.id)) return false
      if (filters.maxPrice != null && e.price > filters.maxPrice) return false
      if (filters.date && e.date !== filters.date) return false
      if (filters.rating != null && (e.average_rating || 0) < filters.rating) return false
      if (filters.status && e.event_status !== filters.status) return false
      if (filters.minCapacity != null) {
        const freeSeats = e.capacity - (e.total_reserved_people || 0)
        if (freeSeats < filters.minCapacity) return false
      }
      return true
    })
  }, [state.events, filters])
}

// New hook for unfiltered events (used on HomePage and other pages that shouldn't be affected by filters)
export function useUnfilteredEvents() {
  const { state } = useStore()
  return useMemo(() => {
    if (!state.events || !Array.isArray(state.events)) return []
    return state.events.filter(e => {
      if (!e) return false
      // Filter out cancelled events
      if (e.event_status === 'cancelled') return false
      
      // Filter out events that have already started or passed
      if (e.start_time) {
        const eventStartTime = new Date(e.start_time)
        const now = new Date()
        if (eventStartTime <= now) return false
      }
      
      return true
    })
  }, [state.events])
}

// New hook for past events (completed events)
export function usePastEvents() {
  const { state } = useStore()
  const { filters } = state
  return useMemo(() => {
    if (!state.events || !Array.isArray(state.events)) return []
    return state.events.filter(e => {
      if (!e) return false
      // Only show completed events
      if (e.event_status === 'completed') return true
      
      // Also show events that have passed their start time
      if (e.start_time) {
        const eventStartTime = new Date(e.start_time)
        const now = new Date()
        if (eventStartTime <= now) return true
      }
      
      return false
    })
  }, [state.events, filters])
}

export function useRecommendedEvents() {
  const { state } = useStore()
  const { favorites } = state
  
  return useMemo(() => {
    if (!state.events || !Array.isArray(state.events)) return []
    
    // Filter out expired events
    const futureEvents = state.events.filter(e => {
      if (!e) return false
      if (e.event_status !== 'upcoming') return false
      if (e.start_time) {
        const eventStartTime = new Date(e.start_time)
        const now = new Date()
        return eventStartTime > now
      }
      return true
    })
    
    if (!favorites || favorites.length === 0) {
      // If no favorites, return popular events
      return futureEvents
        .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        .slice(0, 6)
    }
    
    // Return events from favorite social hubs
    return futureEvents
      .filter(e => favorites.includes(e.social_hub?.id))
      .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
  }, [state.events, favorites])
}

export function useFavoriteSocialHubs() {
  const { state } = useStore()
  return useMemo(() => {
    if (!state.socialHubs || !Array.isArray(state.socialHubs) || !state.favorites || !Array.isArray(state.favorites)) return []
    return state.socialHubs.filter(hub => hub && state.favorites.includes(hub.id))
  }, [state.socialHubs, state.favorites])
}

export function useCart() {
  const { state } = useStore()
  return useMemo(() => {
    return state.cart || []
  }, [state.cart])
}

export function useCartTotal() {
  const { state } = useStore()
  return useMemo(() => {
    return state.cart.reduce((total, item) => total + item.totalPrice, 0)
  }, [state.cart])
}

export function useUserReservations() {
  const { state } = useStore()
  return useMemo(() => {
    if (!state.auth.user) return []
    return state.reservations.filter(r => {
      // Handle both string and object customer formats
      const customerId = typeof r.customer === 'string' ? r.customer : r.customer?.id
      return customerId === state.auth.user?.id
    })
  }, [state.reservations, state.auth.user])
}

// Hook for managing pending reservations with auto-expiration
export function usePendingReservationManager() {
  const { state, dispatch } = useStore()
  
  useEffect(() => {
    const pendingReservations = state.reservations.filter(r => r.status === 'pending')
    
    pendingReservations.forEach(reservation => {
      const reservationTime = new Date(reservation.reservation_date).getTime()
      const currentTime = new Date().getTime()
      const timeElapsed = currentTime - reservationTime
      const tenMinutes = 10 * 60 * 1000 // 10 minutes in milliseconds
      
      if (timeElapsed >= tenMinutes) {
        // Auto-expire the reservation
        dispatch({ type: 'expire_pending_reservation', reservationId: reservation.id })
      } else {
        // Set up timer for remaining time
        const remainingTime = tenMinutes - timeElapsed
        const timer = setTimeout(() => {
          dispatch({ type: 'expire_pending_reservation', reservationId: reservation.id })
        }, remainingTime)
        
        return () => clearTimeout(timer)
      }
    })
  }, [state.reservations, dispatch])
  
  // Show notification when user has pending reservations
  useEffect(() => {
    const pendingReservations = state.reservations.filter(r => r.status === 'pending')
    
    if (pendingReservations.length > 0 && !state.notification.show) {
      dispatch({
        type: 'show_notification',
        message: 'You have pending reservations. If you don\'t pay within 10 minutes, your tickets will be released.',
        notificationType: 'warning'
      })
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        dispatch({ type: 'hide_notification' })
      }, 5000)
    }
  }, [state.reservations, state.notification.show, dispatch])
}

// API integration functions
export function useApiActions() {
  const { dispatch } = useStore()

  const loadEvents = async (params?: Record<string, any>) => {
    try {
      dispatch({ type: 'set_loading', key: 'events', value: true })
      const events = await apiUtils.getAllEvents(params)
      dispatch({ type: 'set_events', events: events })
      dispatch({ type: 'set_error', key: 'events', value: null })
    } catch (error) {
      dispatch({ type: 'set_error', key: 'events', value: 'Failed to load events' })
    } finally {
      dispatch({ type: 'set_loading', key: 'events', value: false })
    }
  }

  const loadSocialHubs = async (params?: Record<string, any>) => {
    try {
      dispatch({ type: 'set_loading', key: 'socialHubs', value: true })
      const socialHubs = await apiUtils.getAllSocialHubs(params)
      dispatch({ type: 'set_social_hubs', socialHubs: socialHubs })
      dispatch({ type: 'set_error', key: 'socialHubs', value: null })
    } catch (error) {
      dispatch({ type: 'set_error', key: 'socialHubs', value: 'Failed to load social hubs' })
    } finally {
      dispatch({ type: 'set_loading', key: 'socialHubs', value: false })
    }
  }

  const createReservation = async (eventId: string, numberOfPeople: number) => {
    try {
      const { state } = useStore()
      if (!state.auth.user) throw new Error('User not authenticated')
      
      const reservationData = {
        event: eventId,
        customer: state.auth.user.id,
        number_of_people: numberOfPeople,
        status: 'confirmed' as const,
        reservation_date: new Date().toISOString()
      }
      
      const newReservation = await apiService.reservations.create(reservationData as any)
      dispatch({ type: 'reserve', eventId, customerId: state.auth.user.id, numberOfPeople })
      return newReservation
    } catch (error) {
      console.error('Failed to create reservation:', error)
      throw error
    }
  }

  const addFavorite = async (socialHubId: string) => {
    try {
      const { state } = useStore()
      if (!state.auth.user) throw new Error('User not authenticated')
      
      await apiService.customers.addFavorite(state.auth.user.id, socialHubId)
      dispatch({ type: 'add_favorite', socialHubId })
    } catch (error) {
      console.error('Failed to add favorite:', error)
      throw error
    }
  }

  const removeFavorite = async (socialHubId: string) => {
    try {
      const { state } = useStore()
      if (!state.auth.user) throw new Error('User not authenticated')
      
      await apiService.customers.removeFavorite(state.auth.user.id, socialHubId)
      dispatch({ type: 'remove_favorite', socialHubId })
    } catch (error) {
      console.error('Failed to remove favorite:', error)
      throw error
    }
  }

  const createSocialHub = async (data: any) => {
    try {
      dispatch({ type: 'set_loading', key: 'socialHubs', value: true })
      const newSocialHub = await apiService.socialHubs.create(data)
      // Reload social hubs to get the updated list
      await loadSocialHubs()
      dispatch({ type: 'set_error', key: 'socialHubs', value: null })
      return newSocialHub
    } catch (error) {
      dispatch({ type: 'set_error', key: 'socialHubs', value: 'Failed to create social hub' })
      throw error
    } finally {
      dispatch({ type: 'set_loading', key: 'socialHubs', value: false })
    }
  }

  const updateSocialHub = async (id: string, data: any) => {
    try {
      dispatch({ type: 'set_loading', key: 'socialHubs', value: true })
      const updatedSocialHub = await apiService.socialHubs.update(id, data)
      // Reload social hubs to get the updated list
      await loadSocialHubs()
      dispatch({ type: 'set_error', key: 'socialHubs', value: null })
      return updatedSocialHub
    } catch (error) {
      dispatch({ type: 'set_error', key: 'socialHubs', value: 'Failed to update social hub' })
      throw error
    } finally {
      dispatch({ type: 'set_loading', key: 'socialHubs', value: false })
    }
  }

  const deleteSocialHub = async (id: string) => {
    try {
      dispatch({ type: 'set_loading', key: 'socialHubs', value: true })
      await apiService.socialHubs.delete(id)
      // Reload social hubs to get the updated list
      await loadSocialHubs()
      dispatch({ type: 'set_error', key: 'socialHubs', value: null })
    } catch (error) {
      dispatch({ type: 'set_error', key: 'socialHubs', value: 'Failed to delete social hub' })
      throw error
    } finally {
      dispatch({ type: 'set_loading', key: 'socialHubs', value: false })
    }
  }

  return {
    loadEvents,
    loadSocialHubs,
    createReservation,
    addFavorite,
    removeFavorite,
    createSocialHub,
    updateSocialHub,
    deleteSocialHub
  }
}






