import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, MapPin, Star, Users, Calendar, Phone, Globe, Trash2, Search, Filter } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { API_CONFIG } from '../config/api';

interface SocialHub {
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

interface FavoritesPageProps {
  customerId: string;
  accessToken: string;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ customerId, accessToken }) => {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<SocialHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'events'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'with_events' | 'high_rated'>('all');

  // Fetch favorites from API
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`customers/${customerId}/favorites/`);
      setFavorites(data.favorites || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  // Remove from favorites
  const removeFromFavorites = async (socialHubId: string) => {
    try {
      const response = await fetch(
        `${API_CONFIG.API_BASE_URL}/customers/${customerId}/favorites/${socialHubId}/remove/`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove from favorites');
      }

      // Remove from local state
      setFavorites(prev => prev.filter(hub => hub.id !== socialHubId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from favorites');
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (socialHubId: string) => {
    try {
      const response = await fetch(
        `${API_CONFIG.API_BASE_URL}/customers/${customerId}/favorites/${socialHubId}/toggle/`,
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
      if (data.action === 'removed') {
        setFavorites(prev => prev.filter(hub => hub.id !== socialHubId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite');
    }
  };

  // Clear all favorites
  const clearAllFavorites = async () => {
    if (!confirm(t('favorites.clearAllConfirm'))) return;

    try {
      const response = await fetch(
        `${API_CONFIG.API_BASE_URL}/customers/${customerId}/favorites/clear/`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to clear favorites');
      }

      setFavorites([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear favorites');
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [customerId, accessToken]);

  // Filter and sort favorites
  const filteredAndSortedFavorites = favorites
    .filter(hub => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          hub.name.toLowerCase().includes(searchLower) ||
          hub.address.toLowerCase().includes(searchLower) ||
          hub.description?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(hub => {
      // Category filter
      switch (filterBy) {
        case 'with_events':
          return hub.events_count > 0;
        case 'high_rated':
          return (hub.average_rating || 0) >= 4.0;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      // Sort by selected criteria
      switch (sortBy) {
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'events':
          return b.events_count - a.events_count;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('favorites.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-2">{t('favorites.error')}</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchFavorites}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {t('favorites.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Heart className="h-10 w-10 text-pink-400" />
            {t('favorites.title')}
          </h1>
          <p className="text-gray-300 text-lg">
            {t('favorites.subtitle', { count: favorites.length })}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t('favorites.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'events')}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="name">{t('favorites.sortByName')}</option>
              <option value="rating">{t('favorites.sortByRating')}</option>
              <option value="events">{t('favorites.sortByEvents')}</option>
            </select>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'with_events' | 'high_rated')}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="all">{t('favorites.filterAll')}</option>
              <option value="with_events">{t('favorites.filterWithEvents')}</option>
              <option value="high_rated">{t('favorites.filterHighRated')}</option>
            </select>
          </div>

          {/* Clear All Button */}
          {favorites.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearAllFavorites}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {t('favorites.clearAll')}
              </button>
            </div>
          )}
        </div>

        {/* Favorites List */}
        {filteredAndSortedFavorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              {searchTerm || filterBy !== 'all' ? t('favorites.noResults') : t('favorites.empty')}
            </h3>
            <p className="text-gray-300 mb-6">
              {searchTerm || filterBy !== 'all' 
                ? t('favorites.noResultsDescription')
                : t('favorites.emptyDescription')
              }
            </p>
            {searchTerm || filterBy !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('all');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {t('favorites.clearFilters')}
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/venues'}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {t('favorites.exploreVenues')}
              </button>
            )}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedFavorites.map((hub) => (
              <div
                key={hub.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative mb-4">
                  {hub.image_url ? (
                    <img
                      src={hub.image_url}
                      alt={hub.name}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-pink-400 to-purple-600 rounded-xl flex items-center justify-center">
                      <MapPin className="h-16 w-16 text-white" />
                    </div>
                  )}
                  
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(hub.id)}
                    className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Heart className="h-5 w-5 text-pink-400 fill-current" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors">
                    {hub.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{hub.address}</span>
                  </div>

                  {hub.description && (
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {hub.description}
                    </p>
                  )}

                  {/* Rating and Events */}
                  <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-white font-semibold">
                        {hub.average_rating?.toFixed(1) || 'N/A'}
                      </span>
                        </div>
                    
                        <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="text-white font-semibold">
                        {hub.events_count} {t('favorites.events')}
                      </span>
                        </div>
                      </div>

                  {/* Amenities */}
                  {hub.amenities && hub.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {hub.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                      {hub.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">
                          +{hub.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3">
                    <button
                      onClick={() => window.location.href = `/venues/${hub.id}`}
                      className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors text-center"
                    >
                      {t('favorites.viewDetails')}
                    </button>
                    
                    <button
                      onClick={() => removeFromFavorites(hub.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      title={t('favorites.remove')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Results Summary */}
        {filteredAndSortedFavorites.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              {t('favorites.showingResults', { 
                count: filteredAndSortedFavorites.length,
                total: favorites.length 
              })}
            </p>
          </div>
        )}
        </div>
    </div>
  );
};

export default FavoritesPage;
    .filter(hub => {
      // Category filter
      switch (filterBy) {
        case 'with_events':
          return hub.events_count > 0;
        case 'high_rated':
          return (hub.average_rating || 0) >= 4.0;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      // Sort by selected criteria
      switch (sortBy) {
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'events':
          return b.events_count - a.events_count;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('favorites.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-2">{t('favorites.error')}</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchFavorites}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {t('favorites.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Heart className="h-10 w-10 text-pink-400" />
            {t('favorites.title')}
          </h1>
          <p className="text-gray-300 text-lg">
            {t('favorites.subtitle', { count: favorites.length })}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t('favorites.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'events')}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="name">{t('favorites.sortByName')}</option>
              <option value="rating">{t('favorites.sortByRating')}</option>
              <option value="events">{t('favorites.sortByEvents')}</option>
            </select>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'with_events' | 'high_rated')}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="all">{t('favorites.filterAll')}</option>
              <option value="with_events">{t('favorites.filterWithEvents')}</option>
              <option value="high_rated">{t('favorites.filterHighRated')}</option>
            </select>
          </div>

          {/* Clear All Button */}
          {favorites.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearAllFavorites}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {t('favorites.clearAll')}
              </button>
            </div>
          )}
        </div>

        {/* Favorites List */}
        {filteredAndSortedFavorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              {searchTerm || filterBy !== 'all' ? t('favorites.noResults') : t('favorites.empty')}
            </h3>
            <p className="text-gray-300 mb-6">
              {searchTerm || filterBy !== 'all' 
                ? t('favorites.noResultsDescription')
                : t('favorites.emptyDescription')
              }
            </p>
            {searchTerm || filterBy !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('all');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {t('favorites.clearFilters')}
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/venues'}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {t('favorites.exploreVenues')}
              </button>
            )}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedFavorites.map((hub) => (
              <div
                key={hub.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative mb-4">
                  {hub.image_url ? (
                    <img
                      src={hub.image_url}
                      alt={hub.name}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-pink-400 to-purple-600 rounded-xl flex items-center justify-center">
                      <MapPin className="h-16 w-16 text-white" />
                    </div>
                  )}
                  
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(hub.id)}
                    className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Heart className="h-5 w-5 text-pink-400 fill-current" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors">
                    {hub.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{hub.address}</span>
                  </div>

                  {hub.description && (
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {hub.description}
                    </p>
                  )}

                  {/* Rating and Events */}
                  <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-white font-semibold">
                        {hub.average_rating?.toFixed(1) || 'N/A'}
                      </span>
                        </div>
                    
                        <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="text-white font-semibold">
                        {hub.events_count} {t('favorites.events')}
                      </span>
                        </div>
                      </div>

                  {/* Amenities */}
                  {hub.amenities && hub.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {hub.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                      {hub.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">
                          +{hub.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3">
                    <button
                      onClick={() => window.location.href = `/venues/${hub.id}`}
                      className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors text-center"
                    >
                      {t('favorites.viewDetails')}
                    </button>
                    
                    <button
                      onClick={() => removeFromFavorites(hub.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      title={t('favorites.remove')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Results Summary */}
        {filteredAndSortedFavorites.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              {t('favorites.showingResults', { 
                count: filteredAndSortedFavorites.length,
                total: favorites.length 
              })}
            </p>
          </div>
        )}
        </div>
    </div>
  );
};

export default FavoritesPage;
    .filter(hub => {
      // Category filter
      switch (filterBy) {
        case 'with_events':
          return hub.events_count > 0;
        case 'high_rated':
          return (hub.average_rating || 0) >= 4.0;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      // Sort by selected criteria
      switch (sortBy) {
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'events':
          return b.events_count - a.events_count;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('favorites.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-2">{t('favorites.error')}</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchFavorites}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {t('favorites.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Heart className="h-10 w-10 text-pink-400" />
            {t('favorites.title')}
          </h1>
          <p className="text-gray-300 text-lg">
            {t('favorites.subtitle', { count: favorites.length })}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t('favorites.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'events')}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="name">{t('favorites.sortByName')}</option>
              <option value="rating">{t('favorites.sortByRating')}</option>
              <option value="events">{t('favorites.sortByEvents')}</option>
            </select>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'with_events' | 'high_rated')}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="all">{t('favorites.filterAll')}</option>
              <option value="with_events">{t('favorites.filterWithEvents')}</option>
              <option value="high_rated">{t('favorites.filterHighRated')}</option>
            </select>
          </div>

          {/* Clear All Button */}
          {favorites.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearAllFavorites}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {t('favorites.clearAll')}
              </button>
            </div>
          )}
        </div>

        {/* Favorites List */}
        {filteredAndSortedFavorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              {searchTerm || filterBy !== 'all' ? t('favorites.noResults') : t('favorites.empty')}
            </h3>
            <p className="text-gray-300 mb-6">
              {searchTerm || filterBy !== 'all' 
                ? t('favorites.noResultsDescription')
                : t('favorites.emptyDescription')
              }
            </p>
            {searchTerm || filterBy !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('all');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {t('favorites.clearFilters')}
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/venues'}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {t('favorites.exploreVenues')}
              </button>
            )}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedFavorites.map((hub) => (
              <div
                key={hub.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative mb-4">
                  {hub.image_url ? (
                    <img
                      src={hub.image_url}
                      alt={hub.name}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-pink-400 to-purple-600 rounded-xl flex items-center justify-center">
                      <MapPin className="h-16 w-16 text-white" />
                    </div>
                  )}
                  
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(hub.id)}
                    className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Heart className="h-5 w-5 text-pink-400 fill-current" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors">
                    {hub.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{hub.address}</span>
                  </div>

                  {hub.description && (
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {hub.description}
                    </p>
                  )}

                  {/* Rating and Events */}
                  <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-white font-semibold">
                        {hub.average_rating?.toFixed(1) || 'N/A'}
                      </span>
                        </div>
                    
                        <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="text-white font-semibold">
                        {hub.events_count} {t('favorites.events')}
                      </span>
                        </div>
                      </div>

                  {/* Amenities */}
                  {hub.amenities && hub.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {hub.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                      {hub.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">
                          +{hub.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3">
                    <button
                      onClick={() => window.location.href = `/venues/${hub.id}`}
                      className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors text-center"
                    >
                      {t('favorites.viewDetails')}
                    </button>
                    
                    <button
                      onClick={() => removeFromFavorites(hub.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      title={t('favorites.remove')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Results Summary */}
        {filteredAndSortedFavorites.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              {t('favorites.showingResults', { 
                count: filteredAndSortedFavorites.length,
                total: favorites.length 
              })}
            </p>
          </div>
        )}
        </div>
    </div>
  );
};

export default FavoritesPage;
    .filter(hub => {
      // Category filter
      switch (filterBy) {
        case 'with_events':
          return hub.events_count > 0;
        case 'high_rated':
          return (hub.average_rating || 0) >= 4.0;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      // Sort by selected criteria
      switch (sortBy) {
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'events':
          return b.events_count - a.events_count;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('favorites.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-2">{t('favorites.error')}</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchFavorites}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {t('favorites.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Heart className="h-10 w-10 text-pink-400" />
            {t('favorites.title')}
          </h1>
          <p className="text-gray-300 text-lg">
            {t('favorites.subtitle', { count: favorites.length })}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t('favorites.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'events')}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="name">{t('favorites.sortByName')}</option>
              <option value="rating">{t('favorites.sortByRating')}</option>
              <option value="events">{t('favorites.sortByEvents')}</option>
            </select>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'with_events' | 'high_rated')}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="all">{t('favorites.filterAll')}</option>
              <option value="with_events">{t('favorites.filterWithEvents')}</option>
              <option value="high_rated">{t('favorites.filterHighRated')}</option>
            </select>
          </div>

          {/* Clear All Button */}
          {favorites.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearAllFavorites}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {t('favorites.clearAll')}
              </button>
            </div>
          )}
        </div>

        {/* Favorites List */}
        {filteredAndSortedFavorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              {searchTerm || filterBy !== 'all' ? t('favorites.noResults') : t('favorites.empty')}
            </h3>
            <p className="text-gray-300 mb-6">
              {searchTerm || filterBy !== 'all' 
                ? t('favorites.noResultsDescription')
                : t('favorites.emptyDescription')
              }
            </p>
            {searchTerm || filterBy !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('all');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {t('favorites.clearFilters')}
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/venues'}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {t('favorites.exploreVenues')}
              </button>
            )}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedFavorites.map((hub) => (
              <div
                key={hub.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative mb-4">
                  {hub.image_url ? (
                    <img
                      src={hub.image_url}
                      alt={hub.name}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-pink-400 to-purple-600 rounded-xl flex items-center justify-center">
                      <MapPin className="h-16 w-16 text-white" />
                    </div>
                  )}
                  
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(hub.id)}
                    className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Heart className="h-5 w-5 text-pink-400 fill-current" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors">
                    {hub.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{hub.address}</span>
                  </div>

                  {hub.description && (
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {hub.description}
                    </p>
                  )}

                  {/* Rating and Events */}
                  <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-white font-semibold">
                        {hub.average_rating?.toFixed(1) || 'N/A'}
                      </span>
                        </div>
                    
                        <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="text-white font-semibold">
                        {hub.events_count} {t('favorites.events')}
                      </span>
                        </div>
                      </div>

                  {/* Amenities */}
                  {hub.amenities && hub.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {hub.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                      {hub.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">
                          +{hub.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3">
                    <button
                      onClick={() => window.location.href = `/venues/${hub.id}`}
                      className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors text-center"
                    >
                      {t('favorites.viewDetails')}
                    </button>
                    
                    <button
                      onClick={() => removeFromFavorites(hub.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      title={t('favorites.remove')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Results Summary */}
        {filteredAndSortedFavorites.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              {t('favorites.showingResults', { 
                count: filteredAndSortedFavorites.length,
                total: favorites.length 
              })}
            </p>
          </div>
        )}
        </div>
    </div>
  );
};

export default FavoritesPage;
    .filter(hub => {
      // Category filter
      switch (filterBy) {
        case 'with_events':
          return hub.events_count > 0;
        case 'high_rated':
          return (hub.average_rating || 0) >= 4.0;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      // Sort by selected criteria
      switch (sortBy) {
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'events':
          return b.events_count - a.events_count;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('favorites.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-2">{t('favorites.error')}</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchFavorites}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {t('favorites.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Heart className="h-10 w-10 text-pink-400" />
            {t('favorites.title')}
          </h1>
          <p className="text-gray-300 text-lg">
            {t('favorites.subtitle', { count: favorites.length })}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t('favorites.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'events')}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="name">{t('favorites.sortByName')}</option>
              <option value="rating">{t('favorites.sortByRating')}</option>
              <option value="events">{t('favorites.sortByEvents')}</option>
            </select>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'with_events' | 'high_rated')}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="all">{t('favorites.filterAll')}</option>
              <option value="with_events">{t('favorites.filterWithEvents')}</option>
              <option value="high_rated">{t('favorites.filterHighRated')}</option>
            </select>
          </div>

          {/* Clear All Button */}
          {favorites.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearAllFavorites}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {t('favorites.clearAll')}
              </button>
            </div>
          )}
        </div>

        {/* Favorites List */}
        {filteredAndSortedFavorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              {searchTerm || filterBy !== 'all' ? t('favorites.noResults') : t('favorites.empty')}
            </h3>
            <p className="text-gray-300 mb-6">
              {searchTerm || filterBy !== 'all' 
                ? t('favorites.noResultsDescription')
                : t('favorites.emptyDescription')
              }
            </p>
            {searchTerm || filterBy !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('all');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {t('favorites.clearFilters')}
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/venues'}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {t('favorites.exploreVenues')}
              </button>
            )}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedFavorites.map((hub) => (
              <div
                key={hub.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative mb-4">
                  {hub.image_url ? (
                    <img
                      src={hub.image_url}
                      alt={hub.name}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-pink-400 to-purple-600 rounded-xl flex items-center justify-center">
                      <MapPin className="h-16 w-16 text-white" />
                    </div>
                  )}
                  
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(hub.id)}
                    className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Heart className="h-5 w-5 text-pink-400 fill-current" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors">
                    {hub.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{hub.address}</span>
                  </div>

                  {hub.description && (
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {hub.description}
                    </p>
                  )}

                  {/* Rating and Events */}
                  <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-white font-semibold">
                        {hub.average_rating?.toFixed(1) || 'N/A'}
                      </span>
                        </div>
                    
                        <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="text-white font-semibold">
                        {hub.events_count} {t('favorites.events')}
                      </span>
                        </div>
                      </div>

                  {/* Amenities */}
                  {hub.amenities && hub.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {hub.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                      {hub.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">
                          +{hub.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3">
                    <button
                      onClick={() => window.location.href = `/venues/${hub.id}`}
                      className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors text-center"
                    >
                      {t('favorites.viewDetails')}
                    </button>
                    
                    <button
                      onClick={() => removeFromFavorites(hub.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      title={t('favorites.remove')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Results Summary */}
        {filteredAndSortedFavorites.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              {t('favorites.showingResults', { 
                count: filteredAndSortedFavorites.length,
                total: favorites.length 
              })}
            </p>
          </div>
        )}
        </div>
    </div>
  );
};

export default FavoritesPage;
    .filter(hub => {
      // Category filter
      switch (filterBy) {
        case 'with_events':
          return hub.events_count > 0;
        case 'high_rated':
          return (hub.average_rating || 0) >= 4.0;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      // Sort by selected criteria
      switch (sortBy) {
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'events':
          return b.events_count - a.events_count;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('favorites.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-2">{t('favorites.error')}</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchFavorites}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {t('favorites.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Heart className="h-10 w-10 text-pink-400" />
            {t('favorites.title')}
          </h1>
          <p className="text-gray-300 text-lg">
            {t('favorites.subtitle', { count: favorites.length })}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t('favorites.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'events')}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="name">{t('favorites.sortByName')}</option>
              <option value="rating">{t('favorites.sortByRating')}</option>
              <option value="events">{t('favorites.sortByEvents')}</option>
            </select>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'with_events' | 'high_rated')}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="all">{t('favorites.filterAll')}</option>
              <option value="with_events">{t('favorites.filterWithEvents')}</option>
              <option value="high_rated">{t('favorites.filterHighRated')}</option>
            </select>
          </div>

          {/* Clear All Button */}
          {favorites.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearAllFavorites}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {t('favorites.clearAll')}
              </button>
            </div>
          )}
        </div>

        {/* Favorites List */}
        {filteredAndSortedFavorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              {searchTerm || filterBy !== 'all' ? t('favorites.noResults') : t('favorites.empty')}
            </h3>
            <p className="text-gray-300 mb-6">
              {searchTerm || filterBy !== 'all' 
                ? t('favorites.noResultsDescription')
                : t('favorites.emptyDescription')
              }
            </p>
            {searchTerm || filterBy !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('all');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {t('favorites.clearFilters')}
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/venues'}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {t('favorites.exploreVenues')}
              </button>
            )}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedFavorites.map((hub) => (
              <div
                key={hub.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative mb-4">
                  {hub.image_url ? (
                    <img
                      src={hub.image_url}
                      alt={hub.name}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-pink-400 to-purple-600 rounded-xl flex items-center justify-center">
                      <MapPin className="h-16 w-16 text-white" />
                    </div>
                  )}
                  
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(hub.id)}
                    className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Heart className="h-5 w-5 text-pink-400 fill-current" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors">
                    {hub.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{hub.address}</span>
                  </div>

                  {hub.description && (
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {hub.description}
                    </p>
                  )}

                  {/* Rating and Events */}
                  <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-white font-semibold">
                        {hub.average_rating?.toFixed(1) || 'N/A'}
                      </span>
                        </div>
                    
                        <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="text-white font-semibold">
                        {hub.events_count} {t('favorites.events')}
                      </span>
                        </div>
                      </div>

                  {/* Amenities */}
                  {hub.amenities && hub.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {hub.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                      {hub.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">
                          +{hub.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3">
                    <button
                      onClick={() => window.location.href = `/venues/${hub.id}`}
                      className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors text-center"
                    >
                      {t('favorites.viewDetails')}
                    </button>
                    
                    <button
                      onClick={() => removeFromFavorites(hub.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      title={t('favorites.remove')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Results Summary */}
        {filteredAndSortedFavorites.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              {t('favorites.showingResults', { 
                count: filteredAndSortedFavorites.length,
                total: favorites.length 
              })}
            </p>
          </div>
        )}
        </div>
    </div>
  );
};

export default FavoritesPage;
    .filter(hub => {
      // Category filter
      switch (filterBy) {
        case 'with_events':
          return hub.events_count > 0;
        case 'high_rated':
          return (hub.average_rating || 0) >= 4.0;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      // Sort by selected criteria
      switch (sortBy) {
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'events':
          return b.events_count - a.events_count;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('favorites.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-2">{t('favorites.error')}</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchFavorites}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {t('favorites.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Heart className="h-10 w-10 text-pink-400" />
            {t('favorites.title')}
          </h1>
          <p className="text-gray-300 text-lg">
            {t('favorites.subtitle', { count: favorites.length })}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t('favorites.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'events')}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="name">{t('favorites.sortByName')}</option>
              <option value="rating">{t('favorites.sortByRating')}</option>
              <option value="events">{t('favorites.sortByEvents')}</option>
            </select>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'with_events' | 'high_rated')}
              className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="all">{t('favorites.filterAll')}</option>
              <option value="with_events">{t('favorites.filterWithEvents')}</option>
              <option value="high_rated">{t('favorites.filterHighRated')}</option>
            </select>
          </div>

          {/* Clear All Button */}
          {favorites.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearAllFavorites}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                {t('favorites.clearAll')}
              </button>
            </div>
          )}
        </div>

        {/* Favorites List */}
        {filteredAndSortedFavorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              {searchTerm || filterBy !== 'all' ? t('favorites.noResults') : t('favorites.empty')}
            </h3>
            <p className="text-gray-300 mb-6">
              {searchTerm || filterBy !== 'all' 
                ? t('favorites.noResultsDescription')
                : t('favorites.emptyDescription')
              }
            </p>
            {searchTerm || filterBy !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('all');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {t('favorites.clearFilters')}
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/venues'}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {t('favorites.exploreVenues')}
              </button>
            )}
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedFavorites.map((hub) => (
              <div
                key={hub.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative mb-4">
                  {hub.image_url ? (
                    <img
                      src={hub.image_url}
                      alt={hub.name}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-pink-400 to-purple-600 rounded-xl flex items-center justify-center">
                      <MapPin className="h-16 w-16 text-white" />
                    </div>
                  )}
                  
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(hub.id)}
                    className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Heart className="h-5 w-5 text-pink-400 fill-current" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors">
                    {hub.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{hub.address}</span>
                  </div>

                  {hub.description && (
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {hub.description}
                    </p>
                  )}

                  {/* Rating and Events */}
                  <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-white font-semibold">
                        {hub.average_rating?.toFixed(1) || 'N/A'}
                      </span>
                        </div>
                    
                        <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="text-white font-semibold">
                        {hub.events_count} {t('favorites.events')}
                      </span>
                        </div>
                      </div>

                  {/* Amenities */}
                  {hub.amenities && hub.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {hub.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                      {hub.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">
                          +{hub.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3">
                    <button
                      onClick={() => window.location.href = `/venues/${hub.id}`}
                      className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition-colors text-center"
                    >
                      {t('favorites.viewDetails')}
                    </button>
                    
                    <button
                      onClick={() => removeFromFavorites(hub.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      title={t('favorites.remove')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Results Summary */}
        {filteredAndSortedFavorites.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              {t('favorites.showingResults', { 
                count: filteredAndSortedFavorites.length,
                total: favorites.length 
              })}
            </p>
          </div>
        )}
        </div>
    </div>
  );
};

export default FavoritesPage;