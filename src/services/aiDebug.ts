import type { OpenRouterModelMetadata } from '../types/app'

export type AILogSeverity = 'info' | 'warn' | 'error'

export interface AIConfigSnapshot {
  model: string
  modelLabel?: string
  provider: 'openrouter' | 'proxy'
  hyperparameters?: {
    temperature?: number
    maxTokens?: number
    stopSequence?: string | string[]
  }
  modelSettings?: {
    maxContextLength?: number
    supportsJsonResponse?: boolean
  }
  userContext?: {
    userId?: string
    sessionId?: string
  }
}

interface AILogContext {
  source: string
  severity?: AILogSeverity
  userId?: string
  sessionId?: string
}

const toBoolean = (value: string | undefined) => {
  if (!value) return undefined
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

const isVerboseLoggingEnabled = () => {
  const envToggle = toBoolean(import.meta.env.VITE_AI_VERBOSE_LOGGING)
  if (typeof envToggle === 'boolean') return envToggle

  if (typeof window !== 'undefined') {
    const runtimeOverride = toBoolean(window.localStorage.getItem('ai:debug:verbose') ?? undefined)
    if (typeof runtimeOverride === 'boolean') return runtimeOverride
  }

  return import.meta.env.DEV
}

const safeSerialize = (payload: unknown) => {
  try {
    return JSON.parse(JSON.stringify(payload))
  } catch {
    return payload
  }
}

const withPrefix = (ctx: AILogContext, tag: string) => {
  const level = (ctx.severity ?? 'info').toUpperCase()
  const user = ctx.userId ? `[User ID: ${ctx.userId}]` : ''
  const session = ctx.sessionId ? `[Session ID: ${ctx.sessionId}]` : ''
  return `${user}${session}[${tag}] [${level}] [Function: ${ctx.source}]`
}

const emit = (ctx: AILogContext, tag: string, message: string, details?: unknown) => {
  if (!isVerboseLoggingEnabled() || typeof console === 'undefined') return

  const timestamp = new Date().toISOString()
  const prefix = withPrefix(ctx, tag)
  const payload = details ? safeSerialize(details) : undefined

  if (ctx.severity === 'error') {
    console.error(`${timestamp} ${prefix} ${message}`, payload ?? '')
    return
  }
  if (ctx.severity === 'warn') {
    console.warn(`${timestamp} ${prefix} ${message}`, payload ?? '')
    return
  }
  console.info(`${timestamp} ${prefix} ${message}`, payload ?? '')
}

export const aiDebug = {
  isEnabled: isVerboseLoggingEnabled,
  logConfig(source: string, config: AIConfigSnapshot) {
    emit({ source, severity: 'info', ...config.userContext }, 'AI Config', 'Configuration snapshot', config)
  },
  logCallStart({
    source,
    request,
    userContext,
  }: {
    source: string
    request: unknown
    userContext?: AIConfigSnapshot['userContext']
  }) {
    emit({ source, severity: 'info', ...userContext }, 'AI Call', 'Request Sent', request)
  },
  logCallResult({
    source,
    response,
    status,
    durationMs,
    userContext,
  }: {
    source: string
    response: unknown
    status: number
    durationMs: number
    userContext?: AIConfigSnapshot['userContext']
  }) {
    emit(
      { source, severity: 'info', ...userContext },
      'AI Call',
      `Response Received: status=${status} duration=${durationMs.toFixed(2)}ms`,
      response,
    )
    emit(
      { source, severity: 'info', ...userContext },
      'AI Performance',
      `Request Processing Time: ${durationMs.toFixed(2)}ms`,
    )
  },
  logError({
    source,
    message,
    error,
    severity = 'error',
    userContext,
  }: {
    source: string
    message: string
    error?: unknown
    severity?: AILogSeverity
    userContext?: AIConfigSnapshot['userContext']
  }) {
    const stack = error instanceof Error ? error.stack : undefined
    emit(
      { source, severity, ...userContext },
      'AI Error',
      `Message: ${message}`,
      {
        error,
        stack,
      },
    )
  },
}

export const createAIConfigSnapshot = ({
  model,
  modelLabel,
  supportsJsonResponse,
  provider,
  metadata,
}: {
  model: string
  modelLabel?: string
  supportsJsonResponse?: boolean
  provider: 'openrouter' | 'proxy'
  metadata?: OpenRouterModelMetadata
}): AIConfigSnapshot => ({
  model,
  modelLabel,
  provider,
  hyperparameters: {
    temperature: undefined,
    maxTokens: undefined,
    stopSequence: undefined,
  },
  modelSettings: {
    maxContextLength: metadata?.contextLength,
    supportsJsonResponse,
  },
})
