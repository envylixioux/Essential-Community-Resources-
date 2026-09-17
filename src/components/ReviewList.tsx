import { useEffect, useState, type FormEvent } from 'react'
import { t, type Locale } from '../lib/i18n'
import { loadReviews, submitReview } from '../lib/resources'
import type { Review } from '../lib/types'

/**
 * Approved reviews, and a form to add one.
 *
 * Only approved reviews ever render — a public directory for people in a
 * vulnerable spot cannot carry an unmoderated comment field. A new review is
 * saved as pending and a person reads it before it appears.
 *
 * The note under the form is not boilerplate. A reviewer who names a staff
 * member or posts the address of a confidential shelter undoes the one
 * protection this app takes most seriously, and they will not think of that
 * unless asked.
 */

const MAX_REVIEW_LENGTH = 1000
const INITIALLY_SHOWN = 3

function Stars({ rating, locale }: { rating: number; locale: Locale }) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <span className="stars">
      <span aria-hidden="true">{'★'.repeat(clamped)}{'☆'.repeat(5 - clamped)}</span>
      <span className="visually-hidden">{t('starsOutOfFive', locale, { rating: clamped })}</span>
    </span>
  )
}

export function ReviewList({ resourceId, locale }: { resourceId: string; locale: Locale }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [expanded, setExpanded] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadReviews(resourceId)
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
  }, [resourceId])

  const shown = expanded ? reviews : reviews.slice(0, INITIALLY_SHOWN)

  return (
    <section className="detail-section">
      <h3 className="section-label">{t('reviews', locale)}</h3>

      {reviews.length === 0 ? (
        <p className="muted">{t('noReviews', locale)}</p>
      ) : (
        <>
          <ul className="review-list">
            {shown.map((review) => (
              <li className="review" key={review.id}>
                <Stars rating={review.rating} locale={locale} />
                {review.body ? <p className="review-body">{review.body}</p> : null}
                <p className="review-date">{review.created_at.slice(0, 10)}</p>
              </li>
            ))}
          </ul>
          {!expanded && reviews.length > INITIALLY_SHOWN ? (
            <button type="button" className="link-button" onClick={() => setExpanded(true)}>
              {t('showAllReviews', locale, { count: reviews.length })}
            </button>
          ) : null}
        </>
      )}

      {formOpen ? (
        <ReviewForm resourceId={resourceId} locale={locale} />
      ) : (
        <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(true)}>
          {t('addReview', locale)}
        </button>
      )}
    </section>
  )
}

type FormStatus = 'idle' | 'sending' | 'sent' | 'failed'

function ReviewForm({ resourceId, locale }: { resourceId: string; locale: Locale }) {
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (rating < 1) {
      setError(t('ratingRequired', locale))
      return
    }
    setStatus('sending')
    setError(null)
    try {
      await submitReview({ resource_id: resourceId, rating, body: body.trim() || null })
      setStatus('sent')
    } catch {
      setStatus('failed')
    }
  }

  if (status === 'sent') {
    return <p className="notice">{t('reviewThanks', locale)}</p>
  }

  return (
    <form className="review-form" onSubmit={handleSubmit} noValidate>
      <fieldset className="rating-field">
        <legend>
          {t('yourRating', locale)} <span aria-hidden="true">*</span>
        </legend>
        <div className="rating-buttons">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              type="button"
              key={value}
              className="rating-button"
              aria-pressed={rating === value}
              aria-label={t('starsOutOfFive', locale, { rating: value })}
              onClick={() => {
                setRating(value)
                setError(null)
              }}
            >
              <span aria-hidden="true">{value <= rating ? '★' : '☆'}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>{t('yourReview', locale)}</span>
        <textarea
          value={body}
          maxLength={MAX_REVIEW_LENGTH}
          onChange={(event) => setBody(event.target.value)}
        />
        <span className="field-hint" aria-live="polite">
          {t('charactersLeft', locale, { count: MAX_REVIEW_LENGTH - body.length })}
        </span>
      </label>

      {/* Asked before they write, not after they post. */}
      <p className="field-hint review-safety-note">{t('reviewSafetyNote', locale)}</p>

      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      {status === 'failed' ? <p className="field-error">{t('submitFailed', locale)}</p> : null}

      <button type="submit" className="btn" disabled={status === 'sending'}>
        {status === 'sending' ? t('submitting', locale) : t('submitReview', locale)}
      </button>
    </form>
  )
}
