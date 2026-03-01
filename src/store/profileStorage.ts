import type { StateStorage } from 'zustand/middleware'

const NORMALIZE_REGEX = /[^a-z0-9]+/g
export const DEFAULT_PROFILE_ID = 'guest'

let activeProfileId = DEFAULT_PROFILE_ID

export const normalizeProfileId = (value: string | null | undefined) => {
  if (!value) return DEFAULT_PROFILE_ID
  const normalized = value.trim().toLowerCase().replace(NORMALIZE_REGEX, '-')
  return normalized || DEFAULT_PROFILE_ID
}

const buildStorageKey = (name: string) => `${name}::${activeProfileId}`

export const setActiveProfileStorageKey = (profile: string | null | undefined) => {
  activeProfileId = normalizeProfileId(profile)
}

export const getActiveProfileStorageKey = () => activeProfileId

export const profileStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(buildStorageKey(name))
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(buildStorageKey(name), value)
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(buildStorageKey(name))
  },
}
