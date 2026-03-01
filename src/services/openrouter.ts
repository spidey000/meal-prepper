import type { OpenRouterModelMetadata } from '../types/app'

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

export const isModelFree = (model: OpenRouterModel) => {
  const promptCost = model.pricing?.prompt?.price
  const completionCost = model.pricing?.completion?.price
  return (
    (typeof promptCost === 'number' && promptCost === 0 && typeof completionCost === 'number' && completionCost === 0) ||
    model.id.includes(':free') ||
    (model.name?.toLowerCase().includes('free') ?? false)
  )
}

export const mapModelMetadata = (model: OpenRouterModel): OpenRouterModelMetadata => ({
  id: model.id,
  label: model.name ?? model.id,
  contextLength: model.context_length,
  modality: model.architecture?.modality,
  tokenizer: model.architecture?.tokenizer,
  isFree: isModelFree(model),
  pricing: {
    prompt: model.pricing?.prompt?.price,
    completion: model.pricing?.completion?.price,
  },
})
