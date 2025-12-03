/**
 * Favorites Service
 * Handles all favorites-related API calls
 */

import { API_CONFIG } from '../config/api'

export interface SocialHub {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  average_rating?: number;
  image_url?: string;
  postal_code?: number;
  amenities: string[];
  events_count: number;
  owner: {
    id: string;
    f_name: string;
    l_name: string;
    mobile_number: string;
  };
}

export interface FavoritesResponse {
  customer_id: string;
  favorites: SocialHub[];
  count: number;
  message: string;
}

export interface FavoriteActionResponse {
  customer_id: string;
  social_hub_id: string;
  social_hub_name: string;
  is_favorite: boolean;
  message: string;
  action?: string;
}

export interface FavoriteStatusResponse {
  customer_id: string;
  social_hub_id: string;
  social_hub_name: string;
  is_favorite: boolean;
}

export interface FavoritesCountResponse {
  customer_id: string;
  favorites_count: number;
  message: string;
}

class FavoritesService {
  private baseUrl = API_CONFIG.API_BASE_URL;

  /**
   * Get all favorites for a customer with full details
   */
  async getFavorites(customerId: string, accessToken: string): Promise<FavoritesResponse> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}/favorites/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Add a social hub to favorites
   */
  async addToFavorites(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add to favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Remove a social hub from favorites
   */
  async removeFromFavorites(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/remove/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to remove from favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/toggle/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to toggle favorite: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if a social hub is in favorites
   */
  async checkFavoriteStatus(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteStatusResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/check/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check favorite status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get favorites count
   */
  async getFavoritesCount(customerId: string, accessToken: string): Promise<FavoritesCountResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/count/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get favorites count: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Clear all favorites
   */
  async clearAllFavorites(customerId: string, accessToken: string): Promise<{
    message: string;
    customer_id: string;
    favorites_count: number;
    cleared_count: number;
  }> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/clear/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to clear favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Batch check favorite status for multiple social hubs
   */
  async batchCheckFavoriteStatus(
    customerId: string, 
    socialHubIds: string[], 
    accessToken: string
  ): Promise<Record<string, boolean>> {
    const promises = socialHubIds.map(id => 
      this.checkFavoriteStatus(customerId, id, accessToken)
        .then(result => ({ id, is_favorite: result.is_favorite }))
        .catch(() => ({ id, is_favorite: false }))
    );

    const results = await Promise.all(promises);
    
    return results.reduce((acc, { id, is_favorite }) => {
      acc[id] = is_favorite;
      return acc;
    }, {} as Record<string, boolean>);
  }
}

export const favoritesService = new FavoritesService();
export default favoritesService;



 * Handles all favorites-related API calls
 */

export interface SocialHub {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  average_rating?: number;
  image_url?: string;
  postal_code?: number;
  amenities: string[];
  events_count: number;
  owner: {
    id: string;
    f_name: string;
    l_name: string;
    mobile_number: string;
  };
}

export interface FavoritesResponse {
  customer_id: string;
  favorites: SocialHub[];
  count: number;
  message: string;
}

export interface FavoriteActionResponse {
  customer_id: string;
  social_hub_id: string;
  social_hub_name: string;
  is_favorite: boolean;
  message: string;
  action?: string;
}

export interface FavoriteStatusResponse {
  customer_id: string;
  social_hub_id: string;
  social_hub_name: string;
  is_favorite: boolean;
}

export interface FavoritesCountResponse {
  customer_id: string;
  favorites_count: number;
  message: string;
}

class FavoritesService {
  private baseUrl = API_CONFIG.API_BASE_URL;

  /**
   * Get all favorites for a customer with full details
   */
  async getFavorites(customerId: string, accessToken: string): Promise<FavoritesResponse> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}/favorites/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Add a social hub to favorites
   */
  async addToFavorites(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add to favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Remove a social hub from favorites
   */
  async removeFromFavorites(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/remove/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to remove from favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/toggle/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to toggle favorite: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if a social hub is in favorites
   */
  async checkFavoriteStatus(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteStatusResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/check/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check favorite status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get favorites count
   */
  async getFavoritesCount(customerId: string, accessToken: string): Promise<FavoritesCountResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/count/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get favorites count: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Clear all favorites
   */
  async clearAllFavorites(customerId: string, accessToken: string): Promise<{
    message: string;
    customer_id: string;
    favorites_count: number;
    cleared_count: number;
  }> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/clear/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to clear favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Batch check favorite status for multiple social hubs
   */
  async batchCheckFavoriteStatus(
    customerId: string, 
    socialHubIds: string[], 
    accessToken: string
  ): Promise<Record<string, boolean>> {
    const promises = socialHubIds.map(id => 
      this.checkFavoriteStatus(customerId, id, accessToken)
        .then(result => ({ id, is_favorite: result.is_favorite }))
        .catch(() => ({ id, is_favorite: false }))
    );

    const results = await Promise.all(promises);
    
    return results.reduce((acc, { id, is_favorite }) => {
      acc[id] = is_favorite;
      return acc;
    }, {} as Record<string, boolean>);
  }
}

export const favoritesService = new FavoritesService();
export default favoritesService;



 * Handles all favorites-related API calls
 */

export interface SocialHub {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  average_rating?: number;
  image_url?: string;
  postal_code?: number;
  amenities: string[];
  events_count: number;
  owner: {
    id: string;
    f_name: string;
    l_name: string;
    mobile_number: string;
  };
}

export interface FavoritesResponse {
  customer_id: string;
  favorites: SocialHub[];
  count: number;
  message: string;
}

export interface FavoriteActionResponse {
  customer_id: string;
  social_hub_id: string;
  social_hub_name: string;
  is_favorite: boolean;
  message: string;
  action?: string;
}

export interface FavoriteStatusResponse {
  customer_id: string;
  social_hub_id: string;
  social_hub_name: string;
  is_favorite: boolean;
}

export interface FavoritesCountResponse {
  customer_id: string;
  favorites_count: number;
  message: string;
}

class FavoritesService {
  private baseUrl = API_CONFIG.API_BASE_URL;

  /**
   * Get all favorites for a customer with full details
   */
  async getFavorites(customerId: string, accessToken: string): Promise<FavoritesResponse> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}/favorites/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Add a social hub to favorites
   */
  async addToFavorites(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add to favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Remove a social hub from favorites
   */
  async removeFromFavorites(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/remove/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to remove from favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/toggle/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to toggle favorite: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if a social hub is in favorites
   */
  async checkFavoriteStatus(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteStatusResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/check/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check favorite status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get favorites count
   */
  async getFavoritesCount(customerId: string, accessToken: string): Promise<FavoritesCountResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/count/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get favorites count: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Clear all favorites
   */
  async clearAllFavorites(customerId: string, accessToken: string): Promise<{
    message: string;
    customer_id: string;
    favorites_count: number;
    cleared_count: number;
  }> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/clear/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to clear favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Batch check favorite status for multiple social hubs
   */
  async batchCheckFavoriteStatus(
    customerId: string, 
    socialHubIds: string[], 
    accessToken: string
  ): Promise<Record<string, boolean>> {
    const promises = socialHubIds.map(id => 
      this.checkFavoriteStatus(customerId, id, accessToken)
        .then(result => ({ id, is_favorite: result.is_favorite }))
        .catch(() => ({ id, is_favorite: false }))
    );

    const results = await Promise.all(promises);
    
    return results.reduce((acc, { id, is_favorite }) => {
      acc[id] = is_favorite;
      return acc;
    }, {} as Record<string, boolean>);
  }
}

export const favoritesService = new FavoritesService();
export default favoritesService;



 * Handles all favorites-related API calls
 */

export interface SocialHub {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  average_rating?: number;
  image_url?: string;
  postal_code?: number;
  amenities: string[];
  events_count: number;
  owner: {
    id: string;
    f_name: string;
    l_name: string;
    mobile_number: string;
  };
}

export interface FavoritesResponse {
  customer_id: string;
  favorites: SocialHub[];
  count: number;
  message: string;
}

export interface FavoriteActionResponse {
  customer_id: string;
  social_hub_id: string;
  social_hub_name: string;
  is_favorite: boolean;
  message: string;
  action?: string;
}

export interface FavoriteStatusResponse {
  customer_id: string;
  social_hub_id: string;
  social_hub_name: string;
  is_favorite: boolean;
}

export interface FavoritesCountResponse {
  customer_id: string;
  favorites_count: number;
  message: string;
}

class FavoritesService {
  private baseUrl = API_CONFIG.API_BASE_URL;

  /**
   * Get all favorites for a customer with full details
   */
  async getFavorites(customerId: string, accessToken: string): Promise<FavoritesResponse> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}/favorites/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Add a social hub to favorites
   */
  async addToFavorites(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add to favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Remove a social hub from favorites
   */
  async removeFromFavorites(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/remove/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to remove from favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/toggle/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to toggle favorite: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if a social hub is in favorites
   */
  async checkFavoriteStatus(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteStatusResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/check/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check favorite status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get favorites count
   */
  async getFavoritesCount(customerId: string, accessToken: string): Promise<FavoritesCountResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/count/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get favorites count: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Clear all favorites
   */
  async clearAllFavorites(customerId: string, accessToken: string): Promise<{
    message: string;
    customer_id: string;
    favorites_count: number;
    cleared_count: number;
  }> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/clear/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to clear favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Batch check favorite status for multiple social hubs
   */
  async batchCheckFavoriteStatus(
    customerId: string, 
    socialHubIds: string[], 
    accessToken: string
  ): Promise<Record<string, boolean>> {
    const promises = socialHubIds.map(id => 
      this.checkFavoriteStatus(customerId, id, accessToken)
        .then(result => ({ id, is_favorite: result.is_favorite }))
        .catch(() => ({ id, is_favorite: false }))
    );

    const results = await Promise.all(promises);
    
    return results.reduce((acc, { id, is_favorite }) => {
      acc[id] = is_favorite;
      return acc;
    }, {} as Record<string, boolean>);
  }
}

export const favoritesService = new FavoritesService();
export default favoritesService;



 * Handles all favorites-related API calls
 */

export interface SocialHub {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  average_rating?: number;
  image_url?: string;
  postal_code?: number;
  amenities: string[];
  events_count: number;
  owner: {
    id: string;
    f_name: string;
    l_name: string;
    mobile_number: string;
  };
}

export interface FavoritesResponse {
  customer_id: string;
  favorites: SocialHub[];
  count: number;
  message: string;
}

export interface FavoriteActionResponse {
  customer_id: string;
  social_hub_id: string;
  social_hub_name: string;
  is_favorite: boolean;
  message: string;
  action?: string;
}

export interface FavoriteStatusResponse {
  customer_id: string;
  social_hub_id: string;
  social_hub_name: string;
  is_favorite: boolean;
}

export interface FavoritesCountResponse {
  customer_id: string;
  favorites_count: number;
  message: string;
}

class FavoritesService {
  private baseUrl = API_CONFIG.API_BASE_URL;

  /**
   * Get all favorites for a customer with full details
   */
  async getFavorites(customerId: string, accessToken: string): Promise<FavoritesResponse> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}/favorites/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Add a social hub to favorites
   */
  async addToFavorites(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add to favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Remove a social hub from favorites
   */
  async removeFromFavorites(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/remove/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to remove from favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/toggle/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to toggle favorite: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if a social hub is in favorites
   */
  async checkFavoriteStatus(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteStatusResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/check/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check favorite status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get favorites count
   */
  async getFavoritesCount(customerId: string, accessToken: string): Promise<FavoritesCountResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/count/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get favorites count: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Clear all favorites
   */
  async clearAllFavorites(customerId: string, accessToken: string): Promise<{
    message: string;
    customer_id: string;
    favorites_count: number;
    cleared_count: number;
  }> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/clear/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to clear favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Batch check favorite status for multiple social hubs
   */
  async batchCheckFavoriteStatus(
    customerId: string, 
    socialHubIds: string[], 
    accessToken: string
  ): Promise<Record<string, boolean>> {
    const promises = socialHubIds.map(id => 
      this.checkFavoriteStatus(customerId, id, accessToken)
        .then(result => ({ id, is_favorite: result.is_favorite }))
        .catch(() => ({ id, is_favorite: false }))
    );

    const results = await Promise.all(promises);
    
    return results.reduce((acc, { id, is_favorite }) => {
      acc[id] = is_favorite;
      return acc;
    }, {} as Record<string, boolean>);
  }
}

export const favoritesService = new FavoritesService();
export default favoritesService;



 * Handles all favorites-related API calls
 */

export interface SocialHub {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  average_rating?: number;
  image_url?: string;
  postal_code?: number;
  amenities: string[];
  events_count: number;
  owner: {
    id: string;
    f_name: string;
    l_name: string;
    mobile_number: string;
  };
}

export interface FavoritesResponse {
  customer_id: string;
  favorites: SocialHub[];
  count: number;
  message: string;
}

export interface FavoriteActionResponse {
  customer_id: string;
  social_hub_id: string;
  social_hub_name: string;
  is_favorite: boolean;
  message: string;
  action?: string;
}

export interface FavoriteStatusResponse {
  customer_id: string;
  social_hub_id: string;
  social_hub_name: string;
  is_favorite: boolean;
}

export interface FavoritesCountResponse {
  customer_id: string;
  favorites_count: number;
  message: string;
}

class FavoritesService {
  private baseUrl = API_CONFIG.API_BASE_URL;

  /**
   * Get all favorites for a customer with full details
   */
  async getFavorites(customerId: string, accessToken: string): Promise<FavoritesResponse> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}/favorites/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Add a social hub to favorites
   */
  async addToFavorites(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add to favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Remove a social hub from favorites
   */
  async removeFromFavorites(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/remove/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to remove from favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/toggle/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to toggle favorite: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if a social hub is in favorites
   */
  async checkFavoriteStatus(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteStatusResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/check/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check favorite status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get favorites count
   */
  async getFavoritesCount(customerId: string, accessToken: string): Promise<FavoritesCountResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/count/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get favorites count: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Clear all favorites
   */
  async clearAllFavorites(customerId: string, accessToken: string): Promise<{
    message: string;
    customer_id: string;
    favorites_count: number;
    cleared_count: number;
  }> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/clear/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to clear favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Batch check favorite status for multiple social hubs
   */
  async batchCheckFavoriteStatus(
    customerId: string, 
    socialHubIds: string[], 
    accessToken: string
  ): Promise<Record<string, boolean>> {
    const promises = socialHubIds.map(id => 
      this.checkFavoriteStatus(customerId, id, accessToken)
        .then(result => ({ id, is_favorite: result.is_favorite }))
        .catch(() => ({ id, is_favorite: false }))
    );

    const results = await Promise.all(promises);
    
    return results.reduce((acc, { id, is_favorite }) => {
      acc[id] = is_favorite;
      return acc;
    }, {} as Record<string, boolean>);
  }
}

export const favoritesService = new FavoritesService();
export default favoritesService;



 * Handles all favorites-related API calls
 */

export interface SocialHub {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  average_rating?: number;
  image_url?: string;
  postal_code?: number;
  amenities: string[];
  events_count: number;
  owner: {
    id: string;
    f_name: string;
    l_name: string;
    mobile_number: string;
  };
}

export interface FavoritesResponse {
  customer_id: string;
  favorites: SocialHub[];
  count: number;
  message: string;
}

export interface FavoriteActionResponse {
  customer_id: string;
  social_hub_id: string;
  social_hub_name: string;
  is_favorite: boolean;
  message: string;
  action?: string;
}

export interface FavoriteStatusResponse {
  customer_id: string;
  social_hub_id: string;
  social_hub_name: string;
  is_favorite: boolean;
}

export interface FavoritesCountResponse {
  customer_id: string;
  favorites_count: number;
  message: string;
}

class FavoritesService {
  private baseUrl = API_CONFIG.API_BASE_URL;

  /**
   * Get all favorites for a customer with full details
   */
  async getFavorites(customerId: string, accessToken: string): Promise<FavoritesResponse> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}/favorites/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Add a social hub to favorites
   */
  async addToFavorites(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add to favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Remove a social hub from favorites
   */
  async removeFromFavorites(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/remove/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to remove from favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteActionResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/toggle/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to toggle favorite: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if a social hub is in favorites
   */
  async checkFavoriteStatus(
    customerId: string, 
    socialHubId: string, 
    accessToken: string
  ): Promise<FavoriteStatusResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/${socialHubId}/check/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check favorite status: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get favorites count
   */
  async getFavoritesCount(customerId: string, accessToken: string): Promise<FavoritesCountResponse> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/count/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get favorites count: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Clear all favorites
   */
  async clearAllFavorites(customerId: string, accessToken: string): Promise<{
    message: string;
    customer_id: string;
    favorites_count: number;
    cleared_count: number;
  }> {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/favorites/clear/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to clear favorites: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Batch check favorite status for multiple social hubs
   */
  async batchCheckFavoriteStatus(
    customerId: string, 
    socialHubIds: string[], 
    accessToken: string
  ): Promise<Record<string, boolean>> {
    const promises = socialHubIds.map(id => 
      this.checkFavoriteStatus(customerId, id, accessToken)
        .then(result => ({ id, is_favorite: result.is_favorite }))
        .catch(() => ({ id, is_favorite: false }))
    );

    const results = await Promise.all(promises);
    
    return results.reduce((acc, { id, is_favorite }) => {
      acc[id] = is_favorite;
      return acc;
    }, {} as Record<string, boolean>);
  }
}

export const favoritesService = new FavoritesService();
export default favoritesService;


