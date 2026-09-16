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
  searchPlaceholder: {
    en: 'Search food, housing, ID help…',
    es: 'Buscar comida, vivienda, ayuda con identificación…',
  },
  all: { en: 'All', es: 'Todos' },

  // Category labels. These are the names a person would use out loud, which
  // is why they are longer than a filing system would choose.
  'emergency-housing': { en: 'Emergency Housing', es: 'Vivienda de emergencia' },
  'fair-chance-jobs': { en: 'Fair Chance Jobs', es: 'Empleo con segunda oportunidad' },
  'docs-and-expungement': { en: 'Docs & Expungement', es: 'Documentos y expunción' },
  'food-and-meals': { en: 'Food & Meals', es: 'Comida y comidas' },
  'health-and-support': { en: 'Health & Support', es: 'Salud y apoyo' },
  clothing: { en: 'Clothing', es: 'Ropa' },
  'mobile-services': { en: 'Mobile services', es: 'Servicios móviles' },
  'family-support': { en: 'Family support', es: 'Apoyo familiar' },
  'faith-based': { en: 'Faith-based', es: 'Basado en la fe' },

  // Short forms for the Quick Finder tiles, where space is tight.
  'tile.emergency-housing': { en: 'Emergency Housing', es: 'Vivienda de emergencia' },
  'tile.fair-chance-jobs': { en: 'Fair Chance Jobs', es: 'Empleo segunda oport.' },
  'tile.docs-and-expungement': { en: 'Docs & Expungement', es: 'Documentos y expunción' },
  'tile.food-and-meals': { en: 'Food & Meals', es: 'Comida y comidas' },
  'tile.health-and-support': { en: 'Health & Support', es: 'Salud y apoyo' },
  'tile.clothing': { en: 'Clothing', es: 'Ropa' },

  quickFinder: { en: 'What do you need?', es: '¿Qué necesita?' },

  // --- Card and detail actions ---
  callNow: { en: 'Call now', es: 'Llamar ahora' },
  mapButton: { en: 'Map', es: 'Mapa' },
  closesAtShort: { en: 'closes {time}', es: 'cierra a las {time}' },
  opensAtShort: { en: 'opens {time}', es: 'abre a las {time}' },
  opensAtOnDay: { en: 'opens {time} {day}', es: 'abre a las {time} {day}' },
  locationPrivateShort: {
    en: 'Location kept private for safety',
    es: 'Ubicación privada por seguridad',
  },
  share: { en: 'Share', es: 'Compartir' },
  scrollHint: {
    en: 'Scroll for hours, reviews & more',
    es: 'Desplaza para ver horarios, reseñas y más',
  },

  // --- Eligibility tags ---
  'tag.referral-needed': { en: 'Referral needed', es: 'Se necesita referencia' },
  'tag.women-only': { en: 'Women only', es: 'Solo mujeres' },
  'tag.no-id-needed': { en: 'No ID needed', es: 'Sin identificación' },
  'tag.walk-ins-welcome': { en: 'Walk-ins welcome', es: 'Sin cita' },
  'tag.free': { en: 'Free', es: 'Gratis' },

  // --- Detail sections ---
  address: { en: 'Address', es: 'Dirección' },
  contact: { en: 'Contact', es: 'Contacto' },
  whatToKnow: { en: 'What to know', es: 'Lo que debe saber' },
  about: { en: 'About', es: 'Acerca de' },
  cost: { en: 'Cost', es: 'Costo' },
  wheelchair: { en: 'Wheelchair accessible', es: 'Accesible en silla de ruedas' },
  yes: { en: 'Yes', es: 'Sí' },
  no: { en: 'No', es: 'No' },
  open24Full: { en: 'Open 24 hours, 7 days a week', es: 'Abierto 24 horas, 7 días a la semana' },
  referralRequired: { en: 'A referral is needed', es: 'Se necesita una referencia' },
  referralDefault: {
    en: 'Call to ask how to get a referral before you go.',
    es: 'Llame para preguntar cómo obtener una referencia antes de ir.',
  },
  lastVerified: { en: 'Last verified {date}.', es: 'Verificado por última vez el {date}.' },
  lastVerifiedBy: {
    en: 'Last verified {date} by {method}.',
    es: 'Verificado por última vez el {date} por {method}.',
  },
  mayBeOutdated: {
    en: 'This listing may be outdated. Call to confirm.',
    es: 'Esta información puede estar desactualizada. Llame para confirmar.',
  },

  // --- Reviews ---
  ratingSummary: { en: '{rating} stars · {count} reviews', es: '{rating} estrellas · {count} reseñas' },
  starsOutOfFive: { en: '{rating} out of 5 stars', es: '{rating} de 5 estrellas' },
  showAllReviews: { en: 'Show all {count} reviews', es: 'Ver las {count} reseñas' },
  addReview: { en: 'Add your review', es: 'Añadir su reseña' },
  yourRating: { en: 'Your rating', es: 'Su calificación' },
  yourReview: { en: 'Your review', es: 'Su reseña' },
  ratingRequired: { en: 'Choose a star rating.', es: 'Elija una calificación.' },
  charactersLeft: { en: '{count} characters left', es: 'Quedan {count} caracteres' },
  submitReview: { en: 'Submit review', es: 'Enviar reseña' },
  reviewThanks: {
    en: "Thanks. Your review will appear after it's reviewed.",
    es: 'Gracias. Su reseña aparecerá después de ser revisada.',
  },
  reviewSafetyNote: {
    en: "Please don't include staff names or the address of any location that keeps its address private.",
    es: 'Por favor no incluya nombres del personal ni la dirección de ningún lugar que mantenga su dirección privada.',
  },

  // Fair chance types. A person deserves to know which front door they are
  // calling before they call it.
  'fairChance.signatory': { en: 'Fair chance employer', es: 'Empleador de segunda oportunidad' },
  'fairChance.placement-program': { en: 'Placement program', es: 'Programa de colocación' },
  'fairChance.staffing-agency': { en: 'Staffing agency', es: 'Agencia de empleo' },
  'fairChance.workforce-center': { en: 'Workforce center', es: 'Centro de empleo' },
  'fairChance.signatory.help': {
    en: 'This employer has signed a public fair chance hiring pledge.',
    es: 'Este empleador firmó un compromiso público de contratación de segunda oportunidad.',
  },
  'fairChance.placement-program.help': {
    en: 'A program that places justice-impacted workers. There is an intake process.',
    es: 'Un programa que coloca a personas con antecedentes. Tiene un proceso de admisión.',
  },
  'fairChance.staffing-agency.help': {
    en: 'A staffing agency that specialises in fair chance hiring.',
    es: 'Una agencia de empleo especializada en contratación de segunda oportunidad.',
  },
  'fairChance.workforce-center.help': {
    en: 'A public job center. Open to everyone, with reentry staff on site.',
    es: 'Un centro de empleo público. Abierto a todos, con personal de reingreso.',
  },

  'service.id-replacement': { en: 'ID replacement', es: 'Reemplazo de identificación' },
  'service.expungement': { en: 'Expungement', es: 'Expunción' },
  'service.both': { en: 'ID & expungement', es: 'Identificación y expunción' },

  alsoNeedExpungement: { en: 'You may also need: Expungement', es: 'También puede necesitar: Expunción' },
  alsoNeedId: { en: 'You may also need: ID replacement', es: 'También puede necesitar: Reemplazo de identificación' },
  alsoNeedWhy: {
    en: 'Clearing a record and replacing an ID often go together.',
    es: 'Limpiar un antecedente y reemplazar una identificación suelen ir juntos.',
  },

  // Location indicator
  searchArea: { en: 'Searching', es: 'Buscando en' },
  laCounty: { en: 'Los Angeles County', es: 'Condado de Los Ángeles' },
  change: { en: 'Change', es: 'Cambiar' },
  changeArea: { en: 'Change search area', es: 'Cambiar área de búsqueda' },
  autoDetect: { en: 'Auto-detect my location', es: 'Detectar mi ubicación' },
  enterZip: { en: 'Enter ZIP code', es: 'Ingresar código postal' },
  zipPlaceholder: { en: '5-digit ZIP', es: 'Código de 5 dígitos' },
  useZip: { en: 'Use this ZIP', es: 'Usar este código' },
  useWholeCounty: { en: 'Search the whole county', es: 'Buscar en todo el condado' },
  cancel: { en: 'Cancel', es: 'Cancelar' },
  detecting: { en: 'Detecting…', es: 'Detectando…' },
  outsideCoverage: {
    en: 'That location is outside our coverage area. We serve Los Angeles County.',
    es: 'Esa ubicación está fuera de nuestra área de cobertura. Servimos al condado de Los Ángeles.',
  },
  zipInvalid: { en: 'Enter five digits.', es: 'Ingrese cinco dígitos.' },
  geoUnavailable: {
    en: 'Could not read your location. Enter a ZIP code instead.',
    es: 'No se pudo leer su ubicación. Ingrese un código postal.',
  },
  locationOptIn: {
    en: 'We only check your location when you ask. Nothing is stored or sent anywhere.',
    es: 'Solo revisamos su ubicación cuando usted lo pide. Nada se guarda ni se envía.',
  },

  // Freshness dot
  freshnessGreen: { en: 'Data is current', es: 'Datos actualizados' },
  freshnessAmber: { en: 'Some data needs re-checking', es: 'Algunos datos necesitan revisión' },
  freshnessRed: { en: 'Data needs re-checking', es: 'Los datos necesitan revisión' },
  freshnessDetail: {
    en: '{percent}% of local resources verified in the last 90 days. Most recent verification: {date}.',
    es: '{percent}% de los recursos locales verificados en los últimos 90 días. Verificación más reciente: {date}.',
  },
  freshnessNone: {
    en: 'No verification dates recorded yet.',
    es: 'Aún no hay fechas de verificación registradas.',
  },

  // Empty state
  emptyLead: {
    en: "We don't have verified resources for this yet. Here's what you can do.",
    es: 'Aún no tenemos recursos verificados para esto. Esto es lo que puede hacer.',
  },
  call211: { en: 'Call 211', es: 'Llamar al 211' },
  call211Sub: { en: 'LA County help, 24 hours', es: 'Ayuda del condado, 24 horas' },
  tryWiderArea: { en: 'Try a wider area', es: 'Buscar en un área más amplia' },
  tryWiderAreaSub: { en: 'Search all of Los Angeles County', es: 'Buscar en todo el condado' },
  suggestFromEmpty: { en: 'Suggest a resource', es: 'Sugerir un recurso' },
  suggestFromEmptySub: {
    en: 'Know somewhere that helps? Tell us.',
    es: '¿Conoce un lugar que ayude? Cuéntenos.',
  },

  // Hotlines strip
  hotlinesLabel: { en: 'Need help right now', es: 'Necesita ayuda ahora' },
  hotline211: { en: '211 · LA County help', es: '211 · Ayuda del condado' },
  hotline988: { en: '988 · Suicide & crisis', es: '988 · Suicidio y crisis' },
  hotlineDv: { en: 'DV hotline · 24 hours', es: 'Línea de violencia doméstica · 24 horas' },
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
  reviews: { en: 'Reviews', es: 'Reseñas' },
  noReviews: { en: 'No reviews yet.', es: 'Aún no hay reseñas.' },
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

/** A category's own name is its translation key. */
export function categoryLabel(category: string, locale: Locale): string {
  return t(category, locale)
}
