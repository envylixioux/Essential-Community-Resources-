import { categoryStyle } from '../lib/categoryColors'
import { t, type Locale } from '../lib/i18n'
import type { Category } from '../lib/types'

/**
 * The category chip. Light tint, dark ink, and always the written name.
 * Colour is a reinforcement here, never the message: someone may not
 * distinguish these hues at all.
 */
export function CategoryTag({ category, locale }: { category: Category; locale: Locale }) {
  return (
    <span className="category-tag" style={categoryStyle(category)}>
      {t(category, locale)}
    </span>
  )
}
