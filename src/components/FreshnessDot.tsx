import { useId, useState } from 'react'
import { computeFreshness, type Freshness } from '../lib/freshness'
import { t, type Locale } from '../lib/i18n'
import type { Resource } from '../lib/types'

/**
 * One dot saying how current the local data is. Tap or hover for the number.
 *
 * Transparency, not gamification. The whole feature is this element: if it
 * ever grows into a dashboard, that is a sign it has stopped being useful to
 * the reader and started being useful to us.
 *
 * The label is never colour alone — the dot has a text tooltip and an
 * accessible name that states the level in words.
 */
export function FreshnessDot({
  resources,
  locale,
  now,
}: {
  resources: Resource[]
  locale: Locale
  now?: Date
}) {
  // Hover and click are tracked separately on purpose. Sharing one flag means
  // a mouse user hovers (opens), clicks (toggles closed), and the tooltip
  // vanishes under the cursor they just aimed at it.
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const open = pinned || hovered
  const tooltipId = useId()
  const freshness: Freshness = computeFreshness(resources, now)

  const levelLabel =
    freshness.level === 'green'
      ? t('freshnessGreen', locale)
      : freshness.level === 'amber'
        ? t('freshnessAmber', locale)
        : freshness.level === 'red'
          ? t('freshnessRed', locale)
          : t('freshnessNone', locale)

  const detail =
    freshness.level === 'none'
      ? t('freshnessNone', locale)
      : t('freshnessDetail', locale, {
          percent: freshness.percent,
          date: freshness.mostRecent ?? '',
        })

  return (
    <span className="freshness">
      <button
        type="button"
        className={`freshness-dot freshness-${freshness.level}`}
        aria-describedby={open ? tooltipId : undefined}
        aria-label={levelLabel}
        onClick={() => setPinned((value) => !value)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => {
          setHovered(false)
          setPinned(false)
        }}
      >
        <span className="freshness-mark" aria-hidden="true" />
      </button>
      {open ? (
        <span className="freshness-tooltip" id={tooltipId} role="tooltip">
          {detail}
        </span>
      ) : null}
    </span>
  )
}
