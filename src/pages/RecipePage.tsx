import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Users, RefreshCw, CheckCircle } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { SectionHeader } from '../components/SectionHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FavoriteButton } from '../components/FavoriteButton'
import { regenerateMeal } from '../services/mealAI'
import { useToast } from '../components/ui/Toast'

export const RecipePage = () => {
  const { recipeId } = useParams<{ recipeId: string }>()
  const navigate = useNavigate()
  const { recipes, dailyMenus, actions, isGenerating, family, schedule, settings } = useAppStore()
  const { showToast } = useToast()

  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([])
  const [isRegenerating, setIsRegenerating] = useState(false)

  const recipe = recipeId ? recipes[recipeId] : undefined

  const mealSlot = useMemo(() => {
    if (!recipe || !recipeId) return null
    for (const menu of dailyMenus) {
      for (const mealType of [
        'breakfast',
        'morningSnack',
        'lunch',
        'afternoonSnack',
        'dinner',
      ] as const) {
        const slot = menu[mealType]
        if (slot?.recipeId === recipeId) {
          return { date: menu.date, mealType }
        }
      }
    }
    return null
  }, [dailyMenus, recipeId, recipe])

  useEffect(() => {
    if (!recipeId || !recipe) {
      navigate('/meal-plan', { replace: true })
    }
    setExcludedIngredients([])
  }, [recipeId, recipe, navigate])

  if (!recipe) {
    return null
  }

  const totalTime = recipe.prepTimeMinutes + recipe.cookingTimeMinutes

  const handleIngredientToggle = (ingredientName: string) => {
    setExcludedIngredients((prev) =>
      prev.includes(ingredientName)
        ? prev.filter((i) => i !== ingredientName)
        : [...prev, ingredientName],
    )
  }

  const handleRegenerate = async () => {
    if (excludedIngredients.length === 0) {
      showToast('Select at least one ingredient to exclude', 'warning')
      return
    }

    if (!mealSlot) {
      showToast('This recipe is not part of any meal plan. Generate a meal plan first.', 'error')
      return
    }

    if (!window.confirm(`Regenerate this recipe without: ${excludedIngredients.join(', ')}?`)) {
      return
    }

    setIsRegenerating(true)
    try {
      const newRecipe = await regenerateMeal(
        {
          config: {
            startDate: mealSlot.date,
            members: family,
            schedule,
            settings,
          },
          meal: {
            date: mealSlot.date,
            mealType: mealSlot.mealType,
          },
          previousRecipe: recipe.name,
          excludedIngredients,
        },
        {
          apiKey: settings.apiKey ?? '',
          model: settings.aiModel,
          modelLabel: settings.aiModelMetadata?.label,
          supportsJsonResponse: settings.aiModelMetadata?.supportsJsonResponse,
        },
      )

      actions.replaceRecipe(recipe.id, newRecipe)
      setExcludedIngredients([])
      showToast('Recipe regenerated successfully!', 'success')
    } catch (error) {
      console.error(error)
      showToast('Failed to regenerate recipe. Please try again.', 'error')
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in space-y-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <SectionHeader
        title={recipe.name}
        description={recipe.description}
        actions={
          <div className="flex items-center gap-3">
            <FavoriteButton recipeId={recipe.id} recipeName={recipe.name} size="lg" />
            <Button
              onClick={handleRegenerate}
              disabled={isGenerating || isRegenerating || excludedIngredients.length === 0}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate without selected'}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="transition-all duration-300 hover:shadow-surface-800/50">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-surface-100">Ingredients</h3>
              {excludedIngredients.length > 0 && (
                <span className="text-xs font-medium text-rose-400">
                  {excludedIngredients.length} excluded
                </span>
              )}
            </div>
            {isRegenerating ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-start gap-3 rounded-lg bg-surface-800/50 p-3"
                  >
                    <div className="mt-1 h-5 w-5 rounded border border-surface-600" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-surface-700/50" />
                      <div className="h-3 w-1/2 rounded bg-surface-700/30" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {recipe.ingredients.map((ing, index) => {
                  const ingredientKey = `${ing.item}-${index}`
                  const isExcluded = excludedIngredients.includes(ing.item)
                  return (
                    <li
                      key={ingredientKey}
                      className={`group flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-all duration-200 ${
                        isExcluded
                          ? 'border-2 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20'
                          : 'border border-transparent bg-surface-800/50 hover:border-surface-600/50 hover:bg-surface-700/50'
                      }`}
                      onClick={() => handleIngredientToggle(ing.item)}
                      role="checkbox"
                      aria-checked={isExcluded}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleIngredientToggle(ing.item)
                        }
                      }}
                    >
                      <div
                        className={`mt-1 flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200 ${
                          isExcluded
                            ? 'border-rose-500 bg-rose-500 text-white'
                            : 'border-surface-600 bg-surface-800 group-hover:border-surface-500'
                        }`}
                      >
                        {isExcluded && <CheckCircle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <span
                          className={`text-sm transition-all duration-200 ${
                            isExcluded
                              ? 'text-surface-500 line-through decoration-surface-600'
                              : 'text-surface-300'
                          }`}
                        >
                          {ing.quantity} {ing.unit} {ing.item}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {excludedIngredients.length > 0 && !isRegenerating && (
              <div className="mt-4 border-t border-surface-700/50 pt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setExcludedIngredients([])}
                  className="w-full"
                >
                  Clear all selections
                </Button>
              </div>
            )}
          </Card>

          <Card className="transition-all duration-300 hover:shadow-surface-800/50">
            <h3 className="mb-4 text-lg font-semibold text-surface-100">Instructions</h3>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-surface-300">
              {recipe.instructions}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="transition-all duration-300 hover:shadow-surface-800/50">
            <h3 className="mb-4 text-lg font-semibold text-surface-100">Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-surface-800/50 p-3">
                <Clock className="h-5 w-5 text-ember-400" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-surface-500">Total time</p>
                  <p className="font-semibold text-surface-100">{totalTime} min</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-surface-800/50 p-3">
                <Users className="h-5 w-5 text-brand-400" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-surface-500">Servings</p>
                  <p className="font-semibold text-surface-100">{recipe.servesPeople} people</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-surface-500">Difficulty</p>
                <span className="inline-flex rounded-full border border-ember-500/20 bg-ember-500/10 px-3 py-1.5 text-sm font-medium capitalize text-ember-300">
                  {recipe.difficulty}
                </span>
              </div>
            </div>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-surface-800/50">
            <h3 className="mb-4 text-lg font-semibold text-surface-100">Nutritional Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-surface-700/30 bg-surface-800/50 p-3">
                <p className="text-xs uppercase tracking-wider text-surface-500">Calories</p>
                <p className="text-xl font-bold text-ember-300">
                  {recipe.nutritionalInfo.calories}
                </p>
                <p className="text-xs text-surface-600">kcal</p>
              </div>
              <div className="rounded-lg border border-surface-700/30 bg-surface-800/50 p-3">
                <p className="text-xs uppercase tracking-wider text-surface-500">Protein</p>
                <p className="text-xl font-bold text-brand-400">
                  {recipe.nutritionalInfo.protein}g
                </p>
              </div>
              <div className="rounded-lg border border-surface-700/30 bg-surface-800/50 p-3">
                <p className="text-xs uppercase tracking-wider text-surface-500">Carbs</p>
                <p className="text-xl font-bold text-sky-400">{recipe.nutritionalInfo.carbs}g</p>
              </div>
              <div className="rounded-lg border border-surface-700/30 bg-surface-800/50 p-3">
                <p className="text-xs uppercase tracking-wider text-surface-500">Fat</p>
                <p className="text-xl font-bold text-amber-400">{recipe.nutritionalInfo.fat}g</p>
              </div>
            </div>
          </Card>

          {recipe.tags.length > 0 && (
            <Card className="transition-all duration-300 hover:shadow-surface-800/50">
              <h3 className="mb-4 text-lg font-semibold text-surface-100">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
