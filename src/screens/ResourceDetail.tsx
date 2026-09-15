import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CategoryChip } from '../components/CategoryChip'
import { LocationBlock } from '../components/LocationBlock'
import { OpenStatusBadge } from '../components/OpenStatusBadge'
import { ResourceListSkeleton } from '../components/Skeletons'
import { useApp } from '../lib/AppContext'
import { formatForDisplay, laNow, WEEKDAYS } from '../lib/hours'
import {
  resourceDescription,
  resourceEligibility,
  resourceName,
  t,
  type Locale,
} from '../lib/i18n'
import { loadReviews } from '../lib/resources'
import type { Resource, Review } from '../lib/types'

const WEEKDAY_LABELS: Record<string, { en: string; es: string }> = {
  sunday: { en: 'Sunday', es: 'Domingo' },
  monday: { en: 'Monday', es: 'Lunes' },
  tuesday: { en: 'Tuesday', es: 'Martes' },
  wednesday: { en: 'Wednesday', es: 'Miércoles' },
  thursday: { en: 'Thursday', es: 'Jueves' },
  friday: { en: 'Friday', es: 'Viernes' },
  saturday: { en: 'Saturday', es: 'Sábado' },
}

function HoursTable({ resource, locale }: { resource: Resource; locale: Locale }) {
  if (resource.open_24_hours) return <p>{t('open24', locale)}</p>
  if (!resource.hours || Object.keys(resource.hours).length === 0) {
    return <p>{t('hoursUnknown', locale)}</p>
  }

  const todayIndex = laNow().weekday

  return (
    <table className="hours-table">
      <tbody>
        {WEEKDAYS.map((day, index) => {
          const ranges = resource.hours?.[day]
          const label = WEEKDAY_LABELS[day][locale]
          let value: string
          if (ranges === undefined) value = t('hoursUnknown', locale)
          else if (ranges.length === 0) value = t('closed', locale)
          else {
            value = ranges
              .map(
                (range) =>
                  `${formatForDisplay(range.open, locale)} – ${formatForDisplay(range.close, locale)}`,
              )
              .join(', ')
          }
          return (
            <tr key={day} className={index === todayIndex ? 'today' : undefined}>
              <th scope="row">{label}</th>
              <td>{value}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>()
  const { locale, resources, loading } = useApp()
  const [reviews, setReviews] = useState<Review[]>([])

  const resource = resources.find((item) => item.id === id)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    // Approved reviews only; loadReviews enforces that server-side too.
    loadReviews(id)
      .then((rows) => {
        if (!cancelled) setReviews(rows)
      })
      .catch(() => {
        // A missing review list is not worth blocking the page over.
        if (!cancelled) setReviews([])
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="page">
        <ResourceListSkeleton count={1} label={t('loading', locale)} />
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="page">
        <p>{t('noResults', locale)}</p>
        <Link className="back-link" to="/">
          ← {t('home', locale)}
        </Link>
      </div>
    )
  }

  const eligibility = resourceEligibility(resource, locale)

  return (
    <div className="page detail">
      <Link className="back-link" to="/">
        ← {t('back', locale)}
      </Link>

      <h2>{resourceName(resource, locale)}</h2>
      <div className="card-meta">
        <CategoryChip category={resource.category} locale={locale} />
        <OpenStatusBadge resource={resource} locale={locale} />
      </div>

      <p>{resourceDescription(resource, locale)}</p>

      {/* Every address, map link and Directions button in the app comes from
          this component, which gates on canShowLocation. */}
      <LocationBlock resource={resource} locale={locale} />

      <section>
        <h3>{t('hours', locale)}</h3>
        <HoursTable resource={resource} locale={locale} />
      </section>

      {eligibility ? (
        <section>
          <h3>{t('eligibility', locale)}</h3>
          <p>{eligibility}</p>
        </section>
      ) : null}

      {resource.languages && resource.languages.length > 0 ? (
        <section>
          <h3>{t('languages', locale)}</h3>
          <p>{resource.languages.join(', ')}</p>
        </section>
      ) : null}

      <section>
        <h3>{t('reviews', locale)}</h3>
        {reviews.length === 0 ? (
          <p>{t('noReviews', locale)}</p>
        ) : (
          <ul className="resource-list">
            {reviews.map((review) => (
              <li className="card" key={review.id}>
                <div style={{ padding: 14 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    {'★'.repeat(Math.max(0, Math.min(5, review.rating)))}
                    <span className="visually-hidden"> {review.rating} / 5</span>
                  </p>
                  {review.body ? <p>{review.body}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
