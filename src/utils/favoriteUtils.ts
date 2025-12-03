import { Dispatch } from 'react';
import { API_CONFIG } from '../config/api';

interface ToggleFavoriteParams {
  socialHubId: string;
  userId: string;
  accessToken: string;
  dispatch: Dispatch<any>;
  navigate: (path: string) => void;
  state: any;
}

/**
 * Utility function to toggle favorite status with backend API call
 * and local state update
 */
export const toggleFavoriteWithBackend = async ({
  socialHubId,
  userId,
  accessToken,
  dispatch,
  navigate,
  state
}: ToggleFavoriteParams): Promise<void> => {
  // Check if user is authenticated
  if (!state.auth.user || !state.auth.isLoggedIn) {
    // Store current page URL for redirect after login
    const currentUrl = window.location.pathname + window.location.search;
    dispatch({ type: 'set_redirect_url', url: currentUrl });
    
    // Redirect to login page
    navigate('/login');
    return;
  }

  try {
    // Call backend API to toggle favorite
    const response = await fetch(
      `${API_CONFIG.API_BASE_URL}/customers/${userId}/favorites/${socialHubId}/toggle/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to toggle favorite');
    }

    const data = await response.json();
    
    // Update local state based on backend response
    if (data.action === 'added') {
      dispatch({ type: 'add_favorite', socialHubId });
    } else if (data.action === 'removed') {
      dispatch({ type: 'remove_favorite', socialHubId });
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
  }
};