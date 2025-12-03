import React, { createContext, useContext, useMemo, useReducer } from 'react'
import type { EventItem, EventCategory, SocialHub, Customer, Reservation, Rating, Comment } from '../data/events'
import { events as seedEvents, socialHubs as seedSocialHubs, eventCategories } from '../data/events'

type Filters = {
  categories: EventCategory[]
  socialHubIds: string[]
  maxPrice?: number
  date?: string
  rating?: number
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
}

type AuthState = { 
  user: null | Customer
  isLoggedIn: boolean
}

type State = {
  events: EventItem[]
  socialHubs: SocialHub[]
  eventCategories: typeof eventCategories
  filters: Filters
  auth: AuthState
  reservations: Reservation[]
  ratings: Rating[]
  comments: Comment[]
  favorites: string[] // Social hub IDs
}

type Action =
  | { type: 'toggle_category'; category: EventCategory }
  | { type: 'toggle_social_hub'; socialHubId: string }
  | { type: 'set_max_price'; value?: number }
  | { type: 'set_date'; value?: string }
  | { type: 'set_rating'; value?: number }
  | { type: 'set_status'; value?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' }
  | { type: 'clear_filters' }
  | { type: 'login'; customer: Customer }
  | { type: 'logout' }
  | { type: 'reserve'; eventId: string; customerId: string; numberOfPeople: number }
  | { type: 'add_favorite'; socialHubId: string }
  | { type: 'remove_favorite'; socialHubId: string }
  | { type: 'add_rating'; rating: Rating }
  | { type: 'add_comment'; comment: Comment }

const initialState: State = {
  events: seedEvents,
  socialHubs: seedSocialHubs,
  eventCategories: eventCategories,
  filters: { categories: [], socialHubIds: [] },
  auth: { user: null, isLoggedIn: false },
  reservations: [],
  ratings: [],
  comments: [],
  favorites: [],
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
    case 'clear_filters':
      return { ...state, filters: { categories: [], socialHubIds: [] } }
    case 'login':
      return { 
        ...state, 
        auth: { user: action.customer, isLoggedIn: true },
        favorites: action.customer.favorites || []
      }
    case 'logout':
      return { ...state, auth: { user: null, isLoggedIn: false }, favorites: [] }
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
    default:
      return state
  }
}

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
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
    return state.events.filter(e => {
      if (filters.categories.length && !filters.categories.includes(e.category.name as any)) return false
      if (filters.socialHubIds.length && !filters.socialHubIds.includes(e.social_hub.id)) return false
      if (filters.maxPrice != null && e.price > filters.maxPrice) return false
      if (filters.date && e.date !== filters.date) return false
      if (filters.rating != null && (e.average_rating || 0) < filters.rating) return false
      if (filters.status && e.event_status !== filters.status) return false
      return true
    })
  }, [state.events, filters])
}

export function useRecommendedEvents() {
  const { state } = useStore()
  const { favorites } = state
  
  return useMemo(() => {
    if (favorites.length === 0) {
      // If no favorites, return popular events
      return state.events
        .filter(e => e.event_status === 'upcoming')
        .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        .slice(0, 6)
    }
    
    // Return events from favorite social hubs
    return state.events
      .filter(e => favorites.includes(e.social_hub.id) && e.event_status === 'upcoming')
      .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
  }, [state.events, favorites])
}

export function useFavoriteSocialHubs() {
  const { state } = useStore()
  return useMemo(() => {
    return state.socialHubs.filter(hub => state.favorites.includes(hub.id))
  }, [state.socialHubs, state.favorites])
}

export function useUserReservations() {
  const { state } = useStore()
  return useMemo(() => {
    if (!state.auth.user) return []
    return state.reservations.filter(r => r.customer.id === state.auth.user!.id)
  }, [state.reservations, state.auth.user])
}



