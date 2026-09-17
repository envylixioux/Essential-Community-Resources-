import { formatForDisplay, getOpenStatus } from '../lib/hours'
import { t, type Locale } from '../lib/i18n'
import type { Hours, Weekday } from '../lib/types'

/**
 * "Open now · closes 5:00pm" or "Closed · opens 8:00am Monday".
 *
 * Computed against Los Angeles wall-clock time, never the browser's: the
 * reader could be in any timezone and a wrong answer sends them to a locked
 * door.
 *
 * "Hours not confirmed" is a first-class answer. When we do not know, we say
 * so rather than implying a door is open.
 */

const WEEKDAY_NAMES: Record<Weekday, { en: string; es: string }> = {
  sunday: { en: 'Sunday', es: 'el domingo' },
  monday: { en: 'Monday', es: 'el lunes' },
  tuesday: { en: 'Tuesday', es: 'el martes' },
  wednesday: { en: 'Wednesday', es: 'el miércoles' },
  thursday: { en: 'Thursday', es: 'el jueves' },
  friday: { en: 'Friday', es: 'el viernes' },
  saturday: { en: 'Saturday', es: 'el sábado' },
}

export function OpenClosedStatus({
  hours,
  open24Hours,
  locale,
  now,
}: {
  hours: Hours | null
  open24Hours: boolean
  locale: Locale
  now?: Date
}) {
  const status = getOpenStatus({ hours, open_24_hours: open24Hours }, now)

  if (status.alwaysOpen) {
    return <p className="status-line status-open">{t('open24', locale)}</p>
  }

  if (status.state === 'open') {
    const closes = status.closesAt
      ? ` · ${t('closesAtShort', locale, { time: formatForDisplay(status.closesAt, locale) })}`
      : ''
    return (
      <p className="status-line status-open">
        {t('openNow', locale)}
        {closes}
      </p>
    )
  }

  if (status.state === 'closed') {
    let opens = ''
    if (status.opensAt) {
      const time = formatForDisplay(status.opensAt, locale)
      opens = status.opensNextDay && status.opensOnWeekday
        ? ` · ${t('opensAtOnDay', locale, {
            time,
            day: WEEKDAY_NAMES[status.opensOnWeekday][locale],
          })}`
        : ` · ${t('opensAtShort', locale, { time })}`
    }
    return (
      <p className="status-line status-closed">
        {t('closed', locale)}
        {opens}
      </p>
    )
  }

  return <p className="status-line status-closed">{t('hoursUnknown', locale)}</p>
}
