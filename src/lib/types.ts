/**
 * Data model for Quick Connect LA.
 *
 * Field names mirror the Postgres (Supabase) tables, which use snake_case.
 * The annotated schema in firestore-schema.js at the repo root explains WHY
 * each field exists; it predates the move to Postgres and uses camelCase, but
 * the reasoning there is still accurate.
 */

/**
 * Categories are named for what a person would actually say they need, not
 * for how a directory would file it. Someone does not think "I need a
 * shelter resource", they think "I need somewhere to sleep tonight".
 */
export type Category =
  | 'emergency-housing'
  | 'fair-chance-jobs'
  | 'docs-and-expungement'
  | 'food-and-meals'
  | 'health-and-support'
  | 'clothing'

export const CATEGORIES: Category[] = [
  'emergency-housing',
  'fair-chance-jobs',
  'docs-and-expungement',
  'food-and-meals',
  'health-and-support',
  'clothing',
]

/**
 * The names these categories had before the rename. Kept for one release
 * cycle so callers that have not been updated still work.
 *
 * See resolveCategory() in src/lib/categories.ts. Remove this type, the map,
 * and the compatibility layer together once nothing references them.
 */
export type LegacyCategory = 'food' | 'shelter' | 'documents' | 'employment' | 'crisis'

/**
 * How a person actually reaches this resource. Together with
 * confidential_location this decides whether a resource has an address, an
 * hours display, a map pin, or only a phone number.
 */
export type AccessType =
  | 'walk-in'
  | 'appointment'
  | 'hotline-only'
  | 'online'
  | 'application'

/**
 * What kind of fair-chance resource this is. Required on every resource in
 * the fair-chance-jobs category — see requiresFairChanceType() in
 * src/lib/categories.ts.
 *
 * These are meaningfully different front doors and a person deserves to know
 * which one they are calling before they call it:
 *   signatory         — the employer has publicly signed a fair-chance pledge
 *   placement-program — places justice-impacted workers; has an intake process
 *   staffing-agency   — an agency specialising in this hiring
 *   workforce-center  — a WorkSource or America's Job Center; serves everyone
 */
export type FairChanceType =
  | 'signatory'
  | 'placement-program'
  | 'staffing-agency'
  | 'workforce-center'

/**
 * Which half of docs-and-expungement a resource covers. Some organisations
 * do both at one intake, which is worth surfacing: it saves a second trip.
 */
export type ServiceProvided = 'id-replacement' | 'expungement' | 'both'

/** Minutes-from-midnight ranges are avoided on purpose: hours are authored by
 * hand by the research group, so they stay as "HH:MM" 24-hour strings. */
export interface HoursRange {
  open: string // "07:00"
  close: string // "19:00" — may be <= open, meaning the range runs overnight
}

export type Weekday =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'

/**
 * Hours JSON. A missing weekday key means "we do not know", which is NOT the
 * same as closed — see src/lib/hours.ts. An empty array means "closed that
 * day", which we do know.
 */
export type Hours = Partial<Record<Weekday, HoursRange[]>>

export interface Resource {
  id: string
  name: string
  name_es: string | null
  description: string
  description_es: string | null
  category: Category
  access_type: AccessType

  /**
   * When true the address must never leave the database. Domestic violence
   * shelters live behind this flag. See src/lib/canShowLocation.ts.
   */
  confidential_location: boolean

  address: string | null
  neighborhood: string | null
  latitude: number | null
  longitude: number | null

  phone: string | null
  hotline: string | null
  website: string | null

  hours: Hours | null
  open_24_hours: boolean

  eligibility: string | null
  eligibility_es: string | null
  languages: string[] | null

  /**
   * Required when category is 'fair-chance-jobs'. A job listing with no
   * fair-chance categorisation does not render at all: naming an employer
   * that then rejects someone over their record does real harm.
   */
  fair_chance_type: FairChanceType | null

  /** Required when category is 'docs-and-expungement'. */
  service_provided: ServiceProvided | null

  /** Nothing renders until a human has called and confirmed the details. */
  verified: boolean
  last_verified_at: string | null

  /**
   * Client-derived, not a database column. The postal code pulled out of the
   * address so the search-area filter has something to match on, and null
   * whenever the location gate refuses the resource — a confidential shelter
   * never carries one. Set in src/lib/resources.ts; do not render it.
   */
  derived_postal_code?: string | null
}

export interface Review {
  id: string
  resource_id: string
  rating: number
  body: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface Submission {
  id?: string
  name: string
  category: Category
  access_type: AccessType
  description: string
  address: string | null
  phone: string | null
  notes: string | null
  status?: 'pending' | 'approved' | 'rejected'
  created_at?: string
}
