import type { Resource } from './types'

/**
 * How current the directory is, as one dot.
 *
 * This is transparency, not a score to optimise. It exists so a reader can
 * tell at a glance whether the hours they are about to trust were confirmed
 * recently, and so the team notices when a region slips. It is the whole of
 * that feature — there is no data quality dashboard behind it and there
 * should not be one.
 */

export type FreshnessLevel = 'green' | 'amber' | 'red' | 'none'

export interface Freshness {
  level: FreshnessLevel
  /** Share verified within the window, 0-100, rounded. */
  percent: number
  /** ISO date of the most recent verification, or null. */
  mostRecent: string | null
}

export const FRESHNESS_WINDOW_DAYS = 90

export function computeFreshness(
  resources: Resource[],
  now: Date = new Date(),
): Freshness {
  if (resources.length === 0) {
    return { level: 'none', percent: 0, mostRecent: null }
  }

  // last_verified_at is a date with no time, so the cutoff is a date too.
  // Comparing "verified on the 18th" against "12:00 on the 18th" would drop a
  // row that is exactly on the boundary.
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  cutoff.setUTCDate(cutoff.getUTCDate() - FRESHNESS_WINDOW_DAYS)

  let recent = 0
  let mostRecent: string | null = null

  for (const resource of resources) {
    const value = resource.last_verified_at
    if (!value) continue

    const verified = new Date(`${value}T00:00:00Z`)
    if (Number.isNaN(verified.getTime())) continue

    if (verified >= cutoff) recent += 1
    if (mostRecent === null || value > mostRecent) mostRecent = value
  }

  if (mostRecent === null) {
    return { level: 'none', percent: 0, mostRecent: null }
  }

  const percent = Math.round((recent / resources.length) * 100)

  // 80% and above is green; 50 up to 80 is amber; below 50 is red.
  const level: FreshnessLevel = percent >= 80 ? 'green' : percent >= 50 ? 'amber' : 'red'

  return { level, percent, mostRecent }
}
