import { t, type Locale } from '../lib/i18n'
import type { FairChanceType, ServiceProvided } from '../lib/types'

/**
 * The sub-type chips: what kind of fair-chance resource this is, or which
 * half of docs-and-expungement it covers.
 *
 * A workforce center serves everyone walking in. A placement program has an
 * intake and a waiting list. Those are different phone calls, and knowing
 * which one you are making before you make it is the point of these chips.
 */

export function FairChanceChip({
  type,
  locale,
  withHelp = false,
}: {
  type: FairChanceType
  locale: Locale
  withHelp?: boolean
}) {
  return (
    <>
      <span className="tag-chip">{t(`fairChance.${type}`, locale)}</span>
      {withHelp ? <p className="tag-help">{t(`fairChance.${type}.help`, locale)}</p> : null}
    </>
  )
}

export function ServiceChip({
  service,
  locale,
}: {
  service: ServiceProvided
  locale: Locale
}) {
  return <span className="tag-chip">{t(`service.${service}`, locale)}</span>
}
