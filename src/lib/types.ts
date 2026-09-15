/**
 * Data model for Quick Connect LA.
 *
 * Field names mirror the Postgres (Supabase) tables, which use snake_case.
 * The annotated schema in firestore-schema.js at the repo root explains WHY
 * each field exists; it predates the move to Postgres and uses camelCase, but
 * the reasoning there is still accurate.
 */

export type Category = 'food' | 'shelter' | 'documents' | 'employment' | 'crisis'

export const CATEGORIES: Category[] = [
  'food',
  'shelter',
  'documents',
  'employment',
  'crisis',
]

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

  /** Nothing renders until a human has called and confirmed the details. */
  verified: boolean
  last_verified_at: string | null
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
