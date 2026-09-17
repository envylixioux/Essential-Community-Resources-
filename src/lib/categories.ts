import type { Category, LegacyCategory, Resource } from './types'
import { CATEGORIES } from './types'

/**
 * Category compatibility layer.
 *
 * The categories were renamed from directory language ('shelter',
 * 'employment') to what someone would actually say they need
 * ('emergency-housing', 'fair-chance-jobs'). Callers that still pass an old
 * name keep working for one release cycle and get a console warning naming
 * the replacement.
 *
 * REMOVE THIS FILE'S LEGACY HALF when the warnings stop appearing. Delete
 * LEGACY_CATEGORY_MAP, resolveCategory's legacy branch, and the
 * LegacyCategory type in types.ts together.
 */

export const LEGACY_CATEGORY_MAP: Record<LegacyCategory, Category> = {
  shelter: 'emergency-housing',
  employment: 'fair-chance-jobs',
  documents: 'docs-and-expungement',
  food: 'food-and-meals',
  crisis: 'health-and-support',
}

const warned = new Set<string>()

function isCategory(value: string): value is Category {
  return (CATEGORIES as string[]).includes(value)
}

function isLegacyCategory(value: string): value is LegacyCategory {
  return Object.prototype.hasOwnProperty.call(LEGACY_CATEGORY_MAP, value)
}

/**
 * Accepts a current or a legacy category name and returns the current one.
 * Returns null for anything else rather than guessing.
 *
 * The warning is a console message for the team, never a network call. This
 * app sends no telemetry anywhere.
 */
export function resolveCategory(value: string): Category | null {
  if (isCategory(value)) return value

  if (isLegacyCategory(value)) {
    const replacement = LEGACY_CATEGORY_MAP[value]
    if (!warned.has(value)) {
      warned.add(value)
      console.warn(
        `[quick-connect-la] Category "${value}" is deprecated and will be removed ` +
          `after this release. Use "${replacement}". Resolving to it for now.`,
      )
    }
    return replacement
  }

  return null
}

/** Test seam: lets a test assert the warning fires once per distinct name. */
export function __resetDeprecationWarnings(): void {
  warned.clear()
}

/**
 * Categories whose listings carry a required sub-type. A resource in one of
 * these without its tag set is incomplete data, and incomplete data does not
 * render — same rule as `verified`.
 */
export function requiresFairChanceType(category: Category): boolean {
  return category === 'fair-chance-jobs'
}

export function requiresServiceProvided(category: Category): boolean {
  return category === 'docs-and-expungement'
}

/**
 * True when a resource carries every tag its category requires.
 *
 * A fair-chance-jobs listing with no fair_chance_type is the case this exists
 * for. "Fair chance employer" is a claim, and publishing it untagged means an
 * applicant walks in on our say-so and gets rejected over their record. If we
 * cannot say what kind of fair-chance resource it is, we do not list it.
 */
export function hasRequiredTags(resource: Resource): boolean {
  if (requiresFairChanceType(resource.category) && !resource.fair_chance_type) {
    return false
  }
  if (requiresServiceProvided(resource.category) && !resource.service_provided) {
    return false
  }
  return true
}

/** Explains, for the team, why a row was withheld. Never shown to readers. */
export function missingTagReason(resource: Resource): string | null {
  if (requiresFairChanceType(resource.category) && !resource.fair_chance_type) {
    return `resource ${resource.id} is in fair-chance-jobs with no fair_chance_type`
  }
  if (requiresServiceProvided(resource.category) && !resource.service_provided) {
    return `resource ${resource.id} is in docs-and-expungement with no service_provided`
  }
  return null
}
