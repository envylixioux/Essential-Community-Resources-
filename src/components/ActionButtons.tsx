import type { MouseEvent } from 'react'
import { canShowLocation, contactNumber, directionsUrl } from '../lib/canShowLocation'
import { categoryStyle } from '../lib/categoryColors'
import { t, type Locale } from '../lib/i18n'
import type { Resource } from '../lib/types'

/**
 * Call and Map, the two things somebody actually came here to do.
 *
 * Identical output on the card and on the detail page, so the action a person
 * learned on one screen is in the same place on the other. Only the height
 * differs: the detail page is the primary action and gets more thumb.
 *
 * The location gate decides the shape. When canShowLocation is false the Map
 * button is not rendered at all — not disabled, not hidden with CSS — and
 * Call takes the full width and reads "Call now".
 */

/** Strips a phone number down to what a dialler will accept. */
function dialable(value: string): string {
  return value.replace(/[^\d+]/g, '')
}

export function ActionButtons({
  resource,
  locale,
  size = 'card',
}: {
  resource: Resource
  locale: Locale
  size?: 'card' | 'detail'
}) {
  const phone = contactNumber(resource)
  const directions = canShowLocation(resource) ? directionsUrl(resource) : null
  const full = directions === null

  // The card is itself a link to the detail page. These buttons sit inside it
  // and must not also navigate, so their taps stop here.
  const stop = (event: MouseEvent) => event.stopPropagation()

  return (
    <div className={`actions actions-${size}`} style={categoryStyle(resource.category)}>
      {phone ? (
        <a
          className={`action action-call${full ? ' action-full' : ''}`}
          href={`tel:${dialable(phone)}`}
          onClick={stop}
        >
          <span aria-hidden="true">📞</span>
          {full ? t('callNow', locale) : t('call', locale)}
        </a>
      ) : null}

      {directions ? (
        <a
          className="action action-map"
          href={directions}
          rel="noopener noreferrer"
          target="_blank"
          onClick={stop}
        >
          <span aria-hidden="true">📍</span>
          {t('mapButton', locale)}
        </a>
      ) : null}
    </div>
  )
}
