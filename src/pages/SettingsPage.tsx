import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore, defaultAppPreferences } from '../store/appStore'
import { useAuth } from '../app/auth/useAuth'
import { SectionHeader } from '../components/SectionHeader'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import type { AppPreferences, MealType } from '../types/app'
import { listOpenRouterModels, type OpenRouterModel } from '../services/openrouter'

const cuisineLibrary = ['Mediterranean', 'Italian', 'Mexican', 'Japanese', 'Middle Eastern', 'Vegetarian', 'Vegan', 'Gluten-free']
const mealTypeOptions: MealType[] = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner']
const sections = [
  { id: 'openrouter', label: 'OpenRouter' },
  { id: 'meals', label: 'Meal planning' },
  { id: 'calendar', label: 'Calendar sync' },
  { id: 'app', label: 'App preferences' },
] as const

type SettingsSection = (typeof sections)[number]['id']

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
  const calendarSync = settings.calendarSync ?? { provider: 'google', connected: false, autoPushEvents: false }
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

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Settings"
        description="Fine-tune how the AI plans meals, manages calendars, and connects to OpenRouter."
      />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Menu</p>
          <div className="mt-3 flex flex-col gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                className={`rounded-xl px-4 py-2 text-left text-sm font-medium transition ${
                  activeSection === section.id
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
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
                <h3 className="text-lg font-semibold text-slate-900">OpenRouter API</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Use your OpenRouter key to unlock the full model catalog and route calls through your account.
                </p>
                <label className="mt-4 block text-sm font-medium text-slate-600">OpenRouter API key</label>
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
                  <p className="mt-2 text-xs text-slate-500">Key stored locally for guest mode.</p>
                )}
                <label className="mt-6 block text-sm font-medium text-slate-600">Selected model</label>
                <Input
                  value={settings.aiModel}
                  onChange={(e) => actions.setSettings({ aiModel: e.target.value })}
                  placeholder="openrouter/anthropic/claude-3.5-sonnet"
                />
              </Card>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Model catalog</h3>
                    <p className="text-sm text-slate-500">Search and filter the latest models from OpenRouter.</p>
                  </div>
                  <Button variant="secondary" onClick={() => refetchModels()} disabled={!resolvedApiKey || isLoadingModels}>
                    Refresh
                  </Button>
                </div>
                {resolvedApiKey ? (
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Input
                        placeholder="Search by name or ID"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        className="flex-1"
                        disabled={isLoadingModels}
                      />
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={showFreeOnly}
                          onChange={(e) => setShowFreeOnly(e.target.checked)}
                        />
                        Only free
                      </label>
                    </div>
                    {isLoadingModels && <p className="text-sm text-slate-500">Loading models…</p>}
                    {!isLoadingModels && modelsError && (
                      <p className="text-sm text-red-600">
                        {modelsError instanceof Error ? modelsError.message : 'Unable to load models from OpenRouter.'}
                      </p>
                    )}
                    {!isLoadingModels && !modelsError && filteredModels.length === 0 && (
                      <p className="text-sm text-slate-500">No models match your filters.</p>
                    )}
                    {!isLoadingModels && !modelsError && filteredModels.length > 0 && (
                      <div className="max-h-80 space-y-3 overflow-y-auto pr-2">
                        {filteredModels.map((model) => {
                          const selected = settings.aiModel === model.id
                          const free = isModelFree(model)
                          return (
                            <button
                              key={model.id}
                              onClick={() => actions.setSettings({ aiModel: model.id })}
                              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                                selected ? 'border-brand-400 bg-brand-50' : 'border-slate-200 hover:border-brand-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{model.name ?? model.id}</p>
                                  <p className="text-xs text-slate-500">{model.id}</p>
                                </div>
                                {selected && <span className="text-xs font-semibold text-brand-600">Selected</span>}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                {model.context_length && <span>Context: {model.context_length.toLocaleString()}</span>}
                                {model.architecture?.modality && <span>{model.architecture.modality}</span>}
                                {free && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Free</span>}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">Add an API key above to load the model list.</p>
                )}
              </Card>
            </div>
          )}

          {activeSection === 'meals' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-slate-900">Preferred cuisines</h3>
                <p className="mt-1 text-sm text-slate-500">Helps the AI prioritize flavors your family loves.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {settings.preferredCuisines.map((cuisine) => (
                    <span
                      key={cuisine}
                      className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1 text-sm text-brand-700"
                    >
                      {cuisine}
                      <button
                        onClick={() =>
                          actions.setSettings({ preferredCuisines: settings.preferredCuisines.filter((c) => c !== cuisine) })
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Input value={newCuisine} onChange={(e) => setNewCuisine(e.target.value)} placeholder="e.g. Thai" />
                  <Button variant="secondary" onClick={() => addCuisine(newCuisine)}>
                    Add
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  {cuisineLibrary.map((cuisine) => (
                    <button
                      key={cuisine}
                      className="rounded-full border border-slate-200 px-3 py-1 hover:border-brand-400"
                      onClick={() => addCuisine(cuisine)}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-slate-900">Meals to plan</h3>
                <p className="text-sm text-slate-500">Select which meals appear in the weekly generator.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {mealTypeOptions.map((meal) => (
                    <label key={meal} className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={settings.mealTypes.includes(meal)} onChange={() => toggleMealType(meal)} />
                      {meal}
                    </label>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="text-lg font-semibold text-slate-900">Default timing</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {mealTypeOptions.map((meal) => (
                    <div key={`time-${meal}`} className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">{mealLabels[meal]}</label>
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
                        placeholder="Max minutes"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'calendar' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-slate-900">Google Calendar sync</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Keep schedules aligned so the AI can recommend faster meals on busy days.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span>Status:</span>
                  <span className={`font-semibold ${calendarSync.connected ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {calendarSync.connected ? 'Connected' : 'Not connected'}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => actions.setCalendarSyncSettings({ connected: !calendarSync.connected })}
                  >
                    {calendarSync.connected ? 'Disconnect' : 'Connect placeholder'}
                  </Button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Calendar email</label>
                    <Input
                      value={calendarSync.calendarEmail ?? ''}
                      onChange={(e) => actions.setCalendarSyncSettings({ calendarEmail: e.target.value })}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Calendar ID</label>
                    <Input
                      value={calendarSync.calendarId ?? ''}
                      onChange={(e) => actions.setCalendarSyncSettings({ calendarId: e.target.value })}
                      placeholder="primary"
                    />
                  </div>
                </div>
                <label className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={calendarSync.autoPushEvents ?? false}
                    onChange={(e) => actions.setCalendarSyncSettings({ autoPushEvents: e.target.checked })}
                  />
                  Auto-push prep sessions to calendar
                </label>
              </Card>
            </div>
          )}

          {activeSection === 'app' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-slate-900">App preferences</h3>
                <p className="mt-1 text-sm text-slate-500">Tweak how the interface behaves across the app.</p>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <label className="flex items-center justify-between">
                    Compact layout
                    <input
                      type="checkbox"
                      checked={appPreferences.compactMode}
                      onChange={(e) => updateAppPreferences({ compactMode: e.target.checked })}
                    />
                  </label>
                  <p className="text-xs text-slate-400">Condense cards and reduce whitespace on large screens.</p>
                  <label className="mt-4 flex items-center justify-between">
                    Show nutritional info
                    <input
                      type="checkbox"
                      checked={appPreferences.showNutritionalInfo}
                      onChange={(e) => updateAppPreferences({ showNutritionalInfo: e.target.checked })}
                    />
                  </label>
                  <p className="text-xs text-slate-400">Toggle calorie and macro panels in recipes.</p>
                  <label className="mt-4 flex items-center justify-between">
                    Auto-build shopping list after planning
                    <input
                      type="checkbox"
                      checked={appPreferences.autoBuildShoppingList}
                      onChange={(e) => updateAppPreferences({ autoBuildShoppingList: e.target.checked })}
                    />
                  </label>
                  <p className="text-xs text-slate-400">When enabled the app creates a new grocery list whenever a plan is generated.</p>
                </div>
              </Card>
              <Button variant="ghost" onClick={() => actions.resetAll()}>
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

const isModelFree = (model: OpenRouterModel) => {
  const promptCost = model.pricing?.prompt?.price
  const completionCost = model.pricing?.completion?.price
  return (
    (typeof promptCost === 'number' && promptCost === 0 && typeof completionCost === 'number' && completionCost === 0) ||
    model.id.includes(':free') ||
    (model.name?.toLowerCase().includes('free') ?? false)
  )
}

const filterModels = (models: OpenRouterModel[], search: string, freeOnly: boolean) => {
  const query = search.trim().toLowerCase()
  return models.filter((model) => {
    if (freeOnly && !isModelFree(model)) return false
    if (!query) return true
    return (
      model.name?.toLowerCase().includes(query) ||
      model.id.toLowerCase().includes(query)
    )
  })
}
