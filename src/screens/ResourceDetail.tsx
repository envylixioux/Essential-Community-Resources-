import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ActionButtons } from '../components/ActionButtons'
import { CategoryTag } from '../components/CategoryTag'
import { OpenClosedStatus } from '../components/OpenClosedStatus'
import { ReferralNotice } from '../components/ReferralNotice'
import { ReviewList } from '../components/ReviewList'
import { ScrollHint } from '../components/ScrollHint'
import { ResourceListSkeleton } from '../components/Skeletons'
import { FairChanceChip, ServiceChip } from '../components/TagChip'
import { VerificationFooter } from '../components/VerificationFooter'
import { useApp } from '../lib/AppContext'
import { canShowLocation, directionsUrl, displayAddress } from '../lib/canShowLocation'
import { categoryStyle } from '../lib/categoryColors'
import { formatForDisplay, laNow, WEEKDAYS } from '../lib/hours'
import {
  localizedField,
  resourceDescription,
  resourceEligibility,
  resourceName,
  t,
  type Locale,
} from '../lib/i18n'
import { loadReviews } from '../lib/resources'
import type { Resource, Review, Weekday } from '../lib/types'

const WEEKDAY_LABELS: Record<Weekday, { en: string; es: string }> = {
  sunday: { en: 'Sunday', es: 'Domingo' },
  monday: { en: 'Monday', es: 'Lunes' },
  tuesday: { en: 'Tuesday', es: 'Martes' },
  wednesday: { en: 'Wednesday', es: 'Miércoles' },
  thursday: { en: 'Thursday', es: 'Jueves' },
  friday: { en: 'Friday', es: 'Viernes' },
  saturday: { en: 'Saturday', es: 'Sábado' },
}

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>()
  const { locale, resources, loading } = useApp()
  const [reviews, setReviews] = useState<Review[]>([])

  const resource = resources.find((item) => item.id === id)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    loadReviews(id)
      .then((rows) => {
        if (!cancelled) setReviews(rows)
      })
      .catch(() => {
        if (!cancelled) setReviews([])
      })
    return () => {
      cancelled = true
    }
  }, [id])

  // Every page starts at the top, or the scroll hint would be lying.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  const summary = useMemo(() => {
    if (reviews.length === 0) return null
    const total = reviews.reduce((sum, review) => sum + review.rating, 0)
    return { average: total / reviews.length, count: reviews.length }
  }, [reviews])

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

  return (
    <div className="page detail" style={categoryStyle(resource.category)}>
      <DetailHeader resource={resource} locale={locale} />

      {/* --- Above the fold: everything here is an action. --------------- */}
      <CategoryTag category={resource.category} locale={locale} />

      <h2 className="detail-title">{resourceName(resource, locale)}</h2>

      {summary ? (
        <p className="rating-line">
          <span aria-hidden="true">⭐</span>{' '}
          {t('ratingSummary', locale, {
            rating: summary.average.toFixed(1),
            count: summary.count,
          })}
        </p>
      ) : null}

      <OpenClosedStatus
        hours={resource.hours}
        open24Hours={resource.open_24_hours}
        locale={locale}
      />

      {!canShowLocation(resource) ? (
        <p className="meta-line">{t('locationPrivateShort', locale)}</p>
      ) : null}

      <ActionButtons resource={resource} locale={locale} size="detail" />

      <ScrollHint locale={locale} />

      {/* --- Below the fold: context, in the order people look for it. --- */}
      <AddressSection resource={resource} locale={locale} />
      <HoursSection resource={resource} locale={locale} />
      <ContactSection resource={resource} locale={locale} />
      <WhatToKnowSection resource={resource} locale={locale} />

      {/* Below the Call button on purpose. A referral requirement is not a
          reason to hide the number — calling to ask how to get the referral
          is exactly the right next step. */}
      {resource.referral_required ? (
        <ReferralNotice
          note={localizedField(locale, resource.referral_note, resource.referral_note_es)}
          locale={locale}
        />
      ) : null}

      <ReviewList resourceId={resource.id} locale={locale} />

      <section className="detail-section">
        <h3 className="section-label">{t('about', locale)}</h3>
        <p>{resourceDescription(resource, locale)}</p>
      </section>

      <VerificationFooter resource={resource} locale={locale} />
    </div>
  )
}

/**
 * Back link, language toggle, and the browser's own share sheet where one
 * exists. No custom share UI: the platform sheet already knows every app the
 * reader has, and a home-grown one would know none of them.
 */
function DetailHeader({ resource, locale }: { resource: Resource; locale: Locale }) {
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  return (
    <div className="detail-header">
      <Link className="back-link" to="/">
        <span aria-hidden="true">←</span> {t('back', locale)}
      </Link>

      {canShare ? (
        <button
          type="button"
          className="share-button"
          aria-label={t('share', locale)}
          onClick={() => {
            navigator
              .share({ title: resourceName(resource, locale), url: window.location.href })
              .catch(() => {
                // The reader dismissed the sheet. Nothing to report.
              })
          }}
        >
          <span aria-hidden="true">↗</span>
        </button>
      ) : null}
    </div>
  )
}

function AddressSection({ resource, locale }: { resource: Resource; locale: Locale }) {
  // Goes through the gate like every other place an address could appear.
  const address = displayAddress(resource)
  const directions = directionsUrl(resource)
  if (!address) return null

  return (
    <section className="detail-section">
      <h3 className="section-label">{t('address', locale)}</h3>
      {directions ? (
        <a className="address-link" href={directions} rel="noopener noreferrer" target="_blank">
          {address}
        </a>
      ) : (
        <p>{address}</p>
      )}
      {resource.neighborhood ? <p className="muted">{resource.neighborhood}</p> : null}
    </section>
  )
}

function HoursSection({ resource, locale }: { resource: Resource; locale: Locale }) {
  const note = localizedField(locale, resource.hours_note, resource.hours_note_es)

  if (resource.open_24_hours) {
    return (
      <section className="detail-section">
        <h3 className="section-label">{t('hours', locale)}</h3>
        <p>{t('open24Full', locale)}</p>
        {note ? <p className="hours-note">ℹ️ {note}</p> : null}
      </section>
    )
  }

  if (!resource.hours || Object.keys(resource.hours).length === 0) {
    return (
      <section className="detail-section">
        <h3 className="section-label">{t('hours', locale)}</h3>
        <p>{t('hoursUnknown', locale)}</p>
        {note ? <p className="hours-note">ℹ️ {note}</p> : null}
      </section>
    )
  }

  const todayIndex = laNow().weekday

  return (
    <section className="detail-section">
      <h3 className="section-label">{t('hours', locale)}</h3>
      <table className="hours-table">
        <tbody>
          {WEEKDAYS.map((day, index) => {
            const ranges = resource.hours?.[day]
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
                <th scope="row">{WEEKDAY_LABELS[day][locale]}</th>
                <td>{value}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {note ? <p className="hours-note">ℹ️ {note}</p> : null}
    </section>
  )
}

/** Phone numbers are never plain text. One tap dials. */
function ContactSection({ resource, locale }: { resource: Resource; locale: Locale }) {
  const numbers = [resource.hotline, resource.phone].filter(
    (value): value is string => Boolean(value),
  )
  if (numbers.length === 0 && !resource.website && !resource.email) return null

  return (
    <section className="detail-section">
      <h3 className="section-label">{t('contact', locale)}</h3>
      <ul className="contact-list">
        {numbers.map((number) => (
          <li key={number}>
            <a className="contact-link" href={`tel:${number.replace(/[^\d+]/g, '')}`}>
              {number}
            </a>
          </li>
        ))}
        {resource.website ? (
          <li>
            <a
              className="contact-link"
              href={resource.website}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t('website', locale)} <span aria-hidden="true">↗</span>
            </a>
          </li>
        ) : null}
        {resource.email ? (
          <li>
            <a className="contact-link" href={`mailto:${resource.email}`}>
              {resource.email}
            </a>
          </li>
        ) : null}
      </ul>
    </section>
  )
}

function WhatToKnowSection({ resource, locale }: { resource: Resource; locale: Locale }) {
  const eligibility = resourceEligibility(resource, locale)
  const serves = localizedField(locale, resource.serves_population, resource.serves_population_es)
  const cost = localizedField(locale, resource.cost, resource.cost_es)
  const tags = resource.eligibility_tags ?? []
  const hasAccess = resource.wheelchair_accessible !== null
  const languages = resource.languages ?? []

  if (
    !eligibility &&
    !serves &&
    !cost &&
    tags.length === 0 &&
    !hasAccess &&
    languages.length === 0 &&
    !resource.fair_chance_type &&
    !resource.service_provided
  ) {
    return null
  }

  return (
    <section className="detail-section">
      <h3 className="section-label">{t('whatToKnow', locale)}</h3>

      {serves ? <p className="serves-population">{serves}</p> : null}

      {tags.length > 0 ? (
        <ul className="eligibility-tags">
          {tags.map((tag) => (
            <li className="eligibility-tag" key={tag}>
              {t(`tag.${tag}`, locale)}
            </li>
          ))}
        </ul>
      ) : null}

      {resource.fair_chance_type ? (
        <div className="tag-block">
          <FairChanceChip type={resource.fair_chance_type} locale={locale} withHelp />
        </div>
      ) : null}

      {resource.service_provided ? (
        <div className="tag-block">
          <ServiceChip service={resource.service_provided} locale={locale} />
        </div>
      ) : null}

      {eligibility ? <p>{eligibility}</p> : null}

      <dl className="fact-list">
        {cost ? (
          <>
            <dt>{t('cost', locale)}</dt>
            <dd>{cost}</dd>
          </>
        ) : null}
        {languages.length > 0 ? (
          <>
            <dt>{t('languages', locale)}</dt>
            <dd>{languages.join(', ')}</dd>
          </>
        ) : null}
        {hasAccess ? (
          <>
            <dt>{t('wheelchair', locale)}</dt>
            <dd>{resource.wheelchair_accessible ? t('yes', locale) : t('no', locale)}</dd>
          </>
        ) : null}
      </dl>
    </section>
  )
}
