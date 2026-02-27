import { NavLink, Outlet } from 'react-router-dom'
import { Users, CalendarDays, Utensils, ShoppingBag, Settings, Sparkles } from 'lucide-react'
import { useAuth } from '../../app/auth/AuthProvider'
import { Button } from '../ui/Button'

const navItems = [
  { label: 'Meal Plan', icon: Utensils, to: '/meal-plan' },
  { label: 'Family', icon: Users, to: '/family' },
  { label: 'Schedule', icon: CalendarDays, to: '/schedule' },
  { label: 'Shopping List', icon: ShoppingBag, to: '/shopping-list' },
  { label: 'Settings', icon: Settings, to: '/settings' },
]

export const AppLayout = () => {
  const { mode, status, user, signInWithGoogle, signOut } = useAuth()

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
            <p className="text-sm font-medium text-slate-700">{mode === 'guest' ? 'Guest Mode' : user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {mode === 'guest' ? (
              <Button variant="secondary" onClick={signInWithGoogle} disabled={status === 'loading'}>
                Sign in with Google
              </Button>
            ) : (
              <Button variant="ghost" onClick={signOut}>
                Sign out
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
