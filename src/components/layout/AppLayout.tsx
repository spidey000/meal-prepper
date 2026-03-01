import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Users,
  CalendarDays,
  Utensils,
  ShoppingBag,
  Settings,
  Sparkles,
  ChefHat,
  Star,
  PanelLeft,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../app/auth/useAuth'
import { useAppStore } from '../../store/appStore'
import { Button } from '../ui/Button'

const navItems = [
  { label: 'Meal Plan', icon: Utensils, to: '/meal-plan' },
  { label: 'Family', icon: Users, to: '/family' },
  { label: 'Schedule', icon: CalendarDays, to: '/schedule' },
  { label: 'Shopping List', icon: ShoppingBag, to: '/shopping-list' },
  { label: 'Favorites', icon: Star, to: '/favorites' },
  { label: 'Settings', icon: Settings, to: '/settings' },
]

export const AppLayout = () => {
  const { status, profile, profiles, createProfile, selectProfile, signOut } = useAuth()
  const location = useLocation()

  const compact = useAppStore((state) => state.settings.appPreferences?.compactMode ?? false)
  const sidebarCollapsed = useAppStore(
    (state) => state.settings.appPreferences?.sidebarCollapsed ?? false,
  )
  const sidebarMobileOpen = useAppStore(
    (state) => state.settings.appPreferences?.sidebarMobileOpen ?? false,
  )

  const toggleSidebar = useAppStore((state) => state.actions.toggleSidebar)
  const setSidebarMobileOpen = useAppStore((state) => state.actions.setSidebarMobileOpen)

  // Cerrar sidebar móvil al cambiar ruta
  useEffect(() => {
    setSidebarMobileOpen(false)
    // Solo dependency: location.pathname cambia cuando la ruta cambia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

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

  const handleToggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar()
    } else {
      setSidebarMobileOpen(!sidebarMobileOpen)
    }
  }

  const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true

  return (
    <div className={clsx('flex min-h-screen', compact && 'text-sm')}>
      {/* Mobile Overlay */}
      {!isDesktop && sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          // Base styles
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-surface-700/50 bg-surface-900/80 backdrop-blur-md transition-all duration-300 ease-in-out will-change-transform',
          // Desktop: collapse/expand
          'lg:relative lg:z-auto',
          sidebarCollapsed && isDesktop ? 'lg:w-20' : 'lg:w-64',
          // Mobile: slide in/out
          sidebarMobileOpen && !isDesktop ? 'translate-x-0' : '-translate-x-full',
          compact ? (sidebarCollapsed && isDesktop ? 'lg:px-4' : 'lg:px-6') : 'lg:px-6',
          compact ? 'px-4 py-6' : 'px-6 py-8',
        )}
      >
        {/* Logo */}
        <div
          className={clsx(
            'flex items-center gap-3',
            compact && sidebarCollapsed && isDesktop && 'lg:justify-center',
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ember-500 to-ember-600 shadow-glow">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          {(!compact || !sidebarCollapsed || !isDesktop) && (
            <div>
              <h1 className="font-display text-lg font-semibold text-surface-100">Meal Prepper</h1>
              <p className="text-xs text-surface-500">AI Family Planner</p>
            </div>
          )}
        </div>

        {/* Close button for mobile */}
        {!isDesktop && (
          <button
            onClick={() => setSidebarMobileOpen(false)}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-800 hover:text-surface-200"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Navigation */}
        <nav
          className={clsx(
            'mt-auto space-y-1.5',
            compact && sidebarCollapsed && isDesktop ? 'lg:mt-8' : 'lg:mt-10',
          )}
        >
          {navItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200',
                  compact && sidebarCollapsed && isDesktop
                    ? 'lg:px-3 lg:py-2.5'
                    : 'lg:px-4 lg:py-3',
                  isActive
                    ? 'border border-ember-500/20 bg-ember-500/10 text-ember-400'
                    : 'border border-transparent text-surface-400 hover:bg-surface-800/60 hover:text-surface-200',
                )
              }
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <item.icon
                className={clsx(
                  'h-4 w-4 transition-transform duration-200',
                  'group-hover:scale-110',
                  compact && sidebarCollapsed && isDesktop ? 'lg:mx-auto' : '',
                )}
              />
              {(!compact || !sidebarCollapsed || !isDesktop) && <span>{item.label}</span>}

              {/* Tooltip for collapsed desktop */}
              {compact && sidebarCollapsed && isDesktop && (
                <div className="absolute left-full z-10 ml-2 hidden whitespace-nowrap rounded-md border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-surface-200 group-hover:block">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Pro tip */}
        <div
          className={clsx(
            'mt-auto rounded-2xl border border-surface-700/30 bg-gradient-to-br from-surface-800/60 to-surface-800/30 p-4',
            compact ? 'p-3' : 'p-4',
          )}
        >
          <div className="flex items-center gap-2 text-ember-400">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm font-medium">Pro tip</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-surface-500">
            Update your schedule each week so the AI can balance batch cooking and busy days.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header
          className={clsx(
            'flex flex-wrap items-center justify-between gap-4 border-b border-surface-700/50 bg-surface-900/60 px-6 py-4 backdrop-blur-md',
            compact ? 'px-4 py-3' : 'px-6 py-4',
          )}
        >
          <div className="flex items-center gap-4">
            {/* Sidebar toggle button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleSidebar}
              className={clsx('lg:hidden', sidebarMobileOpen ? 'lg:opacity-0' : '')}
              aria-label={sidebarMobileOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarMobileOpen ? <X className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>

            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-surface-500">
                  Current workspace
                </p>
                <p className="text-sm font-medium text-surface-200">
                  {profile ? profile.label : 'Guest mode'}
                </p>
                {status === 'loading' && (
                  <p className="text-xs text-surface-500">Loading profiles…</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              className={clsx(
                'rounded-xl border border-surface-700 bg-surface-800/50 px-3 py-2 text-sm text-surface-200',
                'focus:border-ember-500/50 focus:outline-none focus:ring-2 focus:ring-ember-500/50',
                'transition-all duration-200',
                compact ? 'px-2.5 py-1.5' : 'px-3 py-2',
              )}
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
            <Button
              variant="secondary"
              onClick={handleCreateProfile}
              disabled={status === 'loading'}
            >
              New profile
            </Button>
            {profile && (
              <Button variant="ghost" onClick={signOut}>
                Switch to guest
              </Button>
            )}

            {/* Desktop sidebar toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="hidden lg:flex"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <PanelLeft
                className={clsx(
                  'h-4 w-4 transition-transform duration-300',
                  sidebarCollapsed && 'rotate-180',
                )}
              />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className={clsx('flex-1', compact ? 'px-3 py-5 sm:px-5' : 'px-4 py-8 sm:px-8')}>
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
