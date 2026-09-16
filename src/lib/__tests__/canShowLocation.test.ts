import { describe, expect, it } from 'vitest'
import {
  canShowLocation,
  canShowOnMap,
  contactNumber,
  directionsUrl,
  displayAddress,
  redactLocation,
} from '../canShowLocation'
import type { AccessType, Resource } from '../types'

function make(overrides: Partial<Resource> = {}): Resource {
  return {
    id: 'r1',
    name: 'Test Resource',
    name_es: null,
    description: 'desc',
    description_es: null,
    category: 'food-and-meals',
    access_type: 'walk-in',
    confidential_location: false,
    address: '123 Main St, Los Angeles, CA 90012',
    neighborhood: 'Downtown',
    latitude: 34.05,
    longitude: -118.24,
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
    last_verified_at: null,
    ...overrides,
  }
}

describe('canShowLocation', () => {
  it('allows a normal walk-in resource', () => {
    expect(canShowLocation(make())).toBe(true)
  })

  it('refuses any resource flagged confidential_location', () => {
    expect(canShowLocation(make({ confidential_location: true }))).toBe(false)
  })

  it('refuses a confidential resource even when it is walk-in with coordinates', () => {
    const shelter = make({
      confidential_location: true,
      access_type: 'walk-in',
      address: '456 Secret Ave',
      latitude: 34.1,
      longitude: -118.3,
    })
    expect(canShowLocation(shelter)).toBe(false)
    expect(canShowOnMap(shelter)).toBe(false)
    expect(displayAddress(shelter)).toBeNull()
    expect(directionsUrl(shelter)).toBeNull()
  })

  it('refuses hotline-only and online resources', () => {
    expect(canShowLocation(make({ access_type: 'hotline-only' }))).toBe(false)
    expect(canShowLocation(make({ access_type: 'online' }))).toBe(false)
  })

  it('allows appointment and application resources', () => {
    const allowed: AccessType[] = ['walk-in', 'appointment', 'application']
    for (const access_type of allowed) {
      expect(canShowLocation(make({ access_type }))).toBe(true)
    }
  })
})

describe('canShowOnMap', () => {
  it('requires coordinates as well as permission', () => {
    expect(canShowOnMap(make())).toBe(true)
    expect(canShowOnMap(make({ latitude: null }))).toBe(false)
    expect(canShowOnMap(make({ longitude: null }))).toBe(false)
  })

  it('excludes every gated resource from map data', () => {
    const gated = [
      make({ confidential_location: true }),
      make({ access_type: 'hotline-only' }),
      make({ access_type: 'online' }),
    ]
    expect(gated.filter(canShowOnMap)).toEqual([])
  })
})

describe('directionsUrl', () => {
  it('prefers coordinates when present', () => {
    expect(directionsUrl(make())).toContain('destination=34.05,-118.24')
  })

  it('falls back to the encoded address', () => {
    const url = directionsUrl(make({ latitude: null, longitude: null }))
    expect(url).toContain(encodeURIComponent('123 Main St, Los Angeles, CA 90012'))
  })

  it('returns null when there is nothing to navigate to', () => {
    expect(directionsUrl(make({ latitude: null, longitude: null, address: null }))).toBeNull()
  })
})

describe('redactLocation', () => {
  it('strips address and coordinates from gated resources', () => {
    const redacted = redactLocation(make({ confidential_location: true }))
    expect(redacted.address).toBeNull()
    expect(redacted.latitude).toBeNull()
    expect(redacted.longitude).toBeNull()
  })

  it('leaves permitted resources untouched', () => {
    const resource = make()
    expect(redactLocation(resource)).toBe(resource)
  })

  it('leaves no location trace in a serialised payload', () => {
    const json = JSON.stringify(
      redactLocation(make({ confidential_location: true, address: '456 Secret Ave' })),
    )
    expect(json).not.toContain('Secret')
    expect(json).not.toContain('34.05')
  })
})

describe('contactNumber', () => {
  it('prefers the staffed hotline', () => {
    expect(contactNumber(make({ hotline: '1-800-799-7233' }))).toBe('1-800-799-7233')
  })

  it('falls back to the main phone line', () => {
    expect(contactNumber(make())).toBe('213-555-0100')
  })

  it('returns null when there is no number at all', () => {
    expect(contactNumber(make({ phone: null }))).toBeNull()
  })
})
