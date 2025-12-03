import { useState, useEffect, useCallback } from 'react'
import { apiService, SocialHub } from '../services/api'
import { useStore } from '../state/apiStore'

interface UseSocialHubsMapReturn {
  socialHubs: SocialHub[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSocialHubsMap(): UseSocialHubsMapReturn {
  const { state } = useStore()
  const [socialHubs, setSocialHubs] = useState<SocialHub[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSocialHubs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get social hubs from API
      const response = await apiService.socialHubs.list()
      const hubsWithLocation = response.results.filter(
        hub => hub.latitude && hub.longitude
      )
      
      setSocialHubs(hubsWithLocation)
      
    } catch (err) {
      console.error('Failed to fetch social hubs:', err)
      setError('Failed to load venues')
      
      // Fallback to state data
      const fallbackHubs = state.socialHubs.filter(
        hub => hub.latitude && hub.longitude
      )
      setSocialHubs(fallbackHubs)
    } finally {
      setLoading(false)
    }
  }, [state.socialHubs])

  useEffect(() => {
    fetchSocialHubs()
  }, [fetchSocialHubs])

  return {
    socialHubs,
    loading,
    error,
    refetch: fetchSocialHubs
  }
}

