import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadResources } from './resources'
import { loadSearchArea, saveSearchArea, type SearchArea } from './searchArea'
import type { Locale } from './i18n'
import type { Resource } from './types'

interface AppState {
  locale: Locale
  setLocale: (locale: Locale) => void
  resources: Resource[]
  isSample: boolean
  loading: boolean
  error: string | null
  reload: () => void
  /** Where the reader is searching. Opt-in, remembered in their browser. */
  area: SearchArea
  setArea: (area: SearchArea) => void
  /**
   * The reader's coordinates, if they pressed auto-detect this visit. Held in
   * memory only and deliberately never persisted: it powers the distance on a
   * card and is gone when the tab closes.
   */
  position: { lat: number; lng: number } | null
  setPosition: (position: { lat: number; lng: number } | null) => void
}

const AppContext = createContext<AppState | null>(null)

const LOCALE_KEY = 'qcla.locale'

function initialLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(LOCALE_KEY)
    if (stored === 'en' || stored === 'es') return stored
  } catch {
    // Private mode or storage disabled. Fall through to the browser hint.
  }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [resources, setResources] = useState<Resource[]>([])
  const [isSample, setIsSample] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [area, setAreaState] = useState<SearchArea>(loadSearchArea)

  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)

  const setArea = useCallback((next: SearchArea) => {
    setAreaState(next)
    saveSearchArea(next)
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    document.documentElement.lang = next
    try {
      window.localStorage.setItem(LOCALE_KEY, next)
    } catch {
      // Remembering the choice is a convenience, not a requirement.
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    loadResources()
      .then((result) => {
        if (cancelled) return
        setResources(result.resources)
        setIsSample(result.isSample)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'load failed')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  const value = useMemo<AppState>(
    () => ({
      locale, setLocale, resources, isSample, loading, error, reload,
      area, setArea, position, setPosition,
    }),
    [locale, setLocale, resources, isSample, loading, error, reload, area, setArea, position],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppState {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
