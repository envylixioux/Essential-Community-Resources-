import { useNavigate } from 'react-router-dom'
import { canShowLocation } from '../lib/canShowLocation'
import { formatMiles } from '../lib/distance'
import { topEligibilityTag } from '../lib/eligibility'
import { resourceName, t, type Locale } from '../lib/i18n'
import type { Resource } from '../lib/types'
import { ActionButtons } from './ActionButtons'
import { CategoryTag } from './CategoryTag'
import { OpenClosedStatus } from './OpenClosedStatus'

/**
 * The resource card. The most-seen component in the app.
 *
 * Action first: category, name, whether it is open, one line of context, then
 * Call and Map. Hours, eligibility and reviews are real and important, and
 * they live on the detail page. Nobody reads hours if they cannot find the
 * phone number.
 *
 * The whole card navigates to the detail page; the two buttons do their own
 * thing and stop the tap from bubbling. That is handled inside ActionButtons.
 */
export function ResourceCard({
  resource,
  locale,
  distanceMiles,
}: {
  resource: Resource
  locale: Locale
  /** Only present when the reader granted geolocation. */
  distanceMiles?: number
}) {
  const navigate = useNavigate()
  const href = `/resource/${resource.id}`

  return (
    <li className="card">
      {/*
        A div rather than an anchor wrapping everything: an anchor cannot
        legally contain the two action anchors inside it, and screen readers
        handle the nesting badly. The heading below carries the real link, so
        keyboard and assistive-technology users get a proper one; the card
        surface is a convenience for thumbs.
      */}
      <div
        className="card-body"
        onClick={() => navigate(href)}
        role="presentation"
      >
        <CategoryTag category={resource.category} locale={locale} />

        <h3 className="card-title">
          <a
            href={href}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              navigate(href)
            }}
          >
            {resourceName(resource, locale)}
          </a>
        </h3>

        <OpenClosedStatus
          hours={resource.hours}
          open24Hours={resource.open_24_hours}
          locale={locale}
        />

        <MetaLine resource={resource} locale={locale} distanceMiles={distanceMiles} />

        <ActionButtons resource={resource} locale={locale} size="card" />
      </div>
    </li>
  )
}

/**
 * Distance, neighbourhood, and at most one eligibility tag.
 *
 * For a resource whose location is withheld this is replaced entirely by the
 * safety line — there is no distance and no neighbourhood to give, and saying
 * why is better than leaving a gap.
 */
function MetaLine({
  resource,
  locale,
  distanceMiles,
}: {
  resource: Resource
  locale: Locale
  distanceMiles?: number
}) {
  if (!canShowLocation(resource)) {
    return <p className="meta-line">{t('locationPrivateShort', locale)}</p>
  }

  const parts: string[] = []
  if (typeof distanceMiles === 'number') parts.push(formatMiles(distanceMiles, locale))
  if (resource.neighborhood) parts.push(resource.neighborhood)

  const tag = topEligibilityTag(resource)
  if (tag) parts.push(t(`tag.${tag}`, locale))

  if (parts.length === 0) return null
  return <p className="meta-line">{parts.join(' · ')}</p>
}
