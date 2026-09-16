import { describe, expect, it } from 'vitest'
import { topEligibilityTag } from '../eligibility'
import { ELIGIBILITY_TAG_PRIORITY, type EligibilityTag } from '../types'

const withTags = (eligibility_tags: EligibilityTag[] | null) => ({ eligibility_tags })

describe('topEligibilityTag', () => {
  it('returns nothing when there are no tags', () => {
    expect(topEligibilityTag(withTags(null))).toBeNull()
    expect(topEligibilityTag(withTags([]))).toBeNull()
  })

  it('shows the only tag when there is one', () => {
    expect(topEligibilityTag(withTags(['free']))).toBe('free')
  })

  it('puts a blocker ahead of a convenience', () => {
    // Learning at the door that you needed a referral costs two bus rides.
    // Learning that it was also free costs nothing.
    expect(topEligibilityTag(withTags(['free', 'referral-needed']))).toBe('referral-needed')
    expect(topEligibilityTag(withTags(['walk-ins-welcome', 'women-only']))).toBe('women-only')
  })

  it('puts a restriction ahead of a barrier removed', () => {
    expect(topEligibilityTag(withTags(['no-id-needed', 'women-only']))).toBe('women-only')
  })

  it('follows the documented priority exactly', () => {
    const all = [...ELIGIBILITY_TAG_PRIORITY]
    for (let i = 0; i < all.length; i += 1) {
      // Every suffix of the priority list resolves to its own first entry,
      // whatever order the tags arrive in.
      expect(topEligibilityTag(withTags(all.slice(i).reverse()))).toBe(all[i])
    }
  })

  it('ignores a value that is not a known tag', () => {
    expect(topEligibilityTag(withTags(['not-a-tag' as EligibilityTag]))).toBeNull()
  })
})
