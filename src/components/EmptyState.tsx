import { Link } from 'react-router-dom'
import { t, type Locale } from '../lib/i18n'
import type { Category } from '../lib/types'

/**
 * What the app says when a filter finds nothing.
 *
 * The rule: never leave someone at a dead end. An empty state that
 * apologises and explains that it might be a connection problem hands the
 * reader their own problem back. If we do not have a listing, we hand them
 * to someone who does.
 *
 * Three concrete actions, always: a human on the phone, a wider search, and
 * a way to tell us what we are missing.
 */
export function EmptyState({
  locale,
  category,
  onWidenArea,
  canWidenArea,
}: {
  locale: Locale
  /** The filter that came back empty, carried into the suggestion form. */
  category: Category | 'all'
  onWidenArea: () => void
  /** False when the reader is already searching the whole county. */
  canWidenArea: boolean
}) {
  const suggestHref =
    category === 'all' ? '/suggest' : `/suggest?category=${encodeURIComponent(category)}`

  return (
    <section className="empty-state" aria-live="polite">
      <p className="empty-lead">{t('emptyLead', locale)}</p>

      <ul className="empty-actions">
        <li>
          <a className="empty-action" href="tel:211">
            <span className="empty-action-title">{t('call211', locale)}</span>
            <span className="empty-action-sub">{t('call211Sub', locale)}</span>
          </a>
        </li>

        {canWidenArea ? (
          <li>
            <button type="button" className="empty-action" onClick={onWidenArea}>
              <span className="empty-action-title">{t('tryWiderArea', locale)}</span>
              <span className="empty-action-sub">{t('tryWiderAreaSub', locale)}</span>
            </button>
          </li>
        ) : null}

        <li>
          <Link className="empty-action" to={suggestHref}>
            <span className="empty-action-title">{t('suggestFromEmpty', locale)}</span>
            <span className="empty-action-sub">{t('suggestFromEmptySub', locale)}</span>
          </Link>
        </li>
      </ul>
    </section>
  )
}
