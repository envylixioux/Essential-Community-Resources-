import { useEffect, useMemo, useRef, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { HotlinesStrip } from '../components/HotlinesStrip'
import { LocationIndicator } from '../components/LocationIndicator'
import { QuickFinder } from '../components/QuickFinder'
import { ResourceCard } from '../components/ResourceCard'
import { ResourceListSkeleton } from '../components/Skeletons'
import { useApp } from '../lib/AppContext'
import { resourceDescription, resourceName, t } from '../lib/i18n'
import { distanceMilesFrom } from '../lib/canShowLocation'
import { CATEGORIES, type Category, type Resource, type ServiceProvided } from '../lib/types'

/** The two halves of docs-and-expungement, as a secondary multi-select. */
const DOC_SERVICES: ServiceProvided[] = ['id-replacement', 'expungement']

export default function Home() {
  const { locale, resources, loading, error, reload, isSample, area, setArea, position, setPosition } =
    useApp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [services, setServices] = useState<ServiceProvided[]>([])
  const [openAreaModal, setOpenAreaModal] = useState(0)
  const listRef = useRef<HTMLDivElement | null>(null)
  const shouldScroll = useRef(false)

  // Leaving the docs category drops its secondary filter, so it cannot sit
  // there invisibly narrowing a later search.
  useEffect(() => {
    if (category !== 'docs-and-expungement' && services.length > 0) setServices([])
  }, [category, services.length])

  // A tile scrolls the list into view; a pill does not yank the page around.
  useEffect(() => {
    if (!shouldScroll.current) return
    shouldScroll.current = false
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [category])

  const inArea = useMemo(() => filterByArea(resources, area), [resources, area])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return inArea.filter((resource) => {
      if (category !== 'all' && resource.category !== category) return false

      // Multi-select: a resource matches if it covers EITHER chosen service.
      // An organisation tagged 'both' matches whichever is picked.
      if (services.length > 0) {
        const provided = resource.service_provided
        if (!provided) return false
        const covers = provided === 'both' ? DOC_SERVICES : [provided]
        if (!services.some((service) => covers.includes(service))) return false
      }

      if (!needle) return true
      const haystack = [
        resourceName(resource, locale),
        resourceDescription(resource, locale),
        resource.name,
        resource.description,
        resource.neighborhood ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [inArea, query, category, services, locale])

  function pickTile(next: Category) {
    shouldScroll.current = true
    setCategory((current) => (current === next ? 'all' : next))
  }

  function toggleService(service: ServiceProvided) {
    setServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service],
    )
  }

  return (
    <div className="page">
      {/* Immediate danger comes first and is never behind a filter. */}
      <HotlinesStrip locale={locale} />

      <LocationIndicator
        area={area}
        onChange={setArea}
        onPosition={setPosition}
        resources={inArea}
        locale={locale}
        openSignal={openAreaModal}
      />

      <p className="field-hint">{t('noAccountNeeded', locale)}</p>

      {isSample && !loading ? (
        <p className="notice notice-sample">{t('sampleDataNotice', locale)}</p>
      ) : null}

      <QuickFinder locale={locale} active={category} onSelect={pickTile} />

      <label className="field">
        <span className="visually-hidden">{t('searchLabel', locale)}</span>
        <input
          className="search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchPlaceholder', locale)}
          autoComplete="off"
        />
      </label>

      {/* The pills stay put below the tiles. Neither entry point hides. */}
      <ul className="pills" aria-label={t('searchLabel', locale)}>
        <li>
          <button
            type="button"
            className="pill"
            aria-pressed={category === 'all'}
            onClick={() => setCategory('all')}
          >
            {t('all', locale)}
          </button>
        </li>
        {CATEGORIES.map((item) => (
          <li key={item}>
            <button
              type="button"
              className="pill"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {t(item, locale)}
            </button>
          </li>
        ))}
      </ul>

      {category === 'docs-and-expungement' ? (
        <ul className="pills pills-secondary" aria-label={t('docs-and-expungement', locale)}>
          {DOC_SERVICES.map((service) => (
            <li key={service}>
              <button
                type="button"
                className="pill pill-small"
                aria-pressed={services.includes(service)}
                onClick={() => toggleService(service)}
              >
                {t(`service.${service}`, locale)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div ref={listRef}>
        {loading ? <ResourceListSkeleton label={t('loading', locale)} /> : null}

        {!loading && error ? (
          <div className="notice notice-safety">
            <p>{t('loadFailed', locale)}</p>
            <button type="button" className="btn" onClick={reload}>
              {t('retry', locale)}
            </button>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <p className="neighborhood" aria-live="polite">
              {t('resultCount', locale, { count: filtered.length })}
            </p>
            {filtered.length === 0 ? (
              <EmptyState
                locale={locale}
                category={category}
                canWidenArea={area.kind !== 'county'}
                onWidenArea={() => setOpenAreaModal((value) => value + 1)}
              />
            ) : (
              <ul className="resource-list">
                {filtered.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    locale={locale}
                    distanceMiles={
                      position
                        ? distanceMilesFrom(resource, position.lat, position.lng) ?? undefined
                        : undefined
                    }
                  />
                ))}
              </ul>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Narrows to a postal code when one is chosen.
 *
 * A resource with no postal code is county-wide as far as this filter is
 * concerned: hotlines, online services, and anything the location gate
 * withholds. Filtering a domestic violence shelter out of view because the
 * reader typed a ZIP would be the worst possible behaviour here.
 */
function filterByArea(
  resources: Resource[],
  area: { kind: 'county' | 'zip'; zip?: string },
): Resource[] {
  if (area.kind !== 'zip' || !area.zip) return resources
  const zip = area.zip
  return resources.filter(
    (resource) => !resource.derived_postal_code || resource.derived_postal_code === zip,
  )
}
