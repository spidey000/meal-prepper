import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { nanoid } from 'nanoid'
import { useAppStore } from '../store/appStore'
import { SectionHeader } from '../components/SectionHeader'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Trash2, Pencil } from 'lucide-react'
import type { FamilyMember } from '../types/app'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(0).max(120).nullable().optional(),
  allergies: z.string().optional(),
  dietaryPreferences: z.string().optional(),
  activityLevel: z.enum(['sedentary', 'active', 'very-active']),
  notes: z.string().optional(),
  weightKg: z.number().nullable().optional(),
  heightCm: z.number().nullable().optional(),
  eatsLunchAtHome: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

const defaultValues: FormValues = {
  name: '',
  age: undefined,
  allergies: '',
  dietaryPreferences: '',
  activityLevel: 'active',
  notes: '',
  weightKg: undefined,
  heightCm: undefined,
  eatsLunchAtHome: true,
}

export const FamilyPage = () => {
  const { family, actions } = useAppStore()
  const [editing, setEditing] = useState<FamilyMember | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues })

  useEffect(() => {
    if (editing) {
      reset({
        name: editing.name,
        age: editing.age,
        allergies: editing.allergies.join(', '),
        dietaryPreferences: editing.dietaryPreferences.join(', '),
        activityLevel: editing.activityLevel,
        notes: editing.notes ?? '',
        weightKg: editing.weightKg,
        heightCm: editing.heightCm,
        eatsLunchAtHome: editing.schoolSchedule?.eatsLunchAtHome ?? true,
      })
    } else {
      reset(defaultValues)
    }
  }, [editing, reset])

  const onSubmit = handleSubmit((values) => {
    const payload: FamilyMember = {
      id: editing?.id ?? nanoid(),
      name: values.name,
      age: values.age ?? undefined,
      allergies: values.allergies?.split(',').map((a) => a.trim()).filter(Boolean) ?? [],
      dietaryPreferences:
        values.dietaryPreferences?.split(',').map((p) => p.trim()).filter(Boolean) ?? [],
      activityLevel: values.activityLevel,
      weightKg: values.weightKg ?? undefined,
      heightCm: values.heightCm ?? undefined,
      schoolSchedule: {
        eatsLunchAtHome: values.eatsLunchAtHome,
      },
      notes: values.notes,
    }

    if (editing) {
      actions.updateMember(payload)
    } else {
      const { id: _omit, ...rest } = payload
      void _omit
      actions.addMember(rest)
    }
    setEditing(null)
    reset(defaultValues)
  })

  const sortedFamily = useMemo(() => [...family].sort((a, b) => a.name.localeCompare(b.name)), [family])

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Family profiles"
        description="Add each household member so the AI understands allergies, preferences, and schedules."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm font-medium text-slate-600">Name</label>
              <Input {...register('name')} placeholder="Alex" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Age</label>
                <Input type="number" {...register('age', { valueAsNumber: true })} placeholder="10" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Activity level</label>
                <Select {...register('activityLevel')}>
                  <option value="sedentary">Sedentary</option>
                  <option value="active">Active</option>
                  <option value="very-active">Very active</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Weight (kg)</label>
                <Input type="number" step="0.1" {...register('weightKg', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Height (cm)</label>
                <Input type="number" step="0.1" {...register('heightCm', { valueAsNumber: true })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Allergies (comma separated)</label>
              <Input {...register('allergies')} placeholder="Peanuts, dairy" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Dietary preferences</label>
              <Input {...register('dietaryPreferences')} placeholder="Vegetarian, gluten-free" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Notes</label>
              <Textarea rows={3} {...register('notes')} placeholder="Prefers spicy dinners" />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                {editing ? 'Update member' : 'Add member'}
              </Button>
              {editing && (
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>
        <div className="lg:col-span-2 space-y-4">
          {sortedFamily.length === 0 && (
            <Card>
              <p className="text-sm text-slate-500">
                No family members yet. Add at least one person to unlock the AI meal planner.
              </p>
            </Card>
          )}
          {sortedFamily.map((member) => (
            <Card key={member.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">{member.name}</p>
                <p className="text-sm text-slate-500">
                  {member.activityLevel.replace('-', ' ')} · {member.allergies.join(', ') || 'No allergies'}
                </p>
                {member.dietaryPreferences.length > 0 && (
                  <p className="text-sm text-slate-500">Diet: {member.dietaryPreferences.join(', ')}</p>
                )}
                {member.notes && <p className="mt-2 text-sm text-slate-600">{member.notes}</p>}
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setEditing(member)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button variant="ghost" onClick={() => actions.removeMember(member.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
