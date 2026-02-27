import { useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import { CalendarDays } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { SectionHeader } from '../components/SectionHeader'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { parseScheduleFromText } from '../services/mealAI'

export const SchedulePage = () => {
  const { schedule, family, actions, settings, guestApiKey } = useAppStore()
  const [selectedDayId, setSelectedDayId] = useState(schedule[0]?.id ?? '')
  const [textInput, setTextInput] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [eventDrafts, setEventDrafts] = useState<Record<string, { summary: string; start: string; end: string }>>({})

  const selectedDay = useMemo(
    () => schedule.find((day) => day.id === selectedDayId) ?? schedule[0],
    [schedule, selectedDayId],
  )

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

  const weekStart = schedule[0]?.date ?? new Date().toISOString().split('T')[0]

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
  )
}
