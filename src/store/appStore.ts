import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import type {
  CalendarSyncSettings,
  DailyMenu,
  FamilyMember,
  MealPlanResponse,
  MealType,
  Recipe,
  ShoppingList,
  WeeklyScheduleDay,
  UserSettings,
} from '../types/app'
import { profileStorage } from './profileStorage'
import { aiDebug, createAIConfigSnapshot } from '../services/aiDebug'

const defaultMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner']

export const defaultAppPreferences = {
  compactMode: false,
  showNutritionalInfo: true,
  autoBuildShoppingList: true,
}

const createDefaultSettings = (): UserSettings => ({
  preferredCuisines: ['mediterranean', 'italian', 'mexican'],
  mealTypes: defaultMealTypes,
  defaultMealTimes: {
    breakfast: '08:00',
    morningSnack: '10:30',
    lunch: '13:00',
    afternoonSnack: '17:00',
    dinner: '20:00',
  },
  defaultMaxCookingMinutes: {
    breakfast: 20,
    morningSnack: 10,
    lunch: 45,
    afternoonSnack: 10,
    dinner: 45,
  },
  aiModel: 'openrouter/anthropic/claude-3.5-sonnet',
  apiProvider: 'openrouter',
  calendarSync: {
    provider: 'google',
    connected: false,
    autoPushEvents: false,
  },
  appPreferences: { ...defaultAppPreferences },
  aiModelMetadata: undefined,
})

const defaultSettings: UserSettings = createDefaultSettings()

export interface AppState {
  family: FamilyMember[]
  schedule: WeeklyScheduleDay[]
  recipes: Record<string, Recipe>
  dailyMenus: DailyMenu[]
  shoppingList: ShoppingList | null
  settings: UserSettings
  guestApiKey?: string
  lastGeneratedAt?: string
  lastCalendarSync?: string
  isGenerating: boolean
  actions: {
    addMember: (member: Omit<FamilyMember, 'id'>) => void
    updateMember: (member: FamilyMember) => void
    removeMember: (id: string) => void
    upsertScheduleDay: (day: WeeklyScheduleDay) => void
    toggleBatchCookingDay: (dayId: string) => void
    removeScheduleEvent: (dayId: string, eventId: string) => void
    applyCalendarImport: (days: WeeklyScheduleDay[]) => void
    setMealPlan: (response: MealPlanResponse) => void
    setShoppingList: (list: ShoppingList) => void
    toggleShoppingItem: (category: string, item: string) => void
    updateShoppingNote: (category: string, item: string, notes: string) => void
    setSettings: (settings: Partial<Omit<UserSettings, 'calendarSync'>>) => void
    setCalendarSyncSettings: (settings: Partial<CalendarSyncSettings>) => void
    setApiKey: (key?: string) => void
    setLastCalendarSync: (iso?: string) => void
    setGenerating: (value: boolean) => void
    resetAll: () => void
  }
}

const emptyWeek = (): WeeklyScheduleDay[] => {
  const today = new Date()
  const start = new Date(today)
  const mondayIndex = (today.getDay() + 6) % 7
  start.setDate(today.getDate() - mondayIndex)
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const iso = date.toISOString().split('T')[0]
    return {
      id: nanoid(),
      date: iso,
      dayOfWeek: date.toLocaleDateString(undefined, { weekday: 'long' }),
      events: [],
      availability: { lunchMinutes: 45, dinnerMinutes: 45 },
      freeBlocks: [],
      calendarSource: 'manual',
      isBatchCookingDay: false,
      diners: { lunch: [], dinner: [] },
    }
  }) as WeeklyScheduleDay[]
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        family: [],
        schedule: emptyWeek(),
        recipes: {},
        dailyMenus: [],
        shoppingList: null,
        settings: createDefaultSettings(),
        isGenerating: false,
        lastCalendarSync: undefined,
        actions: {
          addMember: (member) =>
            set((state) => ({
              family: [...state.family, { ...member, id: nanoid() }],
            })),
          updateMember: (member) =>
            set((state) => ({
              family: state.family.map((m) => (m.id === member.id ? member : m)),
            })),
          removeMember: (id) =>
            set((state) => ({ family: state.family.filter((m) => m.id !== id) })),
          upsertScheduleDay: (day) =>
            set((state) => ({
              schedule: state.schedule.some((d) => d.id === day.id)
                ? state.schedule.map((d) => (d.id === day.id ? day : d))
                : [...state.schedule, day],
            })),
          toggleBatchCookingDay: (dayId) =>
            set((state) => ({
              schedule: state.schedule.map((day) =>
                day.id === dayId ? { ...day, isBatchCookingDay: !day.isBatchCookingDay } : day,
              ),
            })),
          removeScheduleEvent: (dayId, eventId) =>
            set((state) => ({
              schedule: state.schedule.map((day) =>
                day.id === dayId
                  ? { ...day, events: day.events.filter((event) => event.id !== eventId) }
                  : day,
              ),
            })),
          applyCalendarImport: (days) =>
            set((state) => {
              const byDate = new Map(days.map((day) => [day.date, day]))
              const merged = state.schedule.map((day) => {
                const incoming = byDate.get(day.date)
                if (!incoming) return day
                return {
                  ...day,
                  ...incoming,
                  id: day.id,
                  diners: incoming.diners ?? day.diners,
                }
              })
              const existingDates = new Set(state.schedule.map((day) => day.date))
              const additions = days
                .filter((day) => !existingDates.has(day.date))
                .map((day) => ({ ...day, id: nanoid() }))
              return { schedule: [...merged, ...additions] }
            }),
          setMealPlan: (response) => {
            const recipeMap = response.recipes.reduce<Record<string, Recipe>>((acc, recipe) => {
              acc[recipe.id] = recipe
              return acc
            }, {})
            set({
              recipes: recipeMap,
              dailyMenus: response.dailyMenus,
              lastGeneratedAt: new Date().toISOString(),
              shoppingList: null,
            })
          },
          setShoppingList: (list) => set({ shoppingList: list }),
          toggleShoppingItem: (category, item) =>
            set((state) => ({
              shoppingList: state.shoppingList
                ? {
                    ...state.shoppingList,
                    categories: state.shoppingList.categories.map((cat) =>
                      cat.categoryName === category
                        ? {
                            ...cat,
                            items: cat.items.map((listItem) =>
                              listItem.item === item
                                ? { ...listItem, checked: !listItem.checked }
                                : listItem,
                            ),
                          }
                        : cat,
                    ),
                  }
                : null,
            })),
          updateShoppingNote: (category, item, notes) =>
            set((state) => ({
              shoppingList: state.shoppingList
                ? {
                    ...state.shoppingList,
                    categories: state.shoppingList.categories.map((cat) =>
                      cat.categoryName === category
                        ? {
                            ...cat,
                            items: cat.items.map((listItem) =>
                              listItem.item === item ? { ...listItem, notes } : listItem,
                            ),
                          }
                        : cat,
                    ),
                  }
                : null,
            })),
          setSettings: (settings: Partial<Omit<UserSettings, 'calendarSync'>>) =>
            set((state) => {
              const nextSettings = { ...state.settings, ...settings }
              const aiSettingsChanged =
                typeof settings.aiModel !== 'undefined' ||
                typeof settings.aiModelMetadata !== 'undefined' ||
                typeof settings.apiProvider !== 'undefined'
              if (aiSettingsChanged) {
                aiDebug.logConfig(
                  'setSettings',
                  createAIConfigSnapshot({
                    model: nextSettings.aiModel,
                    modelLabel: nextSettings.aiModelMetadata?.label,
                    supportsJsonResponse: nextSettings.aiModelMetadata?.supportsJsonResponse,
                    provider: 'openrouter',
                    metadata: nextSettings.aiModelMetadata,
                  }),
                )
              }
              return { settings: nextSettings }
            }),
          setCalendarSyncSettings: (settings) =>
            set((state) => {
              const fallback: CalendarSyncSettings = (defaultSettings.calendarSync ?? {
                provider: 'google',
                connected: false,
                autoPushEvents: false,
              }) as CalendarSyncSettings
              const previous = state.settings.calendarSync ?? fallback
              const next: CalendarSyncSettings = {
                provider: 'google',
                connected: settings.connected ?? previous.connected ?? false,
                autoPushEvents: settings.autoPushEvents ?? previous.autoPushEvents ?? false,
                calendarId: settings.calendarId ?? previous.calendarId,
                calendarEmail: settings.calendarEmail ?? previous.calendarEmail,
                lastSyncedAt: settings.lastSyncedAt ?? previous.lastSyncedAt,
              }
              return {
                settings: {
                  ...state.settings,
                  calendarSync: next,
                },
              }
            }),
          setApiKey: (key) => set({ guestApiKey: key }),
          setLastCalendarSync: (iso) => set({ lastCalendarSync: iso }),
          setGenerating: (value) => set({ isGenerating: value }),
          resetAll: () =>
            set({
              family: [],
              schedule: emptyWeek(),
              recipes: {},
              dailyMenus: [],
              shoppingList: null,
              settings: createDefaultSettings(),
              guestApiKey: undefined,
              lastGeneratedAt: undefined,
              lastCalendarSync: undefined,
              isGenerating: false,
            }),
        },
      }),
      {
        name: 'meal-prepper-state',
        storage: createJSONStorage(() => profileStorage),
        partialize: (state) => ({
          family: state.family,
          schedule: state.schedule,
          recipes: state.recipes,
          dailyMenus: state.dailyMenus,
          shoppingList: state.shoppingList,
          settings: state.settings,
          guestApiKey: state.guestApiKey,
          lastGeneratedAt: state.lastGeneratedAt,
          lastCalendarSync: state.lastCalendarSync,
        }),
      },
    ),
  ),
)
