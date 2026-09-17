import {
  canShowLocation,
  contactNumber,
  directionsUrl,
  displayAddress,
} from '../lib/canShowLocation'
import { t, type Locale } from '../lib/i18n'
import type { Resource } from '../lib/types'

/**
 * The ONLY component in the app that renders an address or a Directions
 * button. Everything to do with where a resource is goes through here, so
 * there is exactly one place to audit.
 *
 * When canShowLocation is false:
 *   - no address text is produced
 *   - no Directions link is produced — it is absent from the DOM, not
 *     disabled and not hidden with CSS
 *   - the reader gets the phone or hotline and a Call button instead
 */
export function LocationBlock({ resource, locale }: { resource: Resource; locale: Locale }) {
  const phone = contactNumber(resource)

  if (!canShowLocation(resource)) {
    return (
      <div>
        <p className={resource.confidential_location ? 'notice notice-safety' : 'notice'}>
          {resource.confidential_location
            ? t('confidentialNotice', locale)
            : resource.access_type === 'online'
              ? t('onlineNotice', locale)
              : t('hotlineOnlyNotice', locale)}
        </p>
        <div className="actions">
          {phone ? (
            <a className="btn" href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
              {t('call', locale)} {phone}
            </a>
          ) : null}
          {resource.website ? (
            <a
              className="btn btn-secondary"
              href={resource.website}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t('website', locale)}
            </a>
          ) : null}
        </div>
        {!phone && !resource.website ? <p>{t('callInstead', locale)}</p> : null}
      </div>
    )
  }

  const address = displayAddress(resource)
  const directions = directionsUrl(resource)

  return (
    <div>
      {address ? <p>{address}</p> : null}
      {resource.neighborhood ? <p className="neighborhood">{resource.neighborhood}</p> : null}
      <div className="actions">
        {phone ? (
          <a className="btn" href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
            {t('call', locale)}
          </a>
        ) : null}
        {directions ? (
          <a
            className="btn btn-secondary"
            href={directions}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('directions', locale)}
          </a>
        ) : null}
        {resource.website ? (
          <a
            className="btn btn-secondary"
            href={resource.website}
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('website', locale)}
          </a>
        ) : null}
      </div>
    </div>
  )
}
