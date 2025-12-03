// Authentication service for customer app
import { apiClient } from './apiClient'

export interface AuthResponse {
  message: string
  access: string
  refresh: string
  customer_id: string
  phone_number: string
  is_first_time: boolean
  needs_complete_profile: boolean
  role: string
  username?: string
  f_name?: string
  l_name?: string
}

export interface VerificationResponse {
  message: string
  phone_number: string
  verification_code: string
  expires_in_minutes: number
}

export interface ProfileCompletionResponse {
  message: string
  customer_id: string
  username: string
  f_name: string
  l_name: string
  phone_number: string
  role: string
}

class AuthService {
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
    this.loadTokensFromStorage()
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('access_token')
    this.refreshToken = localStorage.getItem('refresh_token')
  }

  private saveTokensToStorage(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  }

  private clearTokensFromStorage() {
    this.accessToken = null
    this.refreshToken = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      return null
    }

    try {
      const data = await apiClient.post('auth/token/refresh/', { refresh: this.refreshToken })
      this.accessToken = data.access
      localStorage.setItem('access_token', data.access)
      return data.access
    } catch (error) {
      console.error('Token refresh failed:', error)
      this.clearTokensFromStorage()
      return null
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = false
  ): Promise<T> {
    try {
      // Use the centralized API client
      let result: T
      
      if (options.method === 'POST') {
        result = await apiClient.post<T>(endpoint, options.body ? JSON.parse(options.body as string) : undefined)
      } else if (options.method === 'PUT') {
        result = await apiClient.put<T>(endpoint, options.body ? JSON.parse(options.body as string) : undefined)
      } else if (options.method === 'PATCH') {
        result = await apiClient.patch<T>(endpoint, options.body ? JSON.parse(options.body as string) : undefined)
      } else if (options.method === 'DELETE') {
        result = await apiClient.delete<T>(endpoint)
      } else {
        result = await apiClient.get<T>(endpoint)
      }
      
      return result
    } catch (error) {
      console.error(`Auth request failed for ${endpoint}:`, error)
      throw error
    }
  }

  async sendVerificationCode(phoneNumber: string): Promise<VerificationResponse> {
    return this.request<VerificationResponse>('/auth/send-verification-code/', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber }),
    })
  }

  async verifyPhoneAndLogin(phoneNumber: string, verificationCode: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/verify-phone-login/', {
      method: 'POST',
      body: JSON.stringify({ 
        phone_number: phoneNumber, 
        verification_code: verificationCode 
      }),
    })
    
    // Save JWT tokens to storage
    if (response.access && response.refresh) {
      this.saveTokensToStorage(response.access, response.refresh)
    }
    
    return response
  }

  async completeProfile(
    customerId: string, 
    firstName: string, 
    lastName: string, 
    username: string
  ): Promise<ProfileCompletionResponse> {
    return this.request<ProfileCompletionResponse>('/auth/complete-profile/', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customerId,
        f_name: firstName,
        l_name: lastName,
        username: username,
      }),
    })
  }

  // JWT Authentication methods
  async logout(): Promise<void> {
    if (this.refreshToken) {
      try {
        await this.request('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: this.refreshToken }),
        }, true)
      } catch (error) {
        console.error('Logout request failed:', error)
      }
    }
    this.clearTokensFromStorage()
  }

  async getProfile(): Promise<any> {
    return this.request('/auth/profile/', {
      method: 'GET',
    }, true)
  }

  async updateProfile(profileData: any): Promise<any> {
    return this.request('/auth/profile/update/', {
      method: 'POST',
      body: JSON.stringify(profileData),
    }, true)
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  getRefreshToken(): string | null {
    return this.refreshToken
  }

  // Legacy login method for backward compatibility
  async login(usernameOrEmail: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({
        username_or_email: usernameOrEmail,
        password: password,
      }),
    })
  }
}

// Create auth service instance
export const authService = new AuthService()

// Utility functions for phone number validation
export const phoneUtils = {
  validatePhoneNumber: (phoneNumber: string): boolean => {
    // Remove any spaces or special characters
    const phone = phoneNumber.replace(/[^\d+]/g, '')
    
    // Check if it starts with +98
    if (phone.startsWith('+98')) {
      const number = phone.slice(3)
      return number.length === 10 && number.startsWith('9')
    }
    
    // Check if it starts with 98
    if (phone.startsWith('98')) {
      const number = phone.slice(2)
      return number.length === 10 && number.startsWith('9')
    }
    
    // Check if it starts with 0
    if (phone.startsWith('0')) {
      const number = phone.slice(1)
      return number.length === 10 && number.startsWith('9')
    }
    
    // Check if it's just 10 digits starting with 9
    return phone.length === 10 && phone.startsWith('9')
  },

  formatPhoneNumber: (phoneNumber: string): string => {
    const phone = phoneNumber.replace(/[^\d+]/g, '')
    
    if (phone.startsWith('+98')) {
      return phone
    }
    
    if (phone.startsWith('98')) {
      return `+${phone}`
    }
    
    if (phone.startsWith('0')) {
      return `+98${phone.slice(1)}`
    }
    
    if (phone.length === 10 && phone.startsWith('9')) {
      return `+98${phone}`
    }
    
    return phone
  },

  normalizePhoneNumber: (phoneNumber: string): string => {
    const phone = phoneNumber.replace(/[^\d+]/g, '')
    
    if (phone.startsWith('+98')) {
      return phone.slice(3)
    }
    
    if (phone.startsWith('98')) {
      return phone.slice(2)
    }
    
    if (phone.startsWith('0')) {
      return phone.slice(1)
    }
    
    return phone
  }
}

export default authService


