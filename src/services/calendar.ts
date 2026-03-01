import type { PrepSession, WeeklyScheduleDay } from '../types/app'

const CALENDAR_FUNCTION = '/.netlify/functions/calendar-sync'

interface CalendarFetchResponse {
  days: WeeklyScheduleDay[]
  lastSyncedAt?: string
}

async function requestCalendarApi<T>(init?: RequestInit): Promise<T> {
  const response = await fetch(CALENDAR_FUNCTION, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...init,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Calendar sync failed: ${response.status} ${message}`)
  }

  return response.json()
}

export async function fetchCalendarWeek(weekStart: string): Promise<CalendarFetchResponse> {
  return requestCalendarApi<CalendarFetchResponse>({
    method: 'POST',
    body: JSON.stringify({ action: 'fetchWeek', weekStart }),
  })
}

export interface PrepSessionSyncPayload {
  weekStart: string
  sessions: PrepSession[]
}

export async function syncPrepSessions(payload: PrepSessionSyncPayload): Promise<{ success: boolean }> {
  return requestCalendarApi<{ success: boolean }>({
    method: 'POST',
    body: JSON.stringify({ action: 'syncSessions', ...payload }),
  })
}
