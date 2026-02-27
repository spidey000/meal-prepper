import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { useAuth } from '../app/auth/AuthProvider'
import { SectionHeader } from '../components/SectionHeader'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import type { MealType } from '../types/app'

const cuisineLibrary = ['Mediterranean', 'Italian', 'Mexican', 'Japanese', 'Middle Eastern', 'Vegetarian', 'Vegan', 'Gluten-free']
const mealTypeOptions: MealType[] = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner']

export const SettingsPage = () => {
  const { settings, actions, guestApiKey } = useAppStore()
  const { mode } = useAuth()
  const [newCuisine, setNewCuisine] = useState('')
  const apiKeyValue = settings.apiKey ?? guestApiKey ?? ''

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

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Settings"
        description="Fine-tune how the AI plans meals and manage your OpenRouter credentials."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold text-slate-900">AI provider</h3>
          <p className="mt-1 text-sm text-slate-500">
            We use OpenRouter by default. Grab a key at openrouter.ai and paste it here.
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
          <label className="mt-6 block text-sm font-medium text-slate-600">Model</label>
          <Input
            value={settings.aiModel}
            onChange={(e) => actions.setSettings({ aiModel: e.target.value })}
            placeholder="openrouter/anthropic/claude-3.5-sonnet"
          />
        </Card>
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
                <button onClick={() =>
                  actions.setSettings({ preferredCuisines: settings.preferredCuisines.filter((c) => c !== cuisine) })
                }>
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
      </div>
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
      <Button variant="ghost" onClick={() => actions.resetAll()}>Reset all local data</Button>
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
