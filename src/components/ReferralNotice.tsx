import { t, type Locale } from '../lib/i18n'

/**
 * Shown when a resource needs a referral before someone can be seen.
 *
 * Deliberately positioned BELOW the Call button, never above it. A referral
 * requirement is not a reason to hide the phone number: calling to ask how to
 * get the referral is exactly what someone should do next.
 */
export function ReferralNotice({ note, locale }: { note: string | null; locale: Locale }) {
  return (
    <aside className="referral-notice">
      <p className="referral-title">{t('referralRequired', locale)}</p>
      <p>{note?.trim() || t('referralDefault', locale)}</p>
    </aside>
  )
}
