import type { Handler } from '@netlify/functions'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export const handler: Handler = async (event) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return { statusCode: 500, body: 'Missing OPENROUTER_API_KEY env var' }
    }

    const body = JSON.parse(event.body ?? '{}')
    const messages = body.messages
    const model = body.model ?? 'openrouter/anthropic/claude-3.5-sonnet'

    if (!Array.isArray(messages)) {
      return { statusCode: 400, body: 'Missing messages array' }
    }

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.OPENROUTER_REFERRER ?? 'https://meal-prepper.netlify.app',
        'X-Title': process.env.OPENROUTER_TITLE ?? 'AI Family Meal Planner',
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return { statusCode: response.status, body: text }
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      return { statusCode: 500, body: 'Malformed OpenRouter response' }
    }

    return {
      statusCode: 200,
      body: content,
    }
  } catch (error) {
    console.error(error)
    return { statusCode: 500, body: 'AI proxy failure' }
  }
}
