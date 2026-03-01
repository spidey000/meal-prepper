import type {
  FamilyMember,
  MealPlanConfig,
  MealPlanResponse,
  Recipe,
  ShoppingList,
  WeeklyScheduleDay,
} from '../types/app'
import { aiDebug, createAIConfigSnapshot } from './aiDebug'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models'
const DEFAULT_MODEL = 'openrouter/anthropic/claude-3.5-sonnet'
const PROXY_URL = import.meta.env.VITE_AI_PROXY_URL
const JSON_RESPONSE_FORMAT = { type: 'json_object' }

const responseFormatSupportedModels = new Set<string>()
let responseFormatSupportStatus: 'idle' | 'loading' | 'loaded' | 'failed' = 'idle'
let responseFormatFetchPromise: Promise<void> | null = null

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

const shouldRetryWithoutResponseFormat = (status: number, message: string) => {
  if (status !== 400) return false
  const normalized = message.toLowerCase()
  return normalized.includes('response_format') && normalized.includes('not support')
}

interface ModelsCapabilityResponse {
  data?: { id?: string }[]
}

const resolveReferer = () => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin
  }
  return 'http://localhost'
}

const buildOpenRouterHeaders = (apiKey: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${apiKey}`,
  'HTTP-Referer': import.meta.env.VITE_OPENROUTER_REFERRER ?? resolveReferer(),
  'X-Title': import.meta.env.VITE_OPENROUTER_TITLE ?? 'AI Family Meal Planner',
})

const ensureResponseFormatSupportLoaded = async (apiKey: string) => {
  if (responseFormatSupportStatus === 'loaded') return
  if (responseFormatFetchPromise) {
    await responseFormatFetchPromise
    return
  }
  responseFormatFetchPromise = (async () => {
    const startedAt = now()
    try {
      responseFormatSupportStatus = 'loading'
      aiDebug.logCallStart({
        source: 'ensureResponseFormatSupportLoaded',
        request: { endpoint: `${OPENROUTER_MODELS_URL}?supported_parameters=response_format` },
      })
      const response = await fetch(
        `${OPENROUTER_MODELS_URL}?supported_parameters=response_format`,
        {
          method: 'GET',
          headers: buildOpenRouterHeaders(apiKey),
        },
      )
      if (!response.ok) {
        responseFormatSupportStatus = 'failed'
        const message = await response.text()
        aiDebug.logError({
          source: 'ensureResponseFormatSupportLoaded',
          message: `Unable to load response_format support list (${response.status})`,
          error: message,
          severity: 'warn',
        })
        return
      }
      const payload = (await response.json()) as ModelsCapabilityResponse
      payload.data?.forEach((model) => {
        if (model?.id) {
          responseFormatSupportedModels.add(model.id)
        }
      })
      responseFormatSupportStatus = 'loaded'
      aiDebug.logCallResult({
        source: 'ensureResponseFormatSupportLoaded',
        status: response.status,
        durationMs: now() - startedAt,
        response: { loadedModels: responseFormatSupportedModels.size },
      })
    } catch (error) {
      responseFormatSupportStatus = 'failed'
      aiDebug.logError({
        source: 'ensureResponseFormatSupportLoaded',
        message: 'Failed to fetch response_format support list',
        error,
        severity: 'warn',
      })
    } finally {
      responseFormatFetchPromise = null
    }
  })()
  await responseFormatFetchPromise
}

const shouldRequestJsonFormat = async ({
  apiKey,
  modelId,
  hint,
}: {
  apiKey: string
  modelId: string
  hint?: boolean
}) => {
  if (typeof hint === 'boolean') {
    return hint
  }
  await ensureResponseFormatSupportLoaded(apiKey)
  if (responseFormatSupportStatus === 'loaded') {
    return responseFormatSupportedModels.has(modelId)
  }
  return true
}

export interface BaseAIOptions {
  apiKey?: string
  model?: string
  modelLabel?: string
  supportsJsonResponse?: boolean
}

async function callAI<T>({
  messages,
  apiKey,
  model = DEFAULT_MODEL,
  modelLabel,
  supportsJsonResponse,
}: {
  messages: { role: 'system' | 'user'; content: string }[]
} & BaseAIOptions): Promise<T> {
  const provider = PROXY_URL ? 'proxy' : 'openrouter'
  const configSnapshot = createAIConfigSnapshot({
    model,
    modelLabel,
    supportsJsonResponse,
    provider,
  })
  aiDebug.logConfig('callAI', configSnapshot)

  if (PROXY_URL) {
    logModelUsage(model, modelLabel)
    const preferJson = supportsJsonResponse ?? true
    const requestPayload = { messages, model, supportsJsonResponse: preferJson }
    const startedAt = now()
    aiDebug.logCallStart({ source: 'callAI.proxy', request: requestPayload })
    try {
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      })

      if (!response.ok) {
        const text = await response.text()
        aiDebug.logError({
          source: 'callAI.proxy',
          message: `AI proxy error (${response.status})`,
          error: text,
        })
        throw new Error(`AI proxy error: ${response.status} ${text}`)
      }

      const payload = (await response.json()) as T
      aiDebug.logCallResult({
        source: 'callAI.proxy',
        status: response.status,
        durationMs: now() - startedAt,
        response: payload,
      })
      return payload
    } catch (error) {
      aiDebug.logError({ source: 'callAI.proxy', message: 'Proxy AI request failed', error })
      throw error
    }
  }

  const key = apiKey ?? import.meta.env.VITE_OPENROUTER_API_KEY
  if (!key) {
    aiDebug.logError({
      source: 'callAI.openrouter',
      message: 'Missing OpenRouter API key. Add it in Settings.',
      severity: 'warn',
    })
    throw new Error('Missing OpenRouter API key. Add it in Settings.')
  }
  logModelUsage(model, modelLabel)

  const headers = buildOpenRouterHeaders(key)
  const preferJson = await shouldRequestJsonFormat({
    apiKey: key,
    modelId: model,
    hint: supportsJsonResponse,
  })

  const sendCompletion = async (useJsonFormat: boolean): Promise<T> => {
    const requestPayload = {
      model,
      messages,
      ...(useJsonFormat ? { response_format: JSON_RESPONSE_FORMAT } : {}),
    }
    const startedAt = now()
    aiDebug.logCallStart({ source: 'callAI.openrouter', request: requestPayload })
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload),
      })

      if (!response.ok) {
        const text = await response.text()
        if (useJsonFormat && shouldRetryWithoutResponseFormat(response.status, text)) {
          aiDebug.logError({
            source: 'callAI.openrouter',
            message: 'Model does not support response_format; retrying without response_format',
            error: text,
            severity: 'warn',
          })
          return sendCompletion(false)
        }
        aiDebug.logError({
          source: 'callAI.openrouter',
          message: `OpenRouter error (${response.status})`,
          error: text,
        })
        throw new Error(`OpenRouter error: ${response.status} ${text}`)
      }

      const data = await response.json()
      const content = data?.choices?.[0]?.message?.content
      if (!content) {
        aiDebug.logError({
          source: 'callAI.openrouter',
          message: 'Malformed OpenRouter response (missing content)',
          error: data,
        })
        throw new Error('Malformed OpenRouter response')
      }

      const parsed = JSON.parse(content) as T
      aiDebug.logCallResult({
        source: 'callAI.openrouter',
        status: response.status,
        durationMs: now() - startedAt,
        response: parsed,
      })
      return parsed
    } catch (error) {
      aiDebug.logError({
        source: 'callAI.openrouter',
        message: 'OpenRouter completion request failed',
        error,
      })
      throw error
    }
  }

  return sendCompletion(preferJson)
}

const logModelUsage = (modelId: string, modelLabel?: string) => {
  const label = modelLabel ?? modelId
  if (typeof console !== 'undefined' && typeof console.info === 'function') {
    console.info(`[AI] Using model ${label} (${modelId})`)
  }
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
    freeBlocks: day.freeBlocks ?? [],
    calendarSource: day.calendarSource ?? 'manual',
    isBatchCookingDay: day.isBatchCookingDay ?? false,
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
Recipe ingredients must include quantity and unit. Use freeBlocks to schedule prep and treat days with isBatchCookingDay=true as long, scalable cook sessions with leftovers.`

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
      {
        role: 'system',
        content: 'You create structured recipes for families with dietary constraints.',
      },
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
Return JSON { "weekStartDate": string, "categories": [{"categoryName": string, "items": [{"item": string, "quantity": number, "unit": string, "estimatedPrice": number, "notes": string}]}], "estimatedTotalCost": number }`

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
Return JSON { "schedule": WeeklyScheduleDay[] } where each day includes events (summary,start,end).`

  const result = await callAI<{ schedule?: WeeklyScheduleDay[] } | WeeklyScheduleDay[]>({
    messages: [
      {
        role: 'system',
        content: 'You transform free-form calendars into structured JSON schedules.',
      },
      { role: 'user', content: prompt },
    ],
    ...options,
  })
  if (Array.isArray(result)) {
    return result
  }
  if (Array.isArray(result.schedule)) {
    return result.schedule
  }
  aiDebug.logError({
    source: 'parseScheduleFromText',
    message: 'Malformed schedule response from AI',
    error: result,
  })
  throw new Error('Malformed schedule response from AI')
}
