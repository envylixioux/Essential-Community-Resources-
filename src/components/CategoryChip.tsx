import { t, type Locale } from '../lib/i18n'
import type { Category } from '../lib/types'

/**
 * Category is always spelled out in text next to its colour. Colour alone
 * never carries meaning — someone may not distinguish these hues at all.
 */
export function CategoryChip({ category, locale }: { category: Category; locale: Locale }) {
  return <span className={`chip chip-${category}`}>{t(category, locale)}</span>
}
