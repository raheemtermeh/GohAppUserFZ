import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { useStore } from '../state/apiStore';
import SignInPopup from './SignInPopup';

interface FavoriteButtonProps {
  customerId: string;
  accessToken: string;
  socialHubId: string;
  socialHubName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showText?: boolean;
  onToggle?: (isFavorite: boolean) => void;
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  customerId,
  accessToken,
  socialHubId,
  socialHubName,
  size = 'md',
  variant = 'default',
  showText = false,
  onToggle,
  className = '',
}) => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, loading } = useFavorites({ customerId, accessToken });
  const [isToggling, setIsToggling] = useState(false);
  const [showSignInPopup, setShowSignInPopup] = useState(false);

  const handleToggle = async () => {
    if (isToggling) return;

    // Check if user is authenticated
    if (!state.auth.user || !state.auth.isLoggedIn) {
      // Show sign-in popup instead of redirecting
      setShowSignInPopup(true);
      return;
    }

    try {
      setIsToggling(true);
      const success = await toggleFavorite(socialHubId);
      
      if (success && onToggle) {
        onToggle(isFavorite(socialHubId));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const isCurrentlyFavorite = isFavorite(socialHubId);
  const isLoading = loading || isToggling;

  // Size classes
  const sizeClasses = {
    sm: 'p-1.5 text-sm',
    md: 'p-2 text-base',
    lg: 'p-3 text-lg',
  };

  // Variant classes
  const variantClasses = {
    default: isCurrentlyFavorite
      ? 'bg-pink-600 hover:bg-pink-700 text-white'
      : 'bg-white/20 hover:bg-white/30 text-pink-400',
    outline: isCurrentlyFavorite
      ? 'border-2 border-pink-600 bg-pink-600 text-white hover:bg-pink-700'
      : 'border-2 border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-white',
    ghost: isCurrentlyFavorite
      ? 'text-pink-600 hover:text-pink-700'
      : 'text-gray-400 hover:text-pink-400',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-2 rounded-lg transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        title={
          isLoading
            ? 'Loading...'
            : isCurrentlyFavorite
            ? `Remove ${socialHubName || 'this venue'} from favorites`
            : `Add ${socialHubName || 'this venue'} to favorites`
        }
      >
        <Heart
          className={`
            ${iconSizes[size]}
            ${isCurrentlyFavorite ? 'fill-current' : ''}
            ${isLoading ? 'animate-pulse' : ''}
          `}
        />
        {showText && (
          <span className="font-medium">
            {isLoading
              ? 'Loading...'
              : isCurrentlyFavorite
              ? 'Remove from Favorites'
              : 'Add to Favorites'}
          </span>
        )}
      </button>
      
      <SignInPopup
        isOpen={showSignInPopup}
        onClose={() => setShowSignInPopup(false)}
        redirectUrl={window.location.pathname + window.location.search}
      />
    </>
  );
};

export default FavoriteButton;
