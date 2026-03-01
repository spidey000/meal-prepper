export type ActivityLevel = 'sedentary' | 'active' | 'very-active'
export type MealType = 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner'

export interface FamilyMember {
  id: string
  name: string
  age?: number
  allergies: string[]
  dietaryPreferences: string[]
  activityLevel: ActivityLevel
  weightKg?: number
  heightCm?: number
  schoolSchedule?: {
    dropOff?: string
    pickUp?: string
    eatsLunchAtHome?: boolean
  }
  notes?: string
}

export interface ScheduleEvent {
  id: string
  summary: string
  start: string
  end: string
}

export type CalendarSource = 'manual' | 'google' | 'ics'

export interface FreeBlock {
  start: string
  end: string
}

export interface MealAvailability {
  lunchMinutes: number
  dinnerMinutes: number
}

export interface WeeklyScheduleDay {
  id: string
  date: string
  dayOfWeek: string
  events: ScheduleEvent[]
  availability: MealAvailability
  freeBlocks?: FreeBlock[]
  calendarSource?: CalendarSource
  isBatchCookingDay?: boolean
  diners: {
    lunch: string[]
    dinner: string[]
  }
}

export interface Ingredient {
  item: string
  quantity: number
  unit: string
}

export interface Recipe {
  id: string
  name: string
  description?: string
  ingredients: Ingredient[]
  instructions: string
  prepTimeMinutes: number
  cookingTimeMinutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  nutritionalInfo: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  servesPeople: number
  tags: string[]
}

export interface MealSlotReference {
  name: string
  recipeId: string | null
}

export interface PrepSession {
  id: string
  recipeId: string
  mealType: MealType
  start: string
  end: string
  notes?: string
  isBatchCooking?: boolean
}

export interface DailyMenu {
  date: string
  breakfast: MealSlotReference | null
  morningSnack: MealSlotReference | null
  lunch: MealSlotReference | null
  afternoonSnack: MealSlotReference | null
  dinner: MealSlotReference | null
  prepSessions?: PrepSession[]
}

export interface ShoppingListItem {
  item: string
  quantity: number
  unit: string
  estimatedPrice?: number
  notes?: string
  checked?: boolean
}

export interface ShoppingListCategory {
  categoryName: string
  items: ShoppingListItem[]
}

export interface ShoppingList {
  weekStartDate: string
  categories: ShoppingListCategory[]
  estimatedTotalCost?: number
}

export interface CalendarSyncSettings {
  provider: 'google'
  connected: boolean
  calendarId?: string
  calendarEmail?: string
  autoPushEvents: boolean
  lastSyncedAt?: string
}

export interface AppPreferences {
  compactMode: boolean
  showNutritionalInfo: boolean
  autoBuildShoppingList: boolean
}

export interface UserSettings {
  preferredCuisines: string[]
  mealTypes: MealType[]
  defaultMealTimes: Record<MealType, string>
  defaultMaxCookingMinutes: Record<MealType, number>
  aiModel: string
  apiProvider: 'openrouter'
  apiKey?: string
  calendarSync?: CalendarSyncSettings
  appPreferences: AppPreferences
}

export interface MealPlanConfig {
  startDate: string
  members: FamilyMember[]
  schedule: WeeklyScheduleDay[]
  settings: UserSettings
}

export interface MealPlanResponse {
  dailyMenus: DailyMenu[]
  recipes: Recipe[]
}
