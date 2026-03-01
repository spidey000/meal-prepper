import type { Handler } from '@netlify/functions'

interface WeeklyScheduleDayPayload {
  id: string
  date: string
  dayOfWeek: string
  events: Array<{ id: string; summary: string; start: string; end: string }>
  availability: { lunchMinutes: number; dinnerMinutes: number }
  freeBlocks: Array<{ start: string; end: string }>
  calendarSource: 'manual' | 'google' | 'ics'
  isBatchCookingDay: boolean
  diners: { lunch: string[]; dinner: string[] }
}

const buildEmptyWeek = (weekStart: string): WeeklyScheduleDayPayload[] => {
  const startDate = new Date(weekStart)
  if (Number.isNaN(startDate.getTime())) {
    throw new Error('Invalid weekStart provided')
  }
  const normalizedStart = new Date(startDate)
  for (let offset = 0; offset < 7; offset += 1) {
    if (normalizedStart.getDay() === 1) break
    normalizedStart.setDate(normalizedStart.getDate() - 1)
  }
  return Array.from({ length: 7 }).map((_, index) => {
    const current = new Date(normalizedStart)
    current.setDate(normalizedStart.getDate() + index)
    const iso = current.toISOString().split('T')[0]
    return {
      id: `calendar-day-${iso}`,
      date: iso,
      dayOfWeek: current.toLocaleDateString('en-US', { weekday: 'long' }),
      events: [],
      availability: { lunchMinutes: 45, dinnerMinutes: 45 },
      freeBlocks: [],
      calendarSource: 'google',
      isBatchCookingDay: false,
      diners: { lunch: [], dinner: [] },
    }
  })
}

const json = (payload: unknown, statusCode = 200) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json({ message: 'Method Not Allowed' }, 405)
  }

  try {
    const body = JSON.parse(event.body ?? '{}') as { action?: string; weekStart?: string }
    switch (body.action) {
      case 'fetchWeek': {
        if (!body.weekStart) {
          throw new Error('Missing weekStart')
        }
        const days = buildEmptyWeek(body.weekStart)
        return json({ days, lastSyncedAt: new Date().toISOString() })
      }
      case 'syncSessions': {
        return json({ success: true })
      }
      default:
        return json({ message: 'Unknown calendar action' }, 400)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Calendar handler failure'
    return json({ message }, 500)
  }
}
