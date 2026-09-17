import { formatForDisplay, getOpenStatus } from '../lib/hours'
import { t, type Locale } from '../lib/i18n'
import type { Resource } from '../lib/types'

/**
 * Open / closed / unknown, computed against Los Angeles time.
 *
 * "Unknown" is a first-class answer. If we do not have hours we say so
 * instead of implying a door is open.
 */
export function OpenStatusBadge({
  resource,
  locale,
  now,
}: {
  resource: Resource
  locale: Locale
  now?: Date
}) {
  const status = getOpenStatus(resource, now)

  if (status.alwaysOpen) {
    return (
      <span className="status status-open">
        <span className="status-dot" aria-hidden="true" />
        {t('open24', locale)}
      </span>
    )
  }

  if (status.state === 'open') {
    return (
      <span className="status status-open">
        <span className="status-dot" aria-hidden="true" />
        {t('openNow', locale)}
        {status.closesAt ? (
          <span className="neighborhood">
            {' · '}
            {t('closesAt', locale, { time: formatForDisplay(status.closesAt, locale) })}
          </span>
        ) : null}
      </span>
    )
  }

  if (status.state === 'closed') {
    return (
      <span className="status status-closed">
        <span className="status-dot" aria-hidden="true" />
        {t('closed', locale)}
        {status.opensAt ? (
          <span className="neighborhood">
            {' · '}
            {t(status.opensNextDay ? 'opensNextDay' : 'opensAt', locale, {
              time: formatForDisplay(status.opensAt, locale),
            })}
          </span>
        ) : null}
      </span>
    )
  }

  return (
    <span className="status status-unknown">
      <span className="status-dot" aria-hidden="true" />
      {t('hoursUnknown', locale)}
    </span>
  )
}
