const MODELS_ENDPOINT = 'https://openrouter.ai/api/v1/models'

interface PricingDetail {
  price?: number
}

interface ModelPricing {
  prompt?: PricingDetail
  completion?: PricingDetail
}

export interface OpenRouterModel {
  id: string
  name?: string
  description?: string
  pricing?: ModelPricing
  context_length?: number
  tags?: string[]
  architecture?: {
    tokenizer?: string
    modality?: string
  }
}

interface ModelsResponse {
  data?: OpenRouterModel[]
}

const resolveReferer = () => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin
  }
  return 'http://localhost'
}

const buildHeaders = (apiKey: string) => {
  const referer = import.meta.env.VITE_OPENROUTER_REFERRER ?? resolveReferer()
  const title = import.meta.env.VITE_OPENROUTER_TITLE ?? 'AI Family Meal Planner'
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': referer,
    'X-Title': title,
  }
}

export async function listOpenRouterModels(apiKey?: string): Promise<OpenRouterModel[]> {
  const key = apiKey ?? import.meta.env.VITE_OPENROUTER_API_KEY
  if (!key) {
    throw new Error('Missing OpenRouter API key. Add it in Settings to load models.')
  }

  const response = await fetch(MODELS_ENDPOINT, {
    method: 'GET',
    headers: buildHeaders(key),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Unable to load models (${response.status}): ${message || 'Unknown error'}`)
  }

  const payload: ModelsResponse = await response.json()
  if (!Array.isArray(payload.data)) {
    return []
  }
  return payload.data
}
