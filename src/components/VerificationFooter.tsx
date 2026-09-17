import { t, type Locale } from '../lib/i18n'
import type { Resource } from '../lib/types'

/**
 * "Last verified [date] by [method]", plus a warning once that date is more
 * than 90 days old.
 *
 * Verified means a person called and confirmed. Saying when, and how, is what
 * lets a reader judge how much to trust the hours above — and the staleness
 * warning is the app admitting its own limits rather than letting someone
 * find out at a locked door.
 */
const STALE_AFTER_DAYS = 90

export function isStale(date: string, now: Date = new Date()): boolean {
  const verified = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(verified.getTime())) return false
  const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  cutoff.setUTCDate(cutoff.getUTCDate() - STALE_AFTER_DAYS)
  return verified < cutoff
}

export function VerificationFooter({
  resource,
  locale,
  now,
}: {
  resource: Resource
  locale: Locale
  now?: Date
}) {
  const date = resource.last_verified_at
  if (!date) return null

  const stale = isStale(date, now)
  const method = resource.verification_method?.trim()

  return (
    <footer className="verification">
      <p>
        {method
          ? t('lastVerifiedBy', locale, { date, method })
          : t('lastVerified', locale, { date })}
      </p>
      {stale ? <p className="verification-stale">{t('mayBeOutdated', locale)}</p> : null}
    </footer>
  )
}
