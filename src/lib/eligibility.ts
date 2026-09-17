import { ELIGIBILITY_TAG_PRIORITY, type EligibilityTag, type Resource } from './types'

/**
 * Picks the single most useful eligibility tag for a card.
 *
 * The card shows one; the detail page shows them all. Which one earns the
 * slot follows ELIGIBILITY_TAG_PRIORITY: restrictions before conveniences.
 * Finding out at the door that you needed a referral costs two bus rides.
 * Finding out that it was also free costs nothing.
 */
export function topEligibilityTag(
  resource: Pick<Resource, 'eligibility_tags'>,
): EligibilityTag | null {
  const tags = resource.eligibility_tags
  if (!tags || tags.length === 0) return null
  return ELIGIBILITY_TAG_PRIORITY.find((candidate) => tags.includes(candidate)) ?? null
}
