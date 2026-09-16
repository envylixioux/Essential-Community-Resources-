import { SAMPLE_RESOURCES } from '../data/sampleResources'
import { canShowLocation, redactLocation } from './canShowLocation'
import { hasRequiredTags, missingTagReason } from './categories'
import { supabase } from './supabase'
import type { Resource, Review, Submission } from './types'

export interface ResourceLoad {
  resources: Resource[]
  /** True when the list came from the bundled placeholder file, not the database. */
  isSample: boolean
}

/**
 * Loads resources for display.
 *
 * Two rules are enforced here rather than left to callers:
 *  - Only verified rows come back. Wrong hours are worse than no listing;
 *    someone takes two buses to a closed door.
 *  - A row missing a tag its category requires is treated the same as
 *    unverified and withheld. A fair-chance-jobs listing with no
 *    fair_chance_type is the case that matters: publishing an employer as
 *    "fair chance" without knowing what kind sends someone to be rejected
 *    over their record on our say-so.
 *  - Every row is passed through redactLocation, so a confidential resource
 *    carries no address or coordinates in memory at all. Components still
 *    call canShowLocation, but if one ever forgets there is nothing to leak.
 */
export async function loadResources(): Promise<ResourceLoad> {
  if (!supabase) {
    return { resources: prepare(SAMPLE_RESOURCES), isSample: true }
  }

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('verified', true)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)

  return { resources: prepare((data ?? []) as Resource[]), isSample: false }
}

function prepare(rows: Resource[]): Resource[] {
  const kept: Resource[] = []

  for (const row of rows) {
    if (!row.verified) continue

    if (!hasRequiredTags(row)) {
      // Loud for the team, invisible to the reader. Console only — this app
      // sends no telemetry anywhere.
      console.warn(`[quick-connect-la] withheld: ${missingTagReason(row)}`)
      continue
    }

    const safe = redactLocation(row)
    kept.push({ ...safe, derived_postal_code: postalCodeOf(safe) })
  }

  return kept
}

/**
 * Pulls the five-digit postal code out of an address so the search-area
 * filter has something to match on.
 *
 * Gated through canShowLocation like everything else: a confidential
 * resource gets null, which is why such a resource is treated as serving the
 * whole county rather than being filtered out of a narrowed search. A shelter
 * a person cannot find is the same as no shelter.
 */
function postalCodeOf(resource: Resource): string | null {
  if (!canShowLocation(resource)) return null
  const match = /\b(\d{5})(?:-\d{4})?\b\s*$/.exec(resource.address ?? '')
  return match ? match[1] : null
}

/** Approved reviews only. Pending and rejected notes never reach the UI. */
export async function loadReviews(resourceId: string): Promise<Review[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('resource_id', resourceId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Review[]
}

/**
 * Files a community suggestion. It lands in `submissions` with status
 * 'pending' and never appears in the directory until a human promotes it into
 * the resources table.
 */
export async function submitSuggestion(submission: Submission): Promise<void> {
  if (!supabase) {
    // Without a database there is nowhere to put this. Say so rather than
    // pretending it was received.
    throw new Error('Submissions are not available in this build.')
  }

  const { error } = await supabase.from('submissions').insert({
    ...submission,
    status: 'pending',
  })

  if (error) throw new Error(error.message)
}
