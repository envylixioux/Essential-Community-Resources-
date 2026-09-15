import type { Resource } from './types'

/**
 * THE location gate. Every code path that could put a resource's whereabouts
 * on screen — address text, a map pin, a Directions link, a lat/lng in a
 * payload — goes through this function first.
 *
 * Publishing the address of a domestic violence shelter can get someone
 * killed. That is the whole reason this file exists and why the rule lives in
 * exactly one place instead of being re-derived per component.
 *
 * Returns false when:
 *   - confidential_location is true, or
 *   - access_type is 'hotline-only' (there is nowhere to go), or
 *   - access_type is 'online' (same).
 *
 * When this returns false the caller must render NO address, NO map pin, and
 * NO Directions button — removed from the DOM and excluded from map data, not
 * hidden with CSS and not merely disabled. Show the phone or hotline instead.
 */
export function canShowLocation(resource: Resource): boolean {
  if (resource.confidential_location) return false
  if (resource.access_type === 'hotline-only') return false
  if (resource.access_type === 'online') return false
  return true
}

/**
 * True only when the resource passes the gate AND actually has coordinates.
 * Map code should filter with this so a confidential resource is never part
 * of the marker data in the first place.
 */
export function canShowOnMap(
  resource: Resource,
): resource is Resource & { latitude: number; longitude: number } {
  return (
    canShowLocation(resource) &&
    typeof resource.latitude === 'number' &&
    typeof resource.longitude === 'number'
  )
}

/**
 * The only supported way to build a directions URL. Returns null when the
 * resource is gated or has no address, so callers get nothing to render
 * rather than a broken or unsafe link.
 */
export function directionsUrl(resource: Resource): string | null {
  if (!canShowLocation(resource)) return null

  if (typeof resource.latitude === 'number' && typeof resource.longitude === 'number') {
    return `https://www.google.com/maps/dir/?api=1&destination=${resource.latitude},${resource.longitude}`
  }
  if (resource.address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(resource.address)}`
  }
  return null
}

/**
 * Address text for display, or null. Use this instead of reading
 * resource.address directly.
 */
export function displayAddress(resource: Resource): string | null {
  if (!canShowLocation(resource)) return null
  return resource.address
}

/**
 * Strips location fields from a resource before it reaches anything that
 * serialises it (map payloads, share sheets, debug output). Defence in depth:
 * even if a future caller forgets the gate, there is nothing there to leak.
 */
export function redactLocation(resource: Resource): Resource {
  if (canShowLocation(resource)) return resource
  return {
    ...resource,
    address: null,
    latitude: null,
    longitude: null,
  }
}

/**
 * The number to offer when there is no location to show (and in general).
 * Hotline wins over the main line for gated resources: it is the number that
 * is staffed.
 */
export function contactNumber(resource: Resource): string | null {
  return resource.hotline ?? resource.phone ?? null
}
