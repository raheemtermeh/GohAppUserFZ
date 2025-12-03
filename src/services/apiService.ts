// Generic API service for making authenticated requests
import { API_CONFIG } from '../config/api'

const API_BASE_URL = API_CONFIG.API_BASE_URL

class ApiService {
  private baseURL: string
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.loadTokensFromStorage()
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('access_token')
    this.refreshToken = localStorage.getItem('refresh_token')
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      return null
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: this.refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        this.accessToken = data.access
        localStorage.setItem('access_token', data.access)
        return data.access
      } else {
        // Refresh token is invalid, clear all tokens
        this.clearTokens()
        return null
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      this.clearTokens()
      return null
    }
  }

  private clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add authorization header if required and token is available
    if (requireAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    const config: RequestInit = {
      headers,
      ...options,
    }

    try {
      let response = await fetch(url, config)
      
      // If unauthorized and we have a refresh token, try to refresh
      if (response.status === 401 && requireAuth && this.refreshToken) {
        const newAccessToken = await this.refreshAccessToken()
        if (newAccessToken) {
          // Retry the request with the new access token
          headers['Authorization'] = `Bearer ${newAccessToken}`
          config.headers = headers
          response = await fetch(url, config)
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Convenience methods for common HTTP verbs
  async get<T>(endpoint: string, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, requireAuth)
  }

  async post<T>(endpoint: string, data?: any, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, requireAuth)
  }

  async put<T>(endpoint: string, data?: any, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, requireAuth)
  }

  async delete<T>(endpoint: string, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, requireAuth)
  }

  async patch<T>(endpoint: string, data?: any, requireAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, requireAuth)
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
  }
}

// Create API service instance
export const apiService = new ApiService(API_BASE_URL)
export default apiService

