import type {
  FamilyMember,
  MealPlanConfig,
  MealPlanResponse,
  Recipe,
  ShoppingList,
  WeeklyScheduleDay,
} from '../types/app'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'openrouter/anthropic/claude-3.5-sonnet'
const PROXY_URL = import.meta.env.VITE_AI_PROXY_URL

interface BaseAIOptions {
  apiKey?: string
  model?: string
}

async function callAI<T>({
  messages,
  apiKey,
  model = DEFAULT_MODEL,
}: {
  messages: { role: 'system' | 'user'; content: string }[]
} & BaseAIOptions): Promise<T> {
  if (PROXY_URL) {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`AI proxy error: ${response.status} ${text}`)
    }

    return response.json()
  }

  const key = apiKey ?? import.meta.env.VITE_OPENROUTER_API_KEY
  if (!key) {
    throw new Error('Missing OpenRouter API key. Add it in Settings.')
  }
  const referer = import.meta.env.VITE_OPENROUTER_REFERRER ?? window.location.origin
  const title = import.meta.env.VITE_OPENROUTER_TITLE ?? 'AI Family Meal Planner'

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': referer,
      'X-Title': title,
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenRouter error: ${response.status} ${text}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('Malformed OpenRouter response')
  return JSON.parse(content)
}


function summarizeFamily(members: FamilyMember[]) {
  return members.map((member) => ({
    id: member.id,
    name: member.name,
    allergies: member.allergies,
    dietaryPreferences: member.dietaryPreferences,
    activityLevel: member.activityLevel,
    eatsLunchAtHome: member.schoolSchedule?.eatsLunchAtHome ?? true,
  }))
}

function summarizeSchedule(schedule: WeeklyScheduleDay[]) {
  return schedule.map((day) => ({
    date: day.date,
    dayOfWeek: day.dayOfWeek,
    availability: day.availability,
    diners: day.diners,
  }))
}

export async function generateMealPlan(
  config: MealPlanConfig,
  options: BaseAIOptions,
): Promise<MealPlanResponse> {
  const prompt = `You are an experienced family nutritionist. Build a 7 day menu for the household.
Family members: ${JSON.stringify(summarizeFamily(config.members))}
Weekly schedule availability: ${JSON.stringify(summarizeSchedule(config.schedule))}
Meal types requested: ${JSON.stringify(config.settings.mealTypes)}
Preferred cuisines: ${JSON.stringify(config.settings.preferredCuisines)}
Default meal times: ${JSON.stringify(config.settings.defaultMealTimes)}
Default cook time caps: ${JSON.stringify(config.settings.defaultMaxCookingMinutes)}

Return strict JSON with shape {"dailyMenus": DailyMenu[], "recipes": Recipe[]}.
Recipe ingredients must include quantity and unit. Encourage batch cooking on days with high availability.`

  return callAI<MealPlanResponse>({
    messages: [
      { role: 'system', content: 'You generate structured meal plans and recipes for families.' },
      { role: 'user', content: prompt },
    ],
    ...options,
  })
}

export async function regenerateMeal(
  {
    config,
    meal,
    previousRecipe,
  }: { config: MealPlanConfig; meal: { date: string; mealType: string }; previousRecipe?: string },
  options: BaseAIOptions,
): Promise<Recipe> {
  const prompt = `Regenerate a recipe for ${meal.mealType} on ${meal.date}. Avoid repeating ${previousRecipe ?? 'the previous dish'}.
Family members: ${JSON.stringify(summarizeFamily(config.members))}
Schedule: ${JSON.stringify(summarizeSchedule(config.schedule))}
Preferred cuisines: ${JSON.stringify(config.settings.preferredCuisines)}
Return JSON Recipe object.`

  return callAI<Recipe>({
    messages: [
      { role: 'system', content: 'You create structured recipes for families with dietary constraints.' },
      { role: 'user', content: prompt },
    ],
    ...options,
  })
}

export async function generateShoppingList(
  { recipes, weekStartDate }: { recipes: Recipe[]; weekStartDate: string },
  options: BaseAIOptions,
): Promise<ShoppingList> {
  const prompt = `Combine these recipes into a shopping list grouped by grocery aisle.
Week start: ${weekStartDate}
Recipes: ${JSON.stringify(recipes)}
Return JSON { "weekStartDate": string, "categories": [{"categoryName": string, "items": [{"item": string, "quantity": number, "unit": string, "estimatedPrice": number, "notes": string}]}], "estimatedTotalCost": number }`;

  return callAI<ShoppingList>({
    messages: [
      { role: 'system', content: 'You produce structured grocery lists from recipe collections.' },
      { role: 'user', content: prompt },
    ],
    ...options,
  })
}

export async function parseScheduleFromText(
  text: string,
  weekStart: string,
  options: BaseAIOptions,
): Promise<WeeklyScheduleDay[]> {
  const prompt = `Convert this human schedule into structured JSON for the week starting ${weekStart}.
Text:
${text}
Return array of WeeklyScheduleDay objects with events (summary,start,end).`;

  const result = await callAI<{ schedule: WeeklyScheduleDay[] }>({
    messages: [
      { role: 'system', content: 'You transform free-form calendars into structured JSON schedules.' },
      { role: 'user', content: prompt },
    ],
    ...options,
  })
  return result.schedule
}
