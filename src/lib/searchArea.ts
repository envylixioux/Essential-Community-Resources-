/**
 * Where the reader is searching.
 *
 * Location is opt-in every single time. The app never asks for geolocation on
 * load, never asks in the background, and stores nothing beyond the reader's
 * own choice in localStorage. People using this app have real reasons not to
 * want their whereabouts recorded.
 */

export interface SearchArea {
  kind: 'county' | 'zip'
  /** Five digits when kind is 'zip'. */
  zip?: string
  /** Neighbourhood or city name when we can name one. */
  label?: string
}

export const COUNTY_AREA: SearchArea = { kind: 'county' }

const STORAGE_KEY = 'searchArea'

/**
 * Los Angeles County ZIP ranges.
 *
 * NEEDS VERIFICATION BEFORE LAUNCH. These ranges are close but not
 * authoritative, and a wrong entry tells a real person "we do not serve you"
 * when we do. Check them against the county's own published list and replace
 * this comment with the source and the date checked.
 *
 * Deliberately ranges rather than an enumerated list: the county has well
 * over 300 ZIPs and an enumerated list nobody maintains rots silently.
 */
const LA_COUNTY_ZIP_RANGES: Array<[number, number]> = [
  [90001, 90084], // Los Angeles city proper
  [90086, 90103],
  [90201, 90280], // Southeast cities: Bell, Downey, Compton, and neighbours
  [90290, 90296], // Topanga, Playa del Rey
  [90301, 90312], // Inglewood
  [90401, 90411], // Santa Monica
  [90501, 90510], // Torrance
  [90601, 90640], // Whittier, Pico Rivera, Montebello
  [90650, 90670], // Norwalk, Santa Fe Springs
  [90701, 90755], // Artesia through Signal Hill
  [90801, 90899], // Long Beach
  [91001, 91043], // Altadena, Tujunga
  [91101, 91189], // Pasadena
  [91201, 91226], // Glendale
  [91301, 91390], // Agoura Hills, Santa Clarita, Canyon Country
  [91401, 91499], // San Fernando Valley
  [91501, 91527], // Burbank
  [91601, 91618], // North Hollywood
  [91701, 91799], // Eastern San Gabriel Valley
  [93243, 93243], // Lebec, partly in the county
  [93510, 93599], // Antelope Valley: Acton, Lancaster, Palmdale
]

/** True when a five-digit ZIP falls inside Los Angeles County. */
export function isLaCountyZip(zip: string): boolean {
  if (!/^\d{5}$/.test(zip)) return false
  const value = Number(zip)
  return LA_COUNTY_ZIP_RANGES.some(([low, high]) => value >= low && value <= high)
}

/**
 * A rough bounding box for the county, used only to decide whether a
 * geolocation result is inside our coverage. Deliberately generous at the
 * edges: telling someone just inside the line that we do not serve them is
 * the worse error.
 */
const LA_COUNTY_BOUNDS = {
  north: 34.9,
  south: 33.68,
  west: -118.99,
  east: -117.63,
}

/**
 * Coverage check for a geolocation result.
 *
 * This module handles the READER'S own coordinates, never a resource's. It
 * does not import Resource and must not: the location gate in
 * src/lib/canShowLocation.ts is what governs resource locations, and mixing
 * the two here would put a hole in that audit. A test enforces the split.
 *
 * The reader's position is used for this comparison and then dropped. It is
 * never stored, rendered, or sent anywhere.
 */
export function isPositionInLaCounty(position: GeolocationPosition): boolean {
  return isInLaCounty(position.coords.latitude, position.coords.longitude)
}

/** The reader's own coordinates as a plain pair, so components never unpack
 * a GeolocationPosition themselves. In memory for the visit, never stored. */
export function positionToLatLng(position: GeolocationPosition): { lat: number; lng: number } {
  return { lat: position.coords.latitude, lng: position.coords.longitude }
}

export function isInLaCounty(latitude: number, longitude: number): boolean {
  return (
    latitude >= LA_COUNTY_BOUNDS.south &&
    latitude <= LA_COUNTY_BOUNDS.north &&
    longitude >= LA_COUNTY_BOUNDS.west &&
    longitude <= LA_COUNTY_BOUNDS.east
  )
}

export function loadSearchArea(): SearchArea {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return COUNTY_AREA
    const parsed = JSON.parse(raw) as SearchArea
    if (parsed.kind === 'zip' && parsed.zip && isLaCountyZip(parsed.zip)) return parsed
    if (parsed.kind === 'county') return COUNTY_AREA
  } catch {
    // Private mode, disabled storage, or something else wrote nonsense here.
  }
  return COUNTY_AREA
}

export function saveSearchArea(area: SearchArea): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(area))
  } catch {
    // Remembering the choice is a convenience, not a requirement.
  }
}
