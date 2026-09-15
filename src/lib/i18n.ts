import type { Resource } from './types'

export type Locale = 'en' | 'es'

/**
 * Picks the Spanish value when there is one, otherwise the English value.
 *
 * A blank string counts as absent: the research group sometimes saves a row
 * with an empty translation field, and rendering that would leave a person
 * staring at a gap where the name of the food bank should be. Never render
 * blank.
 */
export function localizedField(
  locale: Locale,
  english: string | null | undefined,
  spanish: string | null | undefined,
): string {
  if (locale === 'es') {
    const trimmed = spanish?.trim()
    if (trimmed) return trimmed
  }
  return english?.trim() ?? ''
}

export function resourceName(resource: Resource, locale: Locale): string {
  return localizedField(locale, resource.name, resource.name_es)
}

export function resourceDescription(resource: Resource, locale: Locale): string {
  return localizedField(locale, resource.description, resource.description_es)
}

export function resourceEligibility(resource: Resource, locale: Locale): string {
  return localizedField(locale, resource.eligibility, resource.eligibility_es)
}

/** True when the reader asked for Spanish but we only have English to show. */
export function isFallingBackToEnglish(
  locale: Locale,
  spanish: string | null | undefined,
): boolean {
  return locale === 'es' && !spanish?.trim()
}

type Dictionary = Record<string, { en: string; es: string }>

const STRINGS: Dictionary = {
  appName: { en: 'Quick Connect LA', es: 'Quick Connect LA' },
  tagline: {
    en: 'Essential resources across Los Angeles County.',
    es: 'Recursos esenciales en el condado de Los Ángeles.',
  },
  searchLabel: { en: 'Search resources', es: 'Buscar recursos' },
  searchPlaceholder: { en: 'Search food, shelter, ID help…', es: 'Buscar comida, refugio, ayuda con identificación…' },
  all: { en: 'All', es: 'Todos' },
  food: { en: 'Food', es: 'Comida' },
  shelter: { en: 'Shelter', es: 'Refugio' },
  documents: { en: 'ID & Documents', es: 'Identificación y documentos' },
  employment: { en: 'Employment', es: 'Empleo' },
  crisis: { en: 'Crisis', es: 'Crisis' },
  openNow: { en: 'Open now', es: 'Abierto ahora' },
  closed: { en: 'Closed', es: 'Cerrado' },
  hoursUnknown: { en: 'Hours not confirmed', es: 'Horario sin confirmar' },
  open24: { en: 'Open 24 hours', es: 'Abierto 24 horas' },
  closesAt: { en: 'Closes at {time}', es: 'Cierra a las {time}' },
  opensAt: { en: 'Opens at {time}', es: 'Abre a las {time}' },
  opensNextDay: { en: 'Opens {time} next open day', es: 'Abre a las {time} el próximo día' },
  call: { en: 'Call', es: 'Llamar' },
  directions: { en: 'Directions', es: 'Cómo llegar' },
  website: { en: 'Website', es: 'Sitio web' },
  callInstead: {
    en: 'This resource does not list a public address. Call for help.',
    es: 'Este recurso no publica una dirección. Llame para recibir ayuda.',
  },
  confidentialNotice: {
    en: 'Location kept private for safety. Staff will arrange a safe meeting place when you call.',
    es: 'La ubicación se mantiene privada por seguridad. El personal coordinará un lugar seguro cuando llame.',
  },
  hotlineOnlyNotice: {
    en: 'Phone and text support only — there is no walk-in location.',
    es: 'Solo apoyo por teléfono y mensaje: no hay sede para visitar.',
  },
  onlineNotice: {
    en: 'This service is online only.',
    es: 'Este servicio es solo en línea.',
  },
  eligibility: { en: 'Who can use this', es: 'Quién puede usarlo' },
  languages: { en: 'Languages', es: 'Idiomas' },
  hours: { en: 'Hours', es: 'Horario' },
  reviews: { en: 'Community notes', es: 'Notas de la comunidad' },
  noReviews: { en: 'No community notes yet.', es: 'Aún no hay notas de la comunidad.' },
  back: { en: 'Back', es: 'Atrás' },
  viewDetails: { en: 'View details', es: 'Ver detalles' },
  home: { en: 'Home', es: 'Inicio' },
  map: { en: 'Map', es: 'Mapa' },
  suggest: { en: 'Suggest', es: 'Sugerir' },
  rights: { en: 'Rights', es: 'Derechos' },
  noResults: {
    en: 'No resources match that search.',
    es: 'Ningún recurso coincide con esa búsqueda.',
  },
  resultCount: { en: '{count} resources', es: '{count} recursos' },
  loadFailed: {
    en: 'Could not load resources. Check your connection and try again.',
    es: 'No se pudieron cargar los recursos. Revise su conexión e intente de nuevo.',
  },
  retry: { en: 'Try again', es: 'Intentar de nuevo' },
  nearestThree: { en: 'Closest to you', es: 'Más cerca de usted' },
  useMyLocation: { en: 'Use my location', es: 'Usar mi ubicación' },
  locationDenied: {
    en: 'Location unavailable. Showing all mapped resources.',
    es: 'Ubicación no disponible. Mostrando todos los recursos en el mapa.',
  },
  mapExcludesConfidential: {
    en: 'Some resources are not on the map because their location is kept private.',
    es: 'Algunos recursos no aparecen en el mapa porque su ubicación es privada.',
  },
  suggestTitle: { en: 'Suggest a resource', es: 'Sugerir un recurso' },
  suggestIntro: {
    en: 'Tell us about a place that helped you. A person reviews every suggestion before it appears.',
    es: 'Cuéntenos de un lugar que le ayudó. Una persona revisa cada sugerencia antes de publicarla.',
  },
  fieldName: { en: 'Name of the resource', es: 'Nombre del recurso' },
  fieldCategory: { en: 'Category', es: 'Categoría' },
  fieldAccess: { en: 'How do people reach it?', es: '¿Cómo se accede?' },
  fieldDescription: { en: 'What do they offer?', es: '¿Qué ofrecen?' },
  fieldAddress: { en: 'Address (optional)', es: 'Dirección (opcional)' },
  fieldPhone: { en: 'Phone (optional)', es: 'Teléfono (opcional)' },
  fieldNotes: { en: 'Anything else (optional)', es: 'Algo más (opcional)' },
  submit: { en: 'Send suggestion', es: 'Enviar sugerencia' },
  submitting: { en: 'Sending…', es: 'Enviando…' },
  submitThanks: {
    en: 'Thank you. A person will review this before it appears in the list.',
    es: 'Gracias. Una persona revisará esto antes de que aparezca en la lista.',
  },
  submitFailed: {
    en: 'That did not send. Please try again.',
    es: 'No se pudo enviar. Por favor intente de nuevo.',
  },
  required: { en: 'Required', es: 'Obligatorio' },
  noAccountNeeded: {
    en: 'No account needed. We do not track who you are.',
    es: 'No necesita cuenta. No registramos quién es usted.',
  },
  languageToggle: { en: 'Español', es: 'English' },
  loading: { en: 'Loading…', es: 'Cargando…' },
  sampleDataNotice: {
    en: 'Showing sample data. Live resources load once the database is connected.',
    es: 'Mostrando datos de muestra. Los recursos reales se cargan al conectar la base de datos.',
  },
}

export function t(key: keyof typeof STRINGS | string, locale: Locale, vars?: Record<string, string | number>): string {
  const entry = STRINGS[key as keyof typeof STRINGS]
  let value = entry ? entry[locale] || entry.en : String(key)
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replace(`{${name}}`, String(replacement))
    }
  }
  return value
}

export const CATEGORY_LABEL_KEYS = {
  food: 'food',
  shelter: 'shelter',
  documents: 'documents',
  employment: 'employment',
  crisis: 'crisis',
} as const
