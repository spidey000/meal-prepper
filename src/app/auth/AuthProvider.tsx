import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseClient } from '../../lib/supabaseClient'

type AuthStatus = 'loading' | 'authenticated' | 'guest'

interface AuthContextValue {
  status: AuthStatus
  session: Session | null
  user: User | null
  mode: 'guest' | 'user'
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (!supabase) {
      setStatus('guest')
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setStatus(data.session ? 'authenticated' : 'guest')
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setStatus(newSession ? 'authenticated' : 'guest')
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  const value = useMemo<AuthContextValue>(() => ({
    status,
    session,
    user: session?.user ?? null,
    mode: status === 'authenticated' ? 'user' : 'guest',
    signInWithGoogle: async () => {
      if (!supabase) {
        throw new Error('Supabase not configured')
      }
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    },
    signOut: async () => {
      if (!supabase) return
      await supabase.auth.signOut()
    },
  }), [session, status, supabase])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
