import { useMemo, useState } from 'react'
import { ResourceCard } from '../components/ResourceCard'
import { ResourceListSkeleton } from '../components/Skeletons'
import { useApp } from '../lib/AppContext'
import { resourceDescription, resourceName, t } from '../lib/i18n'
import { CATEGORIES, type Category } from '../lib/types'

export default function Home() {
  const { locale, resources, loading, error, reload, isSample } = useApp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return resources.filter((resource) => {
      if (category !== 'all' && resource.category !== category) return false
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
  }, [resources, query, category, locale])

  return (
    <div className="page">
      <p className="field-hint">{t('noAccountNeeded', locale)}</p>

      {isSample && !loading ? (
        <p className="notice notice-sample">{t('sampleDataNotice', locale)}</p>
      ) : null}

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

      <ul className="pills">
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
            <p>{t('noResults', locale)}</p>
          ) : (
            <ul className="resource-list">
              {filtered.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} locale={locale} />
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  )
}
