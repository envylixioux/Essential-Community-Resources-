import { t, type Locale } from '../lib/i18n'
import { CATEGORIES, type Category } from '../lib/types'

/**
 * A tile grid above the resource list: a second door into the same data,
 * for someone who does not know the app's vocabulary yet.
 *
 * It does not replace the filter pills and neither one hides behind a menu.
 * Browsing and knowing-what-you-want are different jobs and both stay on
 * screen.
 *
 * Each tile carries an emoji AND a written label. The emoji is decorative and
 * hidden from screen readers; the label is what conveys the category, here as
 * everywhere else in the app.
 */

const TILE_EMOJI: Record<Category, string> = {
  'emergency-housing': '🏠',
  'fair-chance-jobs': '💼',
  'docs-and-expungement': '🪪',
  'food-and-meals': '🍎',
  'health-and-support': '🏥',
  clothing: '👕',
}

export function QuickFinder({
  locale,
  active,
  onSelect,
}: {
  locale: Locale
  active: Category | 'all'
  onSelect: (category: Category) => void
}) {
  return (
    <section aria-labelledby="quick-finder-heading">
      <h2 className="section-heading" id="quick-finder-heading">
        {t('quickFinder', locale)}
      </h2>
      <ul className="tiles">
        {CATEGORIES.map((category) => (
          <li key={category}>
            <button
              type="button"
              className={`tile tile-${category}`}
              aria-pressed={active === category}
              onClick={() => onSelect(category)}
            >
              <span className="tile-emoji" aria-hidden="true">
                {TILE_EMOJI[category]}
              </span>
              <span className="tile-label">{t(`tile.${category}`, locale)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
