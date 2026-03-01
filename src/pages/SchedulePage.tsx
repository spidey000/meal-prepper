import { useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import { AlertCircle, CalendarDays, RefreshCcw } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { SectionHeader } from '../components/SectionHeader'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { parseScheduleFromText } from '../services/mealAI'
import { fetchCalendarWeek } from '../services/calendar'

export const SchedulePage = () => {
  const { schedule, family, actions, settings, guestApiKey, lastCalendarSync } = useAppStore()
  const [selectedDayId, setSelectedDayId] = useState(schedule[0]?.id ?? '')
  const [textInput, setTextInput] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [eventDrafts, setEventDrafts] = useState<Record<string, { summary: string; start: string; end: string }>>({})

  const selectedDay = useMemo(
    () => schedule.find((day) => day.id === selectedDayId) ?? schedule[0],
    [schedule, selectedDayId],
  )
  const calendarSync = settings.calendarSync
  const isCalendarConnected = calendarSync?.connected ?? false
  const lastSyncDisplay = lastCalendarSync ? new Date(lastCalendarSync).toLocaleString() : 'Never'
  const selectedFreeBlocks = selectedDay?.freeBlocks ?? []
  const isBatchCookingDay = selectedDay?.isBatchCookingDay ?? false

  const formatTimeValue = (value: string) => {
    if (!value) return ''
    if (value.includes('T')) {
      const parsed = new Date(value)
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    }
    return value
  }

  const formatFreeBlock = (start: string, end: string) => `${formatTimeValue(start)} → ${formatTimeValue(end)}`

  const weekStart = schedule[0]?.date ?? new Date().toISOString().split('T')[0]

  const updateAvailability = (field: 'lunchMinutes' | 'dinnerMinutes', value: number) => {
    if (!selectedDay) return
    actions.upsertScheduleDay({
      ...selectedDay,
      availability: { ...selectedDay.availability, [field]: value },
    })
  }

  const toggleDiner = (meal: 'lunch' | 'dinner', memberId: string) => {
    if (!selectedDay) return
    const diners = selectedDay.diners[meal]
    const next = diners.includes(memberId)
      ? diners.filter((id) => id !== memberId)
      : [...diners, memberId]
    actions.upsertScheduleDay({
      ...selectedDay,
      diners: { ...selectedDay.diners, [meal]: next },
    })
  }

  const toggleBatchCookingDay = () => {
    if (!selectedDay) return
    actions.toggleBatchCookingDay(selectedDay.id)
  }

  const handleAddEvent = (dayId: string) => {
    const day = schedule.find((d) => d.id === dayId)
    if (!day) return
    const draft = eventDrafts[dayId]
    if (!draft || !draft.summary || !draft.start || !draft.end) return
    const nextDay = {
      ...day,
      events: [...day.events, { ...draft, id: nanoid() }],
    }
    actions.upsertScheduleDay(nextDay)
    setEventDrafts((prev) => ({ ...prev, [dayId]: { summary: '', start: '', end: '' } }))
  }

  const handleImportCalendar = async () => {
    if (!isCalendarConnected) return
    try {
      setSyncError(null)
      setIsSyncingCalendar(true)
      const { days, lastSyncedAt } = await fetchCalendarWeek(weekStart)
      actions.applyCalendarImport(days)
      actions.setLastCalendarSync(lastSyncedAt ?? new Date().toISOString())
    } catch (error) {
      console.error(error)
      setSyncError(error instanceof Error ? error.message : 'Unable to sync Google Calendar.')
    } finally {
      setIsSyncingCalendar(false)
    }
  }

  const handleParseText = async () => {
    if (!textInput.trim()) return
    try {
      setIsParsing(true)
      const parsed = await parseScheduleFromText(textInput, weekStart, {
        apiKey: settings.apiKey ?? guestApiKey,
        model: settings.aiModel,
      })
      parsed.forEach((day) => actions.upsertScheduleDay({
        ...day,
        id: schedule.find((existing) => existing.date === day.date)?.id ?? nanoid(),
      }))
      setTextInput('')
    } catch (error) {
      console.error(error)
      alert('Unable to parse schedule with AI. Please verify your API key.')
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Weekly schedule"
        description="Sync your events so the AI knows when to recommend quick meals or batch cooking."
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setSelectedDayId(schedule[0]?.id ?? '')}>
              Jump to Monday
            </Button>
            <Button onClick={handleParseText} disabled={isParsing || !textInput.trim()}>
              {isParsing ? 'Parsing…' : 'Parse text schedule'}
            </Button>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap gap-3 border-b border-slate-100 pb-4">
            {schedule.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDayId(day.id)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  selectedDay?.id === day.id
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-500 hover:text-slate-900'
                }`}
              >
                {day.dayOfWeek}
              </button>
            ))}
          </div>
          {selectedDay && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Cooking availability</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <span className="text-sm font-medium text-slate-600">Lunch minutes</span>
                    <input
                      type="range"
                      min={10}
                      max={120}
                      step={5}
                      value={selectedDay.availability.lunchMinutes}
                      onChange={(e) => updateAvailability('lunchMinutes', Number(e.target.value))}
                    />
                    <span className="text-lg font-semibold text-slate-900">
                      {selectedDay.availability.lunchMinutes} min
                    </span>
                  </label>
                  <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <span className="text-sm font-medium text-slate-600">Dinner minutes</span>
                    <input
                      type="range"
                      min={10}
                      max={120}
                      step={5}
                      value={selectedDay.availability.dinnerMinutes}
                      onChange={(e) => updateAvailability('dinnerMinutes', Number(e.target.value))}
                    />
                    <span className="text-lg font-semibold text-slate-900">
                      {selectedDay.availability.dinnerMinutes} min
                    </span>
                  </label>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Batch cooking day</p>
                      <p className="text-xs text-slate-500">Scale recipes and cook ahead when time allows.</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input type="checkbox" checked={isBatchCookingDay} onChange={toggleBatchCookingDay} />
                      {isBatchCookingDay ? 'On' : 'Off'}
                    </label>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-600">Imported free windows</p>
                  {selectedFreeBlocks.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      {selectedFreeBlocks.map((block, index) => (
                        <li key={`${block.start}-${block.end}-${index}`} className="flex items-center justify-between">
                          <span>{formatFreeBlock(block.start, block.end)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">Sync Google Calendar to detect open prep time.</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Who is eating?</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {(['lunch', 'dinner'] as const).map((meal) => (
                    <div key={meal} className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm font-medium text-slate-600">{meal === 'lunch' ? 'Lunch' : 'Dinner'} diners</p>
                      <div className="mt-3 space-y-2">
                        {family.map((member) => (
                          <label key={member.id} className="flex items-center gap-2 text-sm text-slate-600">
                            <input
                              type="checkbox"
                              checked={selectedDay.diners[meal].includes(member.id)}
                              onChange={() => toggleDiner(meal, member.id)}
                            />
                            {member.name}
                          </label>
                        ))}
                        {family.length === 0 && (
                          <p className="text-sm text-slate-400">Add family profiles first.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Events</h3>
                <div className="space-y-3">
                  {selectedDay.events.length === 0 && (
                    <p className="text-sm text-slate-500">No events logged for this day.</p>
                  )}
                  {selectedDay.events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{event.summary}</p>
                        <p className="text-xs text-slate-500">
                          {event.start} → {event.end}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => actions.removeScheduleEvent(selectedDay.id, event.id)}
                        className="text-sm"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <Input
                    placeholder="Drop-off"
                    value={eventDrafts[selectedDay.id]?.summary ?? ''}
                    onChange={(e) =>
                      setEventDrafts((prev) => ({
                        ...prev,
                        [selectedDay.id]: {
                          summary: e.target.value,
                          start: prev[selectedDay.id]?.start ?? '',
                          end: prev[selectedDay.id]?.end ?? '',
                        },
                      }))
                    }
                  />
                  <Input
                    type="time"
                    value={eventDrafts[selectedDay.id]?.start ?? ''}
                    onChange={(e) =>
                      setEventDrafts((prev) => ({
                        ...prev,
                        [selectedDay.id]: {
                          summary: prev[selectedDay.id]?.summary ?? '',
                          start: e.target.value,
                          end: prev[selectedDay.id]?.end ?? '',
                        },
                      }))
                    }
                  />
                  <Input
                    type="time"
                    value={eventDrafts[selectedDay.id]?.end ?? ''}
                    onChange={(e) =>
                      setEventDrafts((prev) => ({
                        ...prev,
                        [selectedDay.id]: {
                          summary: prev[selectedDay.id]?.summary ?? '',
                          start: prev[selectedDay.id]?.start ?? '',
                          end: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <Button className="mt-3" variant="secondary" onClick={() => handleAddEvent(selectedDay.id)}>
                  Add event
                </Button>
              </div>
            </div>
          )}
        </Card>
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <RefreshCcw className="h-4 w-4" /> Google Calendar sync
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Pull your busy/free windows from Google Calendar so recipe durations adjust automatically.
            </p>
            <dl className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <dt>Status</dt>
                <dd className={`font-medium ${isCalendarConnected ? 'text-green-600' : 'text-orange-600'}`}>
                  {isCalendarConnected ? 'Connected to Google' : 'Not connected'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Last sync</dt>
                <dd>{lastSyncDisplay}</dd>
              </div>
            </dl>
            <Button
              className="mt-4 w-full"
              onClick={handleImportCalendar}
              disabled={!isCalendarConnected || isSyncingCalendar}
            >
              {isSyncingCalendar ? 'Syncing calendar…' : 'Import calendar week'}
            </Button>
            {!isCalendarConnected && (
              <p className="mt-2 text-xs text-orange-600">
                Connect through Settings → Calendar sync before importing events.
              </p>
            )}
            {syncError && (
              <p className="mt-2 flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="h-4 w-4" /> {syncError}
              </p>
            )}
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <CalendarDays className="h-4 w-4" /> Quick text import
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Paste your schedule ("Mon 8:00 school drop-off") and let the AI convert it into structured availability.
            </p>
            <Textarea
              rows={12}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Mon 8:00-16:00 Work for Lucia
Tue 15:00-18:00 Soccer practice for Max"
              className="mt-4"
            />
            <Button className="mt-4 w-full" onClick={handleParseText} disabled={isParsing || !textInput.trim()}>
              {isParsing ? 'Parsing schedule…' : 'Parse schedule text'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
