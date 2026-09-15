import { Link } from 'react-router-dom'
import { canShowLocation } from '../lib/canShowLocation'
import { resourceDescription, resourceName, type Locale } from '../lib/i18n'
import type { Resource } from '../lib/types'
import { CategoryChip } from './CategoryChip'
import { OpenStatusBadge } from './OpenStatusBadge'

export function ResourceCard({ resource, locale }: { resource: Resource; locale: Locale }) {
  const name = resourceName(resource, locale)
  const description = resourceDescription(resource, locale)

  // The card shows a neighbourhood, never a street address, and only when the
  // resource is allowed to have a location at all.
  const neighborhood = canShowLocation(resource) ? resource.neighborhood : null

  return (
    <li className="card">
      <Link className="card-link" to={`/resource/${resource.id}`}>
        <h3>{name}</h3>
        <div className="card-meta">
          <CategoryChip category={resource.category} locale={locale} />
          <OpenStatusBadge resource={resource} locale={locale} />
        </div>
        {neighborhood ? <p className="neighborhood">{neighborhood}</p> : null}
        <p>{description}</p>
      </Link>
    </li>
  )
}
