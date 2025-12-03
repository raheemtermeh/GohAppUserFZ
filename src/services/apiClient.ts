// Centralized API client for all API requests
import { API_CONFIG } from '../config/api'
import { cacheService } from './cacheService'

interface CacheOptions {
  enabled?: boolean
  ttl?: number // Time to live in milliseconds
  tags?: string[] // Tags for cache invalidation
  key?: string // Custom cache key (default: endpoint + params)
}

class ApiClient {
  private baseURL: string
  private timeout: number

  constructor() {
    this.baseURL = API_CONFIG.API_BASE_URL
    this.timeout = API_CONFIG.REQUEST_TIMEOUT
  }

  /**
   * Get the full URL for an endpoint
   */
  private getUrl(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    return `${this.baseURL}/${cleanEndpoint}`
  }

  /**
   * Generate cache key from endpoint and params
   */
  private getCacheKey(endpoint: string, params?: Record<string, any>, customKey?: string): string {
    if (customKey) {
      return customKey
    }
    
    const baseKey = endpoint.replace(/\//g, '_').replace(/^_/, '')
    if (params) {
      const paramsStr = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}_${String(value)}`)
        .join('_')
      return `${baseKey}_${paramsStr}`
    }
    return baseKey
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  /**
   * Make a GET request with optional caching
   */
  async get<T>(
    endpoint: string, 
    params?: Record<string, any>,
    cacheOptions?: CacheOptions
  ): Promise<T> {
    // Check cache if enabled
    const cacheEnabled = cacheOptions?.enabled !== false
    if (cacheEnabled) {
      const cacheKey = this.getCacheKey(endpoint, params, cacheOptions?.key)
      const cached = cacheService.get<T>(cacheKey)
      if (cached !== null) {
        return cached
      }
    }

    // Build URL - handle endpoints that might already have query parameters
    const baseUrl = this.getUrl(endpoint)
    const url = new URL(baseUrl)
    
    // Add query parameters from params object
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value)) // Use set to override if exists
        }
      })
    }
    
    console.log(`API GET request: ${url.toString()}`)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }

    let data: T
    try {
      data = await response.json()
    } catch (e) {
      throw new Error(`Failed to parse response as JSON: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
    
    // Cache the response if enabled
    if (cacheEnabled) {
      const cacheKey = this.getCacheKey(endpoint, params, cacheOptions?.key)
      if (cacheOptions?.tags && cacheOptions.tags.length > 0) {
        cacheService.setWithTags(cacheKey, data, cacheOptions.tags, cacheOptions?.ttl)
      } else {
        cacheService.set(cacheKey, data, cacheOptions?.ttl)
      }
    }

    return data
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data?: any, invalidateCache?: string[]): Promise<T> {
    const response = await fetch(this.getUrl(endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      let errorData: any = null
      try {
        errorData = await response.json()
        // Handle different error response formats
        if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors.join(', ')
        } else if (typeof errorData === 'object') {
          // Handle field-specific errors
          const fieldErrors = Object.entries(errorData)
            .map(([field, errors]: [string, any]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`
              }
              return `${field}: ${errors}`
            })
            .join('; ')
          if (fieldErrors) {
            errorMessage = fieldErrors
          }
        }
      } catch (e) {
        errorMessage = response.statusText || errorMessage
      }
      
      // Create error with full details
      const error = new Error(errorMessage) as any
      error.status = response.status
      error.response = { data: errorData, status: response.status }
      throw error
    }

    let result: T
    try {
      result = await response.json()
    } catch (e) {
      throw new Error(`Failed to parse response as JSON: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
    
    // Invalidate cache after successful POST
    if (invalidateCache && invalidateCache.length > 0) {
      invalidateCache.forEach(tag => this.invalidateCacheByTag(tag))
    } else {
      // Default: invalidate cache for the endpoint pattern
      this.invalidateCacheByPattern(endpoint.replace(/\//g, '_'))
    }
    
    return result
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, data?: any, invalidateCache?: string[]): Promise<T> {
    const response = await fetch(this.getUrl(endpoint), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage
      } catch (e) {
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }

    let result: T
    try {
      result = await response.json()
    } catch (e) {
      throw new Error(`Failed to parse response as JSON: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
    
    // Invalidate cache after successful PUT
    if (invalidateCache && invalidateCache.length > 0) {
      invalidateCache.forEach(tag => this.invalidateCacheByTag(tag))
    } else {
      this.invalidateCacheByPattern(endpoint.replace(/\//g, '_'))
    }
    
    return result
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(endpoint: string, data?: any, invalidateCache?: string[]): Promise<T> {
    const response = await fetch(this.getUrl(endpoint), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage
      } catch (e) {
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }

    let result: T
    try {
      result = await response.json()
    } catch (e) {
      throw new Error(`Failed to parse response as JSON: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
    
    // Invalidate cache after successful PATCH
    if (invalidateCache && invalidateCache.length > 0) {
      invalidateCache.forEach(tag => this.invalidateCacheByTag(tag))
    } else {
      this.invalidateCacheByPattern(endpoint.replace(/\//g, '_'))
    }
    
    return result
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string, invalidateCache?: string[]): Promise<T> {
    const response = await fetch(this.getUrl(endpoint), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    })

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage
      } catch (e) {
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }

    // DELETE requests might not return JSON
    const text = await response.text()
    let result: T
    if (text) {
    try {
        result = JSON.parse(text)
    } catch {
        // If it's not valid JSON, return empty object or text
        result = (text.trim() ? text : {}) as T
      }
    } else {
      result = {} as T
    }
    
    // Invalidate cache after successful DELETE
    if (invalidateCache && invalidateCache.length > 0) {
      invalidateCache.forEach(tag => this.invalidateCacheByTag(tag))
    } else {
      this.invalidateCacheByPattern(endpoint.replace(/\//g, '_'))
    }
    
    return result
  }

  /**
   * Get API endpoints
   */
  get endpoints() {
    return API_CONFIG.ENDPOINTS
  }

  /**
   * Invalidate cache by tag
   */
  invalidateCacheByTag(tag: string): number {
    return cacheService.invalidateTag(tag)
  }

  /**
   * Invalidate cache by pattern
   */
  invalidateCacheByPattern(pattern: string | RegExp): number {
    return cacheService.deletePattern(pattern)
  }

  /**
   * Clear all API cache
   */
  clearCache(): void {
    cacheService.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return cacheService.getStats()
  }
}

// Export cache options type
export type { CacheOptions }

// Export a singleton instance
export const apiClient = new ApiClient()
export default apiClient