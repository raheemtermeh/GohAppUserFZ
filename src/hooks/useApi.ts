import { useState, useEffect, useCallback } from 'react'
import { apiService, apiUtils, type Customer, type SocialHub, type Event, type EventCategory, type Reservation, type Rating, type Comment } from '../services/api'
import { useStore } from '../state/apiStore'
import { API_CONFIG } from '../config/api'

const API_BASE_URL = API_CONFIG.API_BASE_URL

// Generic hook for API data fetching
export function useApiData<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchFunction()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('API fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}

// Specific hooks for different data types
export function useCustomers(params?: Record<string, any>) {
  return useApiData(() => apiService.customers.list(params), [JSON.stringify(params)])
}

export function useCustomer(id: string) {
  return useApiData(() => apiService.customers.get(id), [id])
}

export function useSocialHubs(params?: Record<string, any>) {
  return useApiData(() => apiService.socialHubs.list(params), [JSON.stringify(params)])
}

export function useSocialHub(id: string) {
  return useApiData(() => apiService.socialHubs.get(id), [id])
}

// NEW: Optimized batch hook for venue details
export function useVenueDetails(venueId: string | undefined) {
  return useApiData(
    () => {
      if (!venueId) throw new Error('Venue ID is required')
      return apiService.socialHubs.getWithRelated(venueId)
    },
    [venueId]
  )
}

export function useEvents(params?: Record<string, any>) {
  return useApiData(() => apiService.events.list(params), [JSON.stringify(params)])
}

export function useEvent(id: string) {
  return useApiData(() => apiService.events.get(id), [id])
}

export function useEventCategories(params?: Record<string, any>) {
  return useApiData(() => apiService.eventCategories.list(params), [JSON.stringify(params)])
}

export function useEventCategory(id: string) {
  return useApiData(() => apiService.eventCategories.get(id), [id])
}

export function useReservations(params?: Record<string, any>) {
  return useApiData(() => apiService.reservations.list(params), [JSON.stringify(params)])
}

export function useReservation(id: string) {
  return useApiData(() => apiService.reservations.get(id), [id])
}

export function useRatings(params?: Record<string, any>) {
  return useApiData(() => apiService.ratings.list(params), [JSON.stringify(params)])
}

export function useRating(id: string) {
  return useApiData(() => apiService.ratings.get(id), [id])
}

export function useComments(params?: Record<string, any>) {
  return useApiData(() => apiService.comments.list(params), [JSON.stringify(params)])
}

export function useComment(id: string) {
  return useApiData(() => apiService.comments.get(id), [id])
}

// Utility hooks
export function useEventsBySocialHub(socialHubId: string) {
  return useApiData(() => apiUtils.getEventsBySocialHub(socialHubId), [socialHubId])
}

export function useEventsByCategory(categoryId: string) {
  return useApiData(() => apiUtils.getEventsByCategory(categoryId), [categoryId])
}

export function useUpcomingEvents() {
  return useApiData(() => apiUtils.getUpcomingEvents(), [])
}

export function useReservationsByCustomer(customerId: string) {
  return useApiData(() => apiUtils.getReservationsByCustomer(customerId), [customerId])
}

export function useRatingsBySocialHub(socialHubId: string) {
  return useApiData(() => apiUtils.getRatingsBySocialHub(socialHubId), [socialHubId])
}

export function useCommentsBySocialHub(socialHubId: string) {
  return useApiData(() => apiUtils.getCommentsBySocialHub(socialHubId), [socialHubId])
}

// Mutation hooks for creating/updating data
export function useApiMutation<TData, TVariables>(
  mutationFunction: (variables: TVariables) => Promise<TData>
) {
  const [data, setData] = useState<TData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (variables: TVariables) => {
    try {
      setLoading(true)
      setError(null)
      const result = await mutationFunction(variables)
      setData(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('API mutation error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [mutationFunction])

  return { data, loading, error, mutate }
}

// Specific mutation hooks
export function useCreateCustomer() {
  return useApiMutation((data: Partial<Customer>) => apiService.customers.create(data))
}

export function useUpdateCustomer() {
  return useApiMutation(({ id, data }: { id: string; data: Partial<Customer> }) => 
    apiService.customers.update(id, data)
  )
}

export function useCreateReservation() {
  return useApiMutation((data: Partial<Reservation>) => apiService.reservations.create(data))
}

export function useCreateRating() {
  return useApiMutation((data: Partial<Rating>) => apiService.ratings.create(data))
}

export function useCreateComment() {
  return useApiMutation((data: Partial<Comment>) => apiService.comments.create(data))
}

export function useCreateSocialHub() {
  return useApiMutation((data: Partial<SocialHub>) => apiService.socialHubs.create(data))
}

export function useUpdateSocialHub() {
  return useApiMutation(({ id, data }: { id: string; data: Partial<SocialHub> }) => 
    apiService.socialHubs.update(id, data)
  )
}

export function useDeleteSocialHub() {
  return useApiMutation((id: string) => apiService.socialHubs.delete(id))
}

export function useAddFavorite() {
  return useApiMutation(({ customerId, socialHubId }: { customerId: string; socialHubId: string }) =>
    apiService.customers.addFavorite(customerId, socialHubId)
  )
}

export function useRemoveFavorite() {
  return useApiMutation(({ customerId, socialHubId }: { customerId: string; socialHubId: string }) =>
    apiService.customers.removeFavorite(customerId, socialHubId)
  )
}

// Search and filter hooks
export function useSearchEvents(query: string) {
  return useApiData(() => apiUtils.searchEvents(query), [query])
}

export function useFilterEventsByPrice(minPrice: number, maxPrice: number) {
  return useApiData(() => apiUtils.filterEventsByPrice(minPrice, maxPrice), [minPrice, maxPrice])
}

export function useFilterEventsByDate(date: string) {
  return useApiData(() => apiUtils.filterEventsByDate(date), [date])
}

// Authentication hook with phone-based authentication
export function useAuth() {
  const { state, dispatch } = useStore()
  const [user, setUser] = useState<Customer | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const sendVerificationCode = useCallback(async (phoneNumber: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/auth/send-verification-code/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: phoneNumber }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send verification code')
      }

      return await response.json()
    } catch (error) {
      console.error('Send verification code error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const verifyPhoneAndLogin = useCallback(async (phoneNumber: string, verificationCode: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/auth/verify-phone-login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone_number: phoneNumber, 
          verification_code: verificationCode 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to verify phone number')
      }

      const authData = await response.json()
      
      // Save JWT tokens to localStorage
      if (authData.access && authData.refresh) {
        localStorage.setItem('access_token', authData.access)
        localStorage.setItem('refresh_token', authData.refresh)
      }
      
      // If it's a first-time user, we don't set the user yet
      if (authData.is_first_time) {
        return authData
      }

      // For existing users, fetch their full profile
      const customerResponse = await fetch(`${API_BASE_URL}/customers/${authData.customer_id}/`, {
        headers: {
          'Authorization': `Bearer ${authData.access}`,
          'Content-Type': 'application/json',
        },
      })
      if (customerResponse.ok) {
        const customerData = await customerResponse.json()
        setUser(customerData)
        setIsAuthenticated(true)
        // Also update the store's authentication state
        dispatch({ type: 'login', customer: customerData })
      }

      return authData
    } catch (error) {
      console.error('Verify phone and login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const completeProfile = useCallback(async (
    customerId: string, 
    firstName: string, 
    lastName: string, 
    username: string
  ) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/auth/complete-profile/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          f_name: firstName,
          l_name: lastName,
          username: username,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to complete profile')
      }

      const profileData = await response.json()
      
      // Save JWT tokens to localStorage if they exist
      if (profileData.access && profileData.refresh) {
        localStorage.setItem('access_token', profileData.access)
        localStorage.setItem('refresh_token', profileData.refresh)
      }
      
      // Fetch the complete customer data
      const accessToken = localStorage.getItem('access_token')
      const customerResponse = await fetch(`${API_BASE_URL}/customers/${customerId}/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      if (customerResponse.ok) {
        const customerData = await customerResponse.json()
        setUser(customerData)
        setIsAuthenticated(true)
        // Also update the store's authentication state
        dispatch({ type: 'login', customer: customerData })
      }

      return profileData
    } catch (error) {
      console.error('Complete profile error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setIsAuthenticated(false)
    // Clear tokens from localStorage
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    // Also update the store's authentication state
    dispatch({ type: 'logout' })
  }, [dispatch])

  // Sync with store's authentication state
  useEffect(() => {
    if (state.auth.user && !user) {
      setUser(state.auth.user)
      setIsAuthenticated(true)
    } else if (!state.auth.user && user) {
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [state.auth.user, user])

  return {
    user,
    isAuthenticated,
    isLoading,
    sendVerificationCode,
    verifyPhoneAndLogin,
    completeProfile,
    logout
  }
}