import { Star, Clock, Users } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { SectionHeader } from '../components/SectionHeader'
import { Card } from '../components/ui/Card'
import { FavoriteButton } from '../components/FavoriteButton'
import type { Recipe } from '../types/app'

export const FavoritesPage = () => {
  const favorites = useAppStore((state) => state.favorites)
  const recipes = useAppStore((state) => state.recipes)

  const favoriteRecipes: Recipe[] = favorites
    .map((id) => recipes[id])
    .filter((r): r is Recipe => r !== undefined)

  const hasFavorites = favoriteRecipes.length > 0

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Favorite Recipes"
        description="Your personal collection of go-to meals. Generate a meal plan to discover new favorites."
      />

      {!hasFavorites ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-rose-50 p-4">
            <Star className="h-8 w-8 text-rose-300" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-900">No favorites yet</h3>
          <p className="max-w-sm text-sm text-slate-500">
            Click the star icon on any recipe in your meal plan to add it here for quick access.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="group relative flex flex-col transition-shadow hover:shadow-lg"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="line-clamp-1 pr-8 text-lg font-semibold text-slate-900">
                  {recipe.name}
                </h3>
                <div className="absolute right-4 top-4">
                  <FavoriteButton recipeId={recipe.id} recipeName={recipe.name} size="sm" />
                </div>
              </div>

              {recipe.description && (
                <p className="mb-4 line-clamp-2 text-sm text-slate-500">{recipe.description}</p>
              )}

              <div className="mt-auto flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {recipe.prepTimeMinutes + recipe.cookingTimeMinutes} min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {recipe.servesPeople} servings
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize text-slate-600">
                  {recipe.difficulty}
                </span>
              </div>

              {recipe.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {recipe.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Ingredients
                </p>
                <ul className="space-y-1 text-xs text-slate-600">
                  {recipe.ingredients.slice(0, 5).map((ing) => (
                    <li key={ing.item}>
                      {ing.quantity} {ing.unit} {ing.item}
                    </li>
                  ))}
                  {recipe.ingredients.length > 5 && (
                    <li className="text-slate-400">+{recipe.ingredients.length - 5} more</li>
                  )}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      )}

      {hasFavorites && (
        <p className="text-center text-sm text-slate-400">
          {favoriteRecipes.length} favorite{favoriteRecipes.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
