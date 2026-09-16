import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetDeprecationWarnings,
  hasRequiredTags,
  LEGACY_CATEGORY_MAP,
  resolveCategory,
} from '../categories'
import { CATEGORIES, type Resource } from '../types'

function make(overrides: Partial<Resource> = {}): Resource {
  return {
    id: 'r1',
    name: 'Test',
    name_es: null,
    description: 'desc',
    description_es: null,
    category: 'food-and-meals',
    access_type: 'walk-in',
    confidential_location: false,
    address: null,
    neighborhood: null,
    latitude: null,
    longitude: null,
    phone: '213-555-0100',
    hotline: null,
    website: null,
    hours: null,
    open_24_hours: false,
    eligibility: null,
    eligibility_es: null,
    languages: null,
    fair_chance_type: null,
    service_provided: null,
    verified: true,
    last_verified_at: null,
    ...overrides,
  }
}

describe('resolveCategory', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    __resetDeprecationWarnings()
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it('passes through every current category without warning', () => {
    for (const category of CATEGORIES) {
      expect(resolveCategory(category)).toBe(category)
    }
    expect(warn).not.toHaveBeenCalled()
  })

  it('maps each old name to its replacement', () => {
    expect(resolveCategory('shelter')).toBe('emergency-housing')
    expect(resolveCategory('employment')).toBe('fair-chance-jobs')
    expect(resolveCategory('documents')).toBe('docs-and-expungement')
    expect(resolveCategory('food')).toBe('food-and-meals')
    expect(resolveCategory('crisis')).toBe('health-and-support')
  })

  it('warns once per deprecated name, naming the replacement', () => {
    resolveCategory('shelter')
    resolveCategory('shelter')
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('emergency-housing')

    resolveCategory('crisis')
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('returns null for anything it does not recognise', () => {
    expect(resolveCategory('housing')).toBeNull()
    expect(resolveCategory('')).toBeNull()
    expect(resolveCategory('FOOD')).toBeNull()
  })

  it('maps every legacy name onto a category that still exists', () => {
    for (const replacement of Object.values(LEGACY_CATEGORY_MAP)) {
      expect(CATEGORIES).toContain(replacement)
    }
  })
})

describe('hasRequiredTags', () => {
  it('withholds a fair-chance listing with no fair_chance_type', () => {
    expect(hasRequiredTags(make({ category: 'fair-chance-jobs' }))).toBe(false)
  })

  it('accepts a fair-chance listing once it is categorised', () => {
    const tagged = make({ category: 'fair-chance-jobs', fair_chance_type: 'workforce-center' })
    expect(hasRequiredTags(tagged)).toBe(true)
  })

  it('withholds a docs listing with no service_provided', () => {
    expect(hasRequiredTags(make({ category: 'docs-and-expungement' }))).toBe(false)
  })

  it('accepts a docs listing once it says which half it covers', () => {
    expect(
      hasRequiredTags(make({ category: 'docs-and-expungement', service_provided: 'both' })),
    ).toBe(true)
  })

  it('does not require tags of categories that have none', () => {
    for (const category of CATEGORIES) {
      if (category === 'fair-chance-jobs' || category === 'docs-and-expungement') continue
      expect(hasRequiredTags(make({ category }))).toBe(true)
    }
  })
})
