// Configuration for API integration
// Read from environment variables with fallback defaults
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
}

const getFrontendUrl = () => {
  return import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5174'
}

export const API_CONFIG = {
  // Set to true to use real Django API, false for mock data
  USE_REAL_API: true,
  
  // Django API base URL - read from environment variable
  API_BASE_URL: getApiBaseUrl(),
  
  // Frontend URL for CORS - read from environment variable
  FRONTEND_URL: getFrontendUrl(),
  
  // API endpoints
  ENDPOINTS: {
    CUSTOMERS: '/customers/',
    SOCIAL_HUBS: '/social-hubs/',
    EVENTS: '/events/',
    EVENT_CATEGORIES: '/event-categories/',
    RESERVATIONS: '/reservations/',
    RATINGS: '/ratings/',
    COMMENTS: '/comments/',
    // Authentication endpoints
    AUTH: {
      SEND_VERIFICATION_CODE: '/auth/send-verification-code/',
      VERIFY_PHONE_LOGIN: '/auth/verify-phone-login/',
      COMPLETE_PROFILE: '/auth/complete-profile/',
      LOGIN: '/auth/login/',
    },
  },
  
  // Default pagination
  DEFAULT_PAGE_SIZE: 20,
  
  // Request timeout (ms)
  REQUEST_TIMEOUT: 10000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
}

// Environment-specific configuration
export const getApiConfig = () => {
  const isDevelopment = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development'
  
  return {
    ...API_CONFIG,
    USE_REAL_API: isDevelopment ? API_CONFIG.USE_REAL_API : true,
    API_BASE_URL: getApiBaseUrl(),
    FRONTEND_URL: getFrontendUrl(),
  }
}

export default API_CONFIG