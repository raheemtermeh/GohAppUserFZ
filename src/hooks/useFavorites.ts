import { useState, useEffect, useCallback } from 'react';
import { favoritesService, SocialHub, FavoritesResponse } from '../services/favoritesService';

interface UseFavoritesProps {
  customerId: string;
  accessToken: string;
}

interface UseFavoritesReturn {
  favorites: SocialHub[];
  loading: boolean;
  error: string | null;
  favoritesCount: number;
  isFavorite: (socialHubId: string) => boolean;
  addToFavorites: (socialHubId: string) => Promise<boolean>;
  removeFromFavorites: (socialHubId: string) => Promise<boolean>;
  toggleFavorite: (socialHubId: string) => Promise<boolean>;
  checkFavoriteStatus: (socialHubId: string) => Promise<boolean>;
  clearAllFavorites: () => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

export const useFavorites = ({ customerId, accessToken }: UseFavoritesProps): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<SocialHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);

  // Load favorites from API
  const loadFavorites = useCallback(async () => {
    if (!customerId || !accessToken) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await favoritesService.getFavorites(customerId, accessToken);
      setFavorites(response.favorites || []);
      setFavoritesCount(response.count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
      setFavorites([]);
      setFavoritesCount(0);
    } finally {
      setLoading(false);
    }
  }, [customerId, accessToken]);

  // Check if a social hub is in favorites
  const isFavorite = useCallback((socialHubId: string): boolean => {
    return favorites.some(hub => hub.id === socialHubId);
  }, [favorites]);

  // Add to favorites
  const addToFavorites = useCallback(async (socialHubId: string): Promise<boolean> => {
    try {
      setError(null);
      await favoritesService.addToFavorites(customerId, socialHubId, accessToken);
      
      // Refresh favorites list
      await loadFavorites();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to favorites');
      return false;
    }
  }, [customerId, accessToken, loadFavorites]);

  // Remove from favorites
  const removeFromFavorites = useCallback(async (socialHubId: string): Promise<boolean> => {
    try {
      setError(null);
      await favoritesService.removeFromFavorites(customerId, socialHubId, accessToken);
      
      // Refresh favorites list
      await loadFavorites();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from favorites');
      return false;
    }
  }, [customerId, accessToken, loadFavorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (socialHubId: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await favoritesService.toggleFavorite(customerId, socialHubId, accessToken);
      
      // Update local state immediately for better UX
      if (response.action === 'added') {
        // We need to fetch the full social hub details
        await loadFavorites();
      } else if (response.action === 'removed') {
        setFavorites(prev => prev.filter(hub => hub.id !== socialHubId));
        setFavoritesCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite');
      return false;
    }
  }, [customerId, accessToken, loadFavorites]);

  // Check favorite status
  const checkFavoriteStatus = useCallback(async (socialHubId: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await favoritesService.checkFavoriteStatus(customerId, socialHubId, accessToken);
      return response.is_favorite;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check favorite status');
      return false;
    }
  }, [customerId, accessToken]);

  // Clear all favorites
  const clearAllFavorites = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      await favoritesService.clearAllFavorites(customerId, accessToken);
      
      setFavorites([]);
      setFavoritesCount(0);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear favorites');
      return false;
    }
  }, [customerId, accessToken]);

  // Refresh favorites
  const refreshFavorites = useCallback(async (): Promise<void> => {
    await loadFavorites();
  }, [loadFavorites]);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    loading,
    error,
    favoritesCount,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    checkFavoriteStatus,
    clearAllFavorites,
    refreshFavorites,
  };
};

export default useFavorites;




