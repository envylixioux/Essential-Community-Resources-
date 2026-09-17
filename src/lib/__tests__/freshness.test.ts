import { describe, expect, it } from 'vitest'
import { computeFreshness } from '../freshness'
import type { Resource } from '../types'

const NOW = new Date('2026-09-16T12:00:00Z')

function withDate(id: string, last_verified_at: string | null): Resource {
  return {
    id,
    name: id,
    name_es: null,
    description: '',
    description_es: null,
    category: 'food-and-meals',
    access_type: 'walk-in',
    confidential_location: false,
    address: null,
    neighborhood: null,
    latitude: null,
    longitude: null,
    phone: null,
    hotline: null,
    website: null,
    hours: null,
    open_24_hours: false,
    eligibility: null,
    eligibility_es: null,
    languages: null,
    fair_chance_type: null,
    service_provided: null,
    hours_note: null,
    hours_note_es: null,
    email: null,
    eligibility_tags: null,
    cost: null,
    cost_es: null,
    wheelchair_accessible: null,
    serves_population: null,
    serves_population_es: null,
    referral_required: false,
    referral_note: null,
    referral_note_es: null,
    verification_method: null,
    verified: true,
    last_verified_at,
  }
}

/** n resources verified recently, m verified long ago. */
function mix(recent: number, stale: number): Resource[] {
  const rows: Resource[] = []
  for (let i = 0; i < recent; i += 1) rows.push(withDate(`r${i}`, '2026-09-01'))
  for (let i = 0; i < stale; i += 1) rows.push(withDate(`s${i}`, '2024-01-01'))
  return rows
}

describe('computeFreshness', () => {
  it('is green at or above 80% verified in the window', () => {
    expect(computeFreshness(mix(8, 2), NOW).level).toBe('green')
    expect(computeFreshness(mix(10, 0), NOW).percent).toBe(100)
  })

  it('is amber between 50% and 80%', () => {
    expect(computeFreshness(mix(5, 5), NOW).level).toBe('amber')
    expect(computeFreshness(mix(7, 3), NOW).level).toBe('amber')
  })

  it('is red below 50%', () => {
    expect(computeFreshness(mix(4, 6), NOW).level).toBe('red')
    expect(computeFreshness(mix(0, 10), NOW).level).toBe('red')
  })

  it('reports the most recent verification date', () => {
    const rows = [withDate('a', '2026-08-01'), withDate('b', '2026-09-10')]
    expect(computeFreshness(rows, NOW).mostRecent).toBe('2026-09-10')
  })

  it('treats a date exactly at the 90 day edge as inside the window', () => {
    // 90 days before 2026-09-16 is 2026-06-18.
    expect(computeFreshness([withDate('a', '2026-06-18')], NOW).percent).toBe(100)
    expect(computeFreshness([withDate('a', '2026-06-17')], NOW).percent).toBe(0)
  })

  it('counts a row with no date against the total rather than ignoring it', () => {
    // Five recent, five with no date recorded: half the directory is unknown,
    // and pretending otherwise is the failure mode this dot exists to catch.
    const rows = [...mix(5, 0), ...Array.from({ length: 5 }, (_, i) => withDate(`n${i}`, null))]
    expect(computeFreshness(rows, NOW).percent).toBe(50)
    expect(computeFreshness(rows, NOW).level).toBe('amber')
  })

  it('reports none when nothing has a date at all', () => {
    const result = computeFreshness([withDate('a', null)], NOW)
    expect(result.level).toBe('none')
    expect(result.mostRecent).toBeNull()
  })

  it('reports none for an empty directory', () => {
    expect(computeFreshness([], NOW).level).toBe('none')
  })
})
