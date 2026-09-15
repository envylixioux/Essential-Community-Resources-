/** Great-circle distance in miles between two points. */
export function haversineMiles(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const EARTH_RADIUS_MILES = 3958.8
  const toRad = (degrees: number) => (degrees * Math.PI) / 180

  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatMiles(miles: number, locale: string): string {
  const rounded = miles < 10 ? Math.round(miles * 10) / 10 : Math.round(miles)
  return locale === 'es' ? `${rounded} mi` : `${rounded} mi`
}
