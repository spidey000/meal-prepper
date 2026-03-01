import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore, defaultAppPreferences } from '../store/appStore'
import { useAuth } from '../app/auth/useAuth'
import { SectionHeader } from '../components/SectionHeader'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { ModelSummary } from '../components/ModelSummary'
import type { AppPreferences, MealType } from '../types/app'
import {
  isModelFree,
  listOpenRouterModels,
  mapModelMetadata,
  type OpenRouterModel,
} from '../services/openrouter'
import { Moon, Sun } from 'lucide-react'
import clsx from 'clsx'

const cuisineLibrary = [
  'Mediterranean',
  'Italian',
  'Mexican',
  'Japanese',
  'Middle Eastern',
  'Vegetarian',
  'Vegan',
  'Gluten-free',
]
const mealTypeOptions: MealType[] = [
  'breakfast',
  'morningSnack',
  'lunch',
  'afternoonSnack',
  'dinner',
]
const sections = [
  { id: 'openrouter', label: 'OpenRouter' },
  { id: 'meals', label: 'Meal planning' },
  { id: 'calendar', label: 'Calendar sync' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'app', label: 'App preferences' },
] as const

type SettingsSection = (typeof sections)[number]['id']

const ThemeToggle = ({
  darkMode,
  onChange,
}: {
  darkMode: boolean
  onChange: (dark: boolean) => void
}) => (
  <div className="flex items-center gap-2">
    <button
      onClick={() => onChange(false)}
      className={clsx(
        'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
        !darkMode
          ? 'border border-ember-500/20 bg-ember-500/10 text-ember-400'
          : 'border border-transparent text-surface-500 hover:bg-surface-800 hover:text-surface-300',
      )}
    >
      <Sun className="h-4 w-4" />
      Light
    </button>
    <button
      onClick={() => onChange(true)}
      className={clsx(
        'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
        darkMode
          ? 'border border-ember-500/20 bg-ember-500/10 text-ember-400'
          : 'border border-transparent text-surface-500 hover:bg-surface-800 hover:text-surface-300',
      )}
    >
      <Moon className="h-4 w-4" />
      Dark
    </button>
  </div>
)

export const SettingsPage = () => {
  const { settings, actions, guestApiKey } = useAppStore()
  const { mode } = useAuth()
  const [activeSection, setActiveSection] = useState<SettingsSection>('openrouter')
  const [newCuisine, setNewCuisine] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [showFreeOnly, setShowFreeOnly] = useState(false)
  const apiKeyValue = settings.apiKey ?? guestApiKey ?? ''
  const resolvedApiKey = (settings.apiKey ?? guestApiKey)?.trim() || undefined

  const {
    data: modelsData,
    isLoading: isLoadingModels,
    error: modelsError,
    refetch: refetchModels,
  } = useQuery({
    queryKey: ['openrouter-models', resolvedApiKey],
    queryFn: () => listOpenRouterModels(resolvedApiKey),
    enabled: Boolean(resolvedApiKey),
  })

  const filteredModels = useMemo(
    () => filterModels(modelsData ?? [], modelSearch, showFreeOnly),
    [modelsData, modelSearch, showFreeOnly],
  )
  const calendarSync = settings.calendarSync ?? {
    provider: 'google',
    connected: false,
    autoPushEvents: false,
  }
  const appPreferences = settings.appPreferences ?? defaultAppPreferences

  const toggleMealType = (mealType: MealType) => {
    const active = new Set(settings.mealTypes)
    if (active.has(mealType)) {
      active.delete(mealType)
    } else {
      active.add(mealType)
    }
    actions.setSettings({ mealTypes: Array.from(active) as MealType[] })
  }

  const addCuisine = (cuisine: string) => {
    const trimmed = cuisine.trim()
    if (!trimmed) return
    if (settings.preferredCuisines.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return
    actions.setSettings({ preferredCuisines: [...settings.preferredCuisines, trimmed] })
    setNewCuisine('')
  }

  const updateAppPreferences = (partial: Partial<AppPreferences>) => {
    actions.setSettings({ appPreferences: { ...appPreferences, ...partial } })
  }

  const applyModelSelection = (model: OpenRouterModel) => {
    actions.setSettings({ aiModel: model.id, aiModelMetadata: mapModelMetadata(model) })
  }

  const handleModelInput = (value: string) => {
    const trimmed = value.trim()
    const match = modelsData?.find((model) => model.id === trimmed)
    actions.setSettings({
      aiModel: trimmed,
      aiModelMetadata: match ? mapModelMetadata(match) : undefined,
    })
  }

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader
        title="Settings"
        description="Fine-tune how the AI plans meals, manages calendars, and connects to OpenRouter."
      />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="rounded-2xl border border-surface-700/50 bg-surface-800/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">Menu</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {sections.map((section) => (
              <button
                key={section.id}
                className={clsx(
                  'rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all duration-200',
                  activeSection === section.id
                    ? 'border border-ember-500/20 bg-ember-500/10 text-ember-400'
                    : 'border border-transparent text-surface-400 hover:bg-surface-800/50 hover:text-surface-200',
                )}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>
        </nav>
        <div className="space-y-6">
          {activeSection === 'openrouter' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-surface-100">OpenRouter API</h3>
                <p className="mt-2 text-sm text-surface-400">
                  Use your OpenRouter key to unlock the full model catalog and route calls through
                  your account.
                </p>
                <label className="mt-6 block text-sm font-medium text-surface-300">
                  OpenRouter API key
                </label>
                <Input
                  type="password"
                  value={apiKeyValue}
                  onChange={(e) => {
                    actions.setSettings({ apiKey: e.target.value })
                    actions.setApiKey(e.target.value)
                  }}
                  placeholder="sk-or-v1-..."
                />
                {mode === 'guest' && (
                  <p className="mt-2 text-xs text-surface-500">
                    Key stored locally for guest mode.
                  </p>
                )}
                <label className="mt-6 block text-sm font-medium text-surface-300">
                  Selected model
                </label>
                <Input
                  value={settings.aiModel}
                  onChange={(e) => handleModelInput(e.target.value)}
                  placeholder="openrouter/anthropic/claude-3.5-sonnet"
                />
                <div className="mt-4 rounded-2xl border border-surface-700/30 bg-surface-800/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Current model
                  </p>
                  <ModelSummary
                    modelId={settings.aiModel}
                    metadata={settings.aiModelMetadata}
                    className="mt-2"
                  />
                </div>
              </Card>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-surface-100">Model catalog</h3>
                    <p className="mt-1 text-sm text-surface-400">
                      Search and filter the latest models from OpenRouter.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => refetchModels()}
                    disabled={!resolvedApiKey || isLoadingModels}
                  >
                    Refresh
                  </Button>
                </div>
                {resolvedApiKey ? (
                  <div className="mt-6 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Input
                        placeholder="Search by name or ID"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        className="flex-1"
                        disabled={isLoadingModels}
                      />
                      <label className="flex items-center gap-2 text-sm text-surface-400">
                        <input
                          type="checkbox"
                          checked={showFreeOnly}
                          onChange={(e) => setShowFreeOnly(e.target.checked)}
                          className="rounded border-surface-700 bg-surface-800 text-ember-500 focus:ring-ember-500/20"
                        />
                        Only free
                      </label>
                    </div>
                    {isLoadingModels && <p className="text-sm text-surface-400">Loading models…</p>}
                    {!isLoadingModels && modelsError && (
                      <p className="text-sm text-red-400">
                        {modelsError instanceof Error
                          ? modelsError.message
                          : 'Unable to load models from OpenRouter.'}
                      </p>
                    )}
                    {!isLoadingModels && !modelsError && filteredModels.length === 0 && (
                      <p className="text-sm text-surface-400">No models match your filters.</p>
                    )}
                    {!isLoadingModels && !modelsError && filteredModels.length > 0 && (
                      <div className="max-h-80 space-y-3 overflow-y-auto pr-2">
                        {filteredModels.map((model) => {
                          const selected = settings.aiModel === model.id
                          const free = isModelFree(model)
                          return (
                            <button
                              key={model.id}
                              onClick={() => applyModelSelection(model)}
                              className={clsx(
                                'w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200',
                                selected
                                  ? 'border-ember-500/40 bg-ember-500/5'
                                  : 'border-surface-700/50 hover:border-surface-600 hover:bg-surface-800/30',
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-surface-200">
                                    {model.name ?? model.id}
                                  </p>
                                  <p className="text-xs text-surface-500">{model.id}</p>
                                </div>
                                {selected && (
                                  <span className="text-xs font-semibold text-ember-400">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-surface-500">
                                {model.context_length && (
                                  <span>Context: {model.context_length.toLocaleString()}</span>
                                )}
                                {model.architecture?.modality && (
                                  <span>{model.architecture.modality}</span>
                                )}
                                {free && (
                                  <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-brand-400">
                                    Free
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-surface-400">
                    Add an API key above to load the model list.
                  </p>
                )}
              </Card>
            </div>
          )}

          {activeSection === 'meals' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-surface-100">Preferred cuisines</h3>
                <p className="mt-2 text-sm text-surface-400">
                  Helps the AI prioritize flavors your family loves.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {settings.preferredCuisines.map((cuisine) => (
                    <span
                      key={cuisine}
                      className="inline-flex items-center gap-2 rounded-full border border-ember-500/20 bg-ember-500/10 px-4 py-1.5 text-sm text-ember-400"
                    >
                      {cuisine}
                      <button
                        onClick={() =>
                          actions.setSettings({
                            preferredCuisines: settings.preferredCuisines.filter(
                              (c) => c !== cuisine,
                            ),
                          })
                        }
                        className="hover:text-ember-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex gap-2">
                  <Input
                    value={newCuisine}
                    onChange={(e) => setNewCuisine(e.target.value)}
                    placeholder="e.g. Thai"
                  />
                  <Button variant="secondary" onClick={() => addCuisine(newCuisine)}>
                    Add
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-surface-500">
                  {cuisineLibrary.map((cuisine) => (
                    <button
                      key={cuisine}
                      className="rounded-full border border-surface-700 px-3 py-1.5 transition-colors hover:border-ember-500/50 hover:text-ember-400"
                      onClick={() => addCuisine(cuisine)}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-surface-100">Meals to plan</h3>
                <p className="mt-2 text-sm text-surface-400">
                  Select which meals appear in the weekly generator.
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {mealTypeOptions.map((meal) => (
                    <label key={meal} className="flex items-center gap-3 text-sm text-surface-300">
                      <input
                        type="checkbox"
                        checked={settings.mealTypes.includes(meal)}
                        onChange={() => toggleMealType(meal)}
                        className="rounded border-surface-700 bg-surface-800 text-ember-500 focus:ring-ember-500/20"
                      />
                      {mealLabels[meal]}
                    </label>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-surface-100">Default timing</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {mealTypeOptions.map((meal) => (
                    <div key={`time-${meal}`} className="space-y-2">
                      <label className="text-sm font-medium text-surface-300">
                        {mealLabels[meal]}
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="time"
                          value={settings.defaultMealTimes[meal]}
                          onChange={(e) =>
                            actions.setSettings({
                              defaultMealTimes: {
                                ...settings.defaultMealTimes,
                                [meal]: e.target.value,
                              },
                            })
                          }
                        />
                        <Input
                          type="number"
                          value={settings.defaultMaxCookingMinutes[meal]}
                          onChange={(e) =>
                            actions.setSettings({
                              defaultMaxCookingMinutes: {
                                ...settings.defaultMaxCookingMinutes,
                                [meal]: Number(e.target.value),
                              },
                            })
                          }
                          placeholder="Max min"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'calendar' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-surface-100">Google Calendar sync</h3>
                <p className="mt-2 text-sm text-surface-400">
                  Keep schedules aligned so the AI can recommend faster meals on busy days.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-surface-400">Status:</span>
                  <span
                    className={clsx(
                      'font-semibold',
                      calendarSync.connected ? 'text-brand-400' : 'text-orange-400',
                    )}
                  >
                    {calendarSync.connected ? 'Connected' : 'Not connected'}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      actions.setCalendarSyncSettings({ connected: !calendarSync.connected })
                    }
                  >
                    {calendarSync.connected ? 'Disconnect' : 'Connect placeholder'}
                  </Button>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-surface-300">Calendar email</label>
                    <Input
                      value={calendarSync.calendarEmail ?? ''}
                      onChange={(e) =>
                        actions.setCalendarSyncSettings({ calendarEmail: e.target.value })
                      }
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-surface-300">Calendar ID</label>
                    <Input
                      value={calendarSync.calendarId ?? ''}
                      onChange={(e) =>
                        actions.setCalendarSyncSettings({ calendarId: e.target.value })
                      }
                      placeholder="primary"
                    />
                  </div>
                </div>
                <label className="mt-5 flex items-center gap-3 text-sm text-surface-300">
                  <input
                    type="checkbox"
                    checked={calendarSync.autoPushEvents ?? false}
                    onChange={(e) =>
                      actions.setCalendarSyncSettings({ autoPushEvents: e.target.checked })
                    }
                    className="rounded border-surface-700 bg-surface-800 text-ember-500 focus:ring-ember-500/20"
                  />
                  Auto-push prep sessions to calendar
                </label>
              </Card>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-surface-100">Theme</h3>
                <p className="mt-2 text-sm text-surface-400">Choose your preferred color scheme.</p>
                <div className="mt-6">
                  <ThemeToggle
                    darkMode={appPreferences.darkMode}
                    onChange={(dark) => updateAppPreferences({ darkMode: dark })}
                  />
                </div>
                <div className="mt-6 rounded-xl border border-surface-700/30 bg-surface-800/30 p-4">
                  <p className="text-xs text-surface-500">
                    Dark mode is enabled by default for a refined, easy-on-the-eyes experience while
                    planning your meals.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'app' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-surface-100">App preferences</h3>
                <p className="mt-2 text-sm text-surface-400">
                  Tweak how the interface behaves across the app.
                </p>
                <div className="mt-6 space-y-5 text-sm">
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-surface-300">Compact layout</span>
                    <input
                      type="checkbox"
                      checked={appPreferences.compactMode}
                      onChange={(e) => updateAppPreferences({ compactMode: e.target.checked })}
                      className="rounded border-surface-700 bg-surface-800 text-ember-500 focus:ring-ember-500/20"
                    />
                  </label>
                  <p className="-mt-3 ml-1 text-xs text-surface-500">
                    Condense cards and reduce whitespace on large screens.
                  </p>

                  <label className="flex cursor-pointer items-center justify-between pt-2">
                    <span className="text-surface-300">Show nutritional info</span>
                    <input
                      type="checkbox"
                      checked={appPreferences.showNutritionalInfo}
                      onChange={(e) =>
                        updateAppPreferences({ showNutritionalInfo: e.target.checked })
                      }
                      className="rounded border-surface-700 bg-surface-800 text-ember-500 focus:ring-ember-500/20"
                    />
                  </label>
                  <p className="-mt-3 ml-1 text-xs text-surface-500">
                    Toggle calorie and macro panels in recipes.
                  </p>

                  <label className="flex cursor-pointer items-center justify-between pt-2">
                    <span className="text-surface-300">
                      Auto-build shopping list after planning
                    </span>
                    <input
                      type="checkbox"
                      checked={appPreferences.autoBuildShoppingList}
                      onChange={(e) =>
                        updateAppPreferences({ autoBuildShoppingList: e.target.checked })
                      }
                      className="rounded border-surface-700 bg-surface-800 text-ember-500 focus:ring-ember-500/20"
                    />
                  </label>
                  <p className="-mt-3 ml-1 text-xs text-surface-500">
                    When enabled the app creates a new grocery list whenever a plan is generated.
                  </p>
                </div>
              </Card>
              <Button variant="danger" onClick={() => actions.resetAll()}>
                Reset all local data
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  morningSnack: 'Morning snack',
  lunch: 'Lunch',
  afternoonSnack: 'Afternoon snack',
  dinner: 'Dinner',
}

const filterModels = (models: OpenRouterModel[], search: string, freeOnly: boolean) => {
  const query = search.trim().toLowerCase()
  return models.filter((model) => {
    if (freeOnly && !isModelFree(model)) return false
    if (!query) return true
    return model.name?.toLowerCase().includes(query) || model.id.toLowerCase().includes(query)
  })
}
