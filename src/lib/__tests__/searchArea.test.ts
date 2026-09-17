import { describe, expect, it } from 'vitest'
import { isInLaCounty, isLaCountyZip } from '../searchArea'

describe('isLaCountyZip', () => {
  it('accepts ZIPs across the county', () => {
    const inside = [
      '90012', // Downtown
      '90033', // Boyle Heights
      '90044', // South LA
      '90802', // Long Beach
      '91401', // Van Nuys
      '91101', // Pasadena
      '93550', // Palmdale
    ]
    for (const zip of inside) {
      expect(isLaCountyZip(zip), `${zip} should be in the county`).toBe(true)
    }
  })

  it('rejects ZIPs outside the county', () => {
    const outside = [
      '92626', // Orange County
      '92101', // San Diego
      '94102', // San Francisco
      '10001', // New York
      '00501',
    ]
    for (const zip of outside) {
      expect(isLaCountyZip(zip), `${zip} should be outside the county`).toBe(false)
    }
  })

  it('rejects anything that is not five digits', () => {
    expect(isLaCountyZip('9001')).toBe(false)
    expect(isLaCountyZip('900123')).toBe(false)
    expect(isLaCountyZip('abcde')).toBe(false)
    expect(isLaCountyZip('')).toBe(false)
    expect(isLaCountyZip('90012-1234')).toBe(false)
  })
})

describe('isInLaCounty', () => {
  it('accepts points around the county', () => {
    expect(isInLaCounty(34.0522, -118.2437)).toBe(true) // Downtown
    expect(isInLaCounty(33.77, -118.19)).toBe(true) // Long Beach
    expect(isInLaCounty(34.69, -118.14)).toBe(true) // Lancaster
  })

  it('rejects points well outside it', () => {
    expect(isInLaCounty(32.7157, -117.1611)).toBe(false) // San Diego
    expect(isInLaCounty(37.7749, -122.4194)).toBe(false) // San Francisco
    expect(isInLaCounty(40.7128, -74.006)).toBe(false) // New York
  })
})
