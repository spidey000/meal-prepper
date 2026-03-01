import type { Handler } from '@netlify/functions'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models'
const JSON_RESPONSE_FORMAT = { type: 'json_object' }

const responseFormatSupportedModels = new Set<string>()
let responseFormatSupportStatus: 'idle' | 'loading' | 'loaded' | 'failed' = 'idle'
let responseFormatFetchPromise: Promise<void> | null = null

const shouldRetryWithoutResponseFormat = (status: number, message: string) => {
  if (status !== 400) return false
  const normalized = message.toLowerCase()
  return normalized.includes('response_format') && normalized.includes('not support')
}

interface ModelsCapabilityResponse {
  data?: { id?: string }[]
}

const ensureResponseFormatSupportLoaded = async (apiKey: string) => {
  if (responseFormatSupportStatus === 'loaded') return
  if (responseFormatFetchPromise) {
    await responseFormatFetchPromise
    return
  }
  responseFormatFetchPromise = (async () => {
    try {
      responseFormatSupportStatus = 'loading'
      const response = await fetch(
        `${OPENROUTER_MODELS_URL}?supported_parameters=response_format`,
        {
          method: 'GET',
          headers: buildHeaders(apiKey),
        },
      )
      if (!response.ok) {
        responseFormatSupportStatus = 'failed'
        console.warn('OpenRouter capability lookup failed with status', response.status)
        return
      }
      const payload = (await response.json()) as ModelsCapabilityResponse
      payload.data?.forEach((model) => {
        if (model?.id) {
          responseFormatSupportedModels.add(model.id)
        }
      })
      responseFormatSupportStatus = 'loaded'
    } catch (error) {
      responseFormatSupportStatus = 'failed'
      console.warn('OpenRouter capability lookup errored', error)
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

const buildHeaders = (apiKey: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${apiKey}`,
  'HTTP-Referer': process.env.OPENROUTER_REFERRER ?? 'https://meal-prepper.netlify.app',
  'X-Title': process.env.OPENROUTER_TITLE ?? 'AI Family Meal Planner',
})

const forwardToOpenRouter = async ({
  apiKey,
  model,
  messages,
  useJsonFormat,
}: {
  apiKey: string
  model: string
  messages: unknown[]
  useJsonFormat: boolean
}) => {
  return fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify({
      model,
      messages,
      ...(useJsonFormat ? { response_format: JSON_RESPONSE_FORMAT } : {}),
    }),
  })
}

const formatOpenRouterSuccess = async (response: Response) => {
  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    return { statusCode: 500, body: 'Malformed OpenRouter response' }
  }
  return {
    statusCode: 200,
    body: content,
  }
}

export const handler: Handler = async (event) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: 'Missing OPENROUTER_API_KEY env var' }
    }

    const body = JSON.parse(event.body ?? '{}')
    const messages = body.messages
    const model = body.model ?? 'openrouter/anthropic/claude-3.5-sonnet'
    const supportsJsonHint: boolean | undefined =
      typeof body.supportsJsonResponse === 'boolean' ? body.supportsJsonResponse : undefined

    if (!Array.isArray(messages)) {
      return { statusCode: 400, body: 'Missing messages array' }
    }

    const preferJson = await shouldRequestJsonFormat({
      apiKey,
      modelId: model,
      hint: supportsJsonHint,
    })
    const firstAttempt = await forwardToOpenRouter({
      apiKey,
      model,
      messages,
      useJsonFormat: preferJson,
    })

    if (firstAttempt.ok) {
      return formatOpenRouterSuccess(firstAttempt)
    }

    const initialError = await firstAttempt.text()
    if (shouldRetryWithoutResponseFormat(firstAttempt.status, initialError)) {
      const retryResponse = await forwardToOpenRouter({
        apiKey,
        model,
        messages,
        useJsonFormat: false,
      })
      if (retryResponse.ok) {
        return formatOpenRouterSuccess(retryResponse)
      }
      const retryText = await retryResponse.text()
      return { statusCode: retryResponse.status, body: retryText }
    }

    return { statusCode: firstAttempt.status, body: initialError }
  } catch (error) {
    console.error(error)
    return { statusCode: 500, body: 'AI proxy failure' }
  }
}
