import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Sparkles } from 'lucide-react'
import { useAppStore, defaultAppPreferences } from '../store/appStore'
import { SectionHeader } from '../components/SectionHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ModelSummary } from '../components/ModelSummary'
import { generateMealPlan, regenerateMeal, generateShoppingList } from '../services/mealAI'
import type { BaseAIOptions } from '../services/mealAI'
import type { DailyMenu, MealPlanResponse, MealType, Recipe, ShoppingList } from '../types/app'

const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  morningSnack: 'Morning snack',
  lunch: 'Lunch',
  afternoonSnack: 'Afternoon snack',
  dinner: 'Dinner',
}
const supportedMealTypes = Object.keys(mealLabels) as MealType[]

export const MealPlanPage = () => {
  const { family, schedule, dailyMenus, recipes, settings, guestApiKey, actions, isGenerating, shoppingList, lastGeneratedAt } = useAppStore()
  const [weekStart, setWeekStart] = useState(schedule[0]?.date ?? new Date().toISOString().split('T')[0])
  const canGenerate = family.length > 0 && !!(settings.apiKey ?? guestApiKey ?? import.meta.env.VITE_OPENROUTER_API_KEY)
  const appPreferences = settings.appPreferences ?? defaultAppPreferences
  const modelMetadata = settings.aiModelMetadata
  const aiOptions: BaseAIOptions = {
    apiKey: settings.apiKey ?? guestApiKey,
    model: settings.aiModel,
    modelLabel: modelMetadata?.label,
  }

  const orderedMenus = useMemo(() =>
    [...dailyMenus].sort((a, b) => a.date.localeCompare(b.date)), [dailyMenus])

  const handleGenerate = async () => {
    if (!canGenerate) return alert('Add family profiles and an AI key first.')
    try {
      actions.setGenerating(true)
      const config = {
        startDate: weekStart,
        members: family,
        schedule,
        settings,
      }
      const plan = await generateMealPlan(config, aiOptions)
      actions.setMealPlan(plan)
      if (appPreferences.autoBuildShoppingList) {
        await buildShoppingListFromPlan(plan, weekStart, aiOptions, actions.setShoppingList)
      }
    } catch (error) {
      console.error(error)
      alert('AI generation failed. Check your API key and try again.')
    } finally {
      actions.setGenerating(false)
    }
  }

  const handleRegenerate = async (date: string, mealType: MealType, previousRecipeId?: string) => {
    const previousRecipe = previousRecipeId ? recipes[previousRecipeId]?.name : undefined
    try {
      actions.setGenerating(true)
      const recipe = await regenerateMeal({ config: { startDate: weekStart, members: family, schedule, settings }, meal: { date, mealType }, previousRecipe }, aiOptions)
      const updatedPlan = {
        dailyMenus: orderedMenus.map((menu) => {
          if (menu.date !== date) return menu
          const slot = { ...menu[mealType], recipeId: recipe.id, name: recipe.name }
          return { ...menu, [mealType]: slot }
        }),
        recipes: [
          ...Object.values(recipes).filter((existing) => existing.id !== recipe.id),
          recipe,
        ],
      }
      actions.setMealPlan(updatedPlan)
    } catch (error) {
      console.error(error)
      alert('Unable to regenerate this meal. Please try again later.')
    } finally {
      actions.setGenerating(false)
    }
  }

  const handleShoppingList = async () => {
    const recipeList = collectRecipesFromMenus(orderedMenus, recipes)
    if (recipeList.length === 0) {
      alert('Generate a meal plan first.')
      return
    }
    try {
      const list = await generateShoppingList(
        { recipes: recipeList, weekStartDate: weekStart },
        aiOptions,
      )
      actions.setShoppingList(list)
    } catch (error) {
      console.error(error)
      alert('Shopping list generation failed.')
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Weekly AI meal plan"
        description="Generate a plan tailored to allergies, preferences, and your actual availability."
        actions={
          <div className="flex flex-col items-end gap-2">
            <ModelSummary modelId={settings.aiModel} metadata={modelMetadata} size="sm" />
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
              <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating}>
                <Sparkles className="h-4 w-4" /> {isGenerating ? 'Thinking…' : 'Generate meal plan'}
              </Button>
            </div>
          </div>
        }
      />
      {lastGeneratedAt && (
        <p className="text-sm text-slate-500">Last generated {format(new Date(lastGeneratedAt), 'PPpp')}</p>
      )}
      {orderedMenus.length === 0 && (
        <Card>
          <p className="text-sm text-slate-500">
            Add family members and press “Generate meal plan” to see personalized suggestions.
          </p>
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {orderedMenus.map((menu) => (
          <Card key={menu.date} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{format(new Date(menu.date), 'eeee')}</p>
                <p className="text-lg font-semibold text-slate-900">{format(new Date(menu.date), 'MMM d')}</p>
              </div>
            </div>
            <div className="space-y-3">
              {(settings.mealTypes as MealType[]).map((mealType) => {
                const slot = menu[mealType]
                const recipe = slot?.recipeId ? recipes[slot.recipeId] : undefined
                return (
                  <div key={`${menu.date}-${mealType}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">{mealLabels[mealType]}</p>
                        <p className="text-sm font-medium text-slate-900">{slot?.name ?? 'Not generated'}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerate(menu.date, mealType, slot?.recipeId ?? undefined)}
                        disabled={isGenerating}
                      >
                        Regenerate
                      </Button>
                    </div>
                    {recipe && (
                      <>
                        <ul className="mt-3 text-xs text-slate-600">
                          {recipe.ingredients.slice(0, 3).map((ingredient) => (
                            <li key={ingredient.item}>
                              {ingredient.quantity} {ingredient.unit} {ingredient.item}
                            </li>
                          ))}
                        </ul>
                        {appPreferences.showNutritionalInfo && (
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                            <span className="rounded-full bg-white px-2 py-0.5 shadow-sm">
                              {recipe.nutritionalInfo.calories} kcal
                            </span>
                            <span className="rounded-full bg-white px-2 py-0.5 shadow-sm">
                              P {recipe.nutritionalInfo.protein} g
                            </span>
                            <span className="rounded-full bg-white px-2 py-0.5 shadow-sm">
                              C {recipe.nutritionalInfo.carbs} g
                            </span>
                            <span className="rounded-full bg-white px-2 py-0.5 shadow-sm">
                              F {recipe.nutritionalInfo.fat} g
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="secondary" onClick={handleShoppingList} disabled={orderedMenus.length === 0}>
          Build shopping list
        </Button>
        {shoppingList && (
          <p className="text-sm text-slate-500">
            Shopping list ready with {shoppingList.categories.reduce((total, cat) => total + cat.items.length, 0)} items.
          </p>
        )}
      </div>
    </div>
  )
}

const collectRecipesFromMenus = (menus: DailyMenu[], recipeMap: Record<string, Recipe>) => {
  const result: Recipe[] = []
  supportedMealTypes.forEach((mealType) => {
    menus.forEach((menu) => {
      const slot = menu[mealType]
      if (slot?.recipeId) {
        const recipe = recipeMap[slot.recipeId]
        if (recipe) result.push(recipe)
      }
    })
  })
  return result
}

const buildShoppingListFromPlan = async (
  plan: MealPlanResponse,
  weekStart: string,
  options: BaseAIOptions,
  setShoppingList: (list: ShoppingList) => void,
) => {
  const map = plan.recipes.reduce<Record<string, Recipe>>((acc, recipe) => {
    acc[recipe.id] = recipe
    return acc
  }, {})
  const recipeList = collectRecipesFromMenus(plan.dailyMenus, map)
  if (recipeList.length === 0) return
  try {
    const list = await generateShoppingList({ recipes: recipeList, weekStartDate: weekStart }, options)
    setShoppingList(list)
  } catch (error) {
    console.error('Auto shopping list failed', error)
    alert('Meal plan ready, but auto shopping list failed. Use the button to try again.')
  }
}
