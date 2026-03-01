import { createContext } from 'react'

export type AuthStatus = 'loading' | 'ready'

export interface LocalProfile {
  id: string
  label: string
}

export interface AuthContextValue {
  status: AuthStatus
  mode: 'guest' | 'profile'
  profile: LocalProfile | null
  profiles: LocalProfile[]
  createProfile: (label: string) => void
  selectProfile: (id: string) => void
  removeProfile: (id: string) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
