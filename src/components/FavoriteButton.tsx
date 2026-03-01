import { Star } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useState, useCallback, memo } from 'react'

interface FavoriteButtonProps {
  recipeId: string
  recipeName: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export const FavoriteButton = memo<FavoriteButtonProps>(
  ({ recipeId, recipeName, size = 'md', showLabel = false }) => {
    const [isAnimating, setIsAnimating] = useState(false)
    const favorites = useAppStore((state) => state.favorites)
    const toggleFavorite = useAppStore((state) => state.actions.toggleFavorite)

    const isFavorite = favorites.includes(recipeId)

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsAnimating(true)
        toggleFavorite(recipeId)
        setTimeout(() => setIsAnimating(false), 200)
      },
      [recipeId, toggleFavorite],
    )

    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    }

    const buttonPadding = {
      sm: 'p-1',
      md: 'p-1.5',
      lg: 'p-2',
    }

    return (
      <button
        onClick={handleClick}
        className={`group inline-flex items-center gap-1.5 rounded-full transition-all duration-200 hover:bg-rose-50 ${buttonPadding[size]}`}
        title={
          isFavorite ? `Remove "${recipeName}" from favorites` : `Add "${recipeName}" to favorites`
        }
        aria-label={isFavorite ? `Remove from favorites` : `Add to favorites`}
      >
        <Star
          className={`${sizeClasses[size]} transition-all duration-200 ${
            isFavorite
              ? 'fill-rose-600 text-rose-600'
              : 'fill-transparent text-slate-300 group-hover:text-rose-400'
          } ${isAnimating ? 'scale-125' : 'scale-100'}`}
        />
        {showLabel && (
          <span
            className={`text-sm font-medium ${isFavorite ? 'text-rose-600' : 'text-slate-400 group-hover:text-rose-500'}`}
          >
            {isFavorite ? 'Favorite' : 'Add to favorites'}
          </span>
        )}
      </button>
    )
  },
)

FavoriteButton.displayName = 'FavoriteButton'
