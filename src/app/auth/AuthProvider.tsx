import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext, type AuthContextValue, type AuthStatus, type LocalProfile } from './context'
import { normalizeProfileId, setActiveProfileStorageKey } from '../../store/profileStorage'
import { useAppStore } from '../../store/appStore'

const PROFILES_STORAGE_KEY = 'meal-prepper-local-profiles'
const STATE_STORAGE_BASE = 'meal-prepper-state'

interface StoredProfilesPayload {
  profiles: LocalProfile[]
  activeProfileId: string | null
}

const readStoredProfiles = (): StoredProfilesPayload => {
  if (typeof window === 'undefined') {
    return { profiles: [], activeProfileId: null }
  }
  try {
    const raw = window.localStorage.getItem(PROFILES_STORAGE_KEY)
    if (!raw) return { profiles: [], activeProfileId: null }
    const parsed = JSON.parse(raw) as StoredProfilesPayload
    return {
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
      activeProfileId: parsed.activeProfileId ?? null,
    }
  } catch (error) {
    console.warn('Unable to parse stored profiles', error)
    return { profiles: [], activeProfileId: null }
  }
}

const persistProfiles = (profiles: LocalProfile[], activeProfileId: string | null) => {
  if (typeof window === 'undefined') return
  const payload: StoredProfilesPayload = { profiles, activeProfileId }
  window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(payload))
}

const profileStateKey = (profileId: string | null) => `${STATE_STORAGE_BASE}::${normalizeProfileId(profileId)}`

const loadProfileState = (profileId: string | null) => {
  setActiveProfileStorageKey(profileId)
  if (typeof window === 'undefined') {
    useAppStore.getState().actions.resetAll()
    return
  }
  const persistedState = window.localStorage.getItem(profileStateKey(profileId))
  if (persistedState) {
    void useAppStore.persist?.rehydrate?.()
  } else {
    useAppStore.getState().actions.resetAll()
  }
}

const createProfileRecord = (label: string, existing: LocalProfile[]): LocalProfile => {
  const trimmed = label.trim()
  const baseId = normalizeProfileId(trimmed)
  let candidate = baseId
  let suffix = 1
  while (existing.some((profile) => profile.id === candidate)) {
    candidate = `${baseId}-${suffix++}`
  }
  return { id: candidate, label: trimmed }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [{ profiles, activeProfileId }, setProfileState] = useState<StoredProfilesPayload>(() => readStoredProfiles())
  useEffect(() => {
    loadProfileState(activeProfileId)
  }, [activeProfileId])

  const status: AuthStatus = 'ready'

  const applyStateChange = useCallback((nextProfiles: LocalProfile[], nextActiveId: string | null) => {
    setProfileState({ profiles: nextProfiles, activeProfileId: nextActiveId })
    persistProfiles(nextProfiles, nextActiveId)
  }, [])

  const createProfile = useCallback(
    (label: string) => {
      const trimmed = label.trim()
      if (!trimmed) return
      if (profiles.some((profile) => profile.label.toLowerCase() === trimmed.toLowerCase())) {
        return
      }
      const record = createProfileRecord(trimmed, profiles)
      applyStateChange([...profiles, record], record.id)
    },
    [applyStateChange, profiles],
  )

  const selectProfile = useCallback(
    (profileId: string) => {
      if (!profiles.some((profile) => profile.id === profileId)) return
      applyStateChange(profiles, profileId)
    },
    [applyStateChange, profiles],
  )

  const removeProfile = useCallback(
    (profileId: string) => {
      const nextProfiles = profiles.filter((profile) => profile.id !== profileId)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(profileStateKey(profileId))
      }
      const nextActive = activeProfileId === profileId ? null : activeProfileId
      applyStateChange(nextProfiles, nextActive)
    },
    [activeProfileId, applyStateChange, profiles],
  )

  const signOut = useCallback(() => {
    applyStateChange(profiles, null)
  }, [applyStateChange, profiles])

  const currentProfile = profiles.find((profile) => profile.id === activeProfileId) ?? null

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      mode: currentProfile ? 'profile' : 'guest',
      profile: currentProfile,
      profiles,
      createProfile,
      selectProfile,
      removeProfile,
      signOut,
    }),
    [createProfile, currentProfile, profiles, removeProfile, selectProfile, signOut, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
