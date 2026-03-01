import { NavLink, Outlet } from 'react-router-dom'
import { Users, CalendarDays, Utensils, ShoppingBag, Settings, Sparkles } from 'lucide-react'
import { useAuth } from '../../app/auth/useAuth'
import { Button } from '../ui/Button'

const navItems = [
  { label: 'Meal Plan', icon: Utensils, to: '/meal-plan' },
  { label: 'Family', icon: Users, to: '/family' },
  { label: 'Schedule', icon: CalendarDays, to: '/schedule' },
  { label: 'Shopping List', icon: ShoppingBag, to: '/shopping-list' },
  { label: 'Settings', icon: Settings, to: '/settings' },
]

export const AppLayout = () => {
  const { status, profile, profiles, createProfile, selectProfile, signOut } = useAuth()

  const handleCreateProfile = () => {
    const label = typeof window !== 'undefined' ? window.prompt('Choose a local username') : null
    if (label) {
      createProfile(label)
    }
  }

  const handleSelectProfile = (value: string) => {
    if (value === 'guest') {
      signOut()
      return
    }
    selectProfile(value)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white px-6 py-8 shadow-lg lg:flex">
        <div className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Sparkles className="h-6 w-6 text-brand-500" />
          AI Family Meal Planner
        </div>
        <nav className="mt-10 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white">
          <p className="text-sm font-medium">Pro tip</p>
          <p className="text-xs text-brand-100">
            Update your schedule each week so the AI can balance batch cooking and busy days.
          </p>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Current workspace</p>
            <p className="text-sm font-medium text-slate-700">{profile ? profile.label : 'Guest mode'}</p>
            {status === 'loading' && <p className="text-xs text-slate-400">Loading profiles…</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
              value={profile?.id ?? 'guest'}
              onChange={(event) => handleSelectProfile(event.target.value)}
              disabled={status === 'loading'}
            >
              <option value="guest">Guest workspace</option>
              {profiles.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.label}
                </option>
              ))}
            </select>
            <Button variant="secondary" onClick={handleCreateProfile} disabled={status === 'loading'}>
              New profile
            </Button>
            {profile && (
              <Button variant="ghost" onClick={signOut}>
                Switch to guest
              </Button>
            )}
          </div>
        </header>
        <main className="flex-1 bg-slate-50 px-4 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
