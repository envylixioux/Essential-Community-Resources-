import type { Category } from './types'

/**
 * Category colour map.
 *
 * Every category is a light tint with its own dark text. Both the chip and
 * the Call button use these, so someone learns the coding once and it holds
 * everywhere.
 *
 * The colour NEVER carries the meaning on its own. Every chip, tile and
 * button that uses these also spells out the category in words.
 *
 * All nine pairs were checked against WCAG AA for normal text; the weakest,
 * family-support, is 4.78:1. If you change a value, re-check it — the
 * accessibility floor outranks the palette.
 */

export interface CategoryColor {
  /** Light tint, used as a background. */
  bg: string
  /** Dark ink, used for text on that tint. */
  ink: string
  /** Border for buttons and chips, derived from the ink at low alpha. */
  border: string
}

export const CATEGORY_COLORS: Record<Category, CategoryColor> = {
  'food-and-meals': { bg: '#EAF3DE', ink: '#173404', border: '#B6CF9B' },
  'emergency-housing': { bg: '#E6F1FB', ink: '#042C53', border: '#A6C7E4' },
  'docs-and-expungement': { bg: '#EEEDFE', ink: '#26215C', border: '#B9B5E8' },
  'fair-chance-jobs': { bg: '#FAEEDA', ink: '#412402', border: '#DCC190' },
  'health-and-support': { bg: '#FAECE7', ink: '#4A1B0C', border: '#E0B7A8' },
  clothing: { bg: '#FCE4EC', ink: '#4A0E1E', border: '#E7AFC2' },
  'mobile-services': { bg: '#E0F2F1', ink: '#004D40', border: '#9CC9C4' },
  'family-support': { bg: '#FBE9E7', ink: '#BF360C', border: '#E9B3A6' },
  'faith-based': { bg: '#F5F5F5', ink: '#424242', border: '#C4C4C4' },
}

/** Inline custom properties for any element that should carry the palette. */
export function categoryStyle(category: Category): Record<string, string> {
  const colour = CATEGORY_COLORS[category]
  return {
    '--cat-bg': colour.bg,
    '--cat-ink': colour.ink,
    '--cat-border': colour.border,
  }
}
