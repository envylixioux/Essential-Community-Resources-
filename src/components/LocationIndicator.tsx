import { useEffect, useRef, useState } from 'react'
import { t, type Locale } from '../lib/i18n'
import {
  COUNTY_AREA,
  isLaCountyZip,
  isPositionInLaCounty,
  type SearchArea,
} from '../lib/searchArea'
import type { Resource } from '../lib/types'
import { FreshnessDot } from './FreshnessDot'

/**
 * Shows which area the reader is searching, with a way to change it.
 *
 * Location is opt-in every time. Nothing asks for geolocation on load and
 * nothing asks in the background — the reader has to press the button. The
 * only thing stored is the area they chose, in their own browser.
 */

export function areaLabel(area: SearchArea, locale: Locale): string {
  if (area.kind === 'zip' && area.zip) return area.label ?? area.zip
  return t('laCounty', locale)
}

export function LocationIndicator({
  area,
  onChange,
  resources,
  locale,
  openSignal,
}: {
  area: SearchArea
  onChange: (area: SearchArea) => void
  resources: Resource[]
  locale: Locale
  /** Incrementing this opens the modal from elsewhere, e.g. the empty state. */
  openSignal?: number
}) {
  const [open, setOpen] = useState(false)
  const firstOpen = useRef(true)

  useEffect(() => {
    if (openSignal === undefined) return
    if (firstOpen.current) {
      firstOpen.current = false
      return
    }
    setOpen(true)
  }, [openSignal])

  return (
    <div className="location-bar">
      <span className="location-pill">
        <span aria-hidden="true">📍</span>
        <span className="location-name">
          <span className="visually-hidden">{t('searchArea', locale)}: </span>
          {areaLabel(area, locale)}
        </span>
        <FreshnessDot resources={resources} locale={locale} />
      </span>
      <button type="button" className="location-change" onClick={() => setOpen(true)}>
        {t('change', locale)}
        <span className="visually-hidden"> — {t('changeArea', locale)}</span>
      </button>

      {open ? (
        <ChangeAreaModal
          locale={locale}
          onClose={() => setOpen(false)}
          onPick={(next) => {
            onChange(next)
            setOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function ChangeAreaModal({
  locale,
  onClose,
  onPick,
}: {
  locale: Locale
  onClose: () => void
  onPick: (area: SearchArea) => void
}) {
  const [zip, setZip] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [detecting, setDetecting] = useState(false)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('button, input')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function detect() {
    if (!navigator.geolocation) {
      setError(t('geoUnavailable', locale))
      return
    }
    setDetecting(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setDetecting(false)
        // The reader's coordinates never leave searchArea.ts: this component
        // gets a yes or no and nothing else.
        if (!isPositionInLaCounty(result)) {
          // Do not quietly recentre on Los Angeles. Saying "here are your
          // local resources" when they are 400 miles away is the misleading
          // answer, and someone acts on it.
          setError(t('outsideCoverage', locale))
          return
        }
        onPick({ kind: 'county' })
      },
      () => {
        setDetecting(false)
        setError(t('geoUnavailable', locale))
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    )
  }

  function submitZip() {
    const trimmed = zip.trim()
    if (!/^\d{5}$/.test(trimmed)) {
      setError(t('zipInvalid', locale))
      return
    }
    if (!isLaCountyZip(trimmed)) {
      setError(t('outsideCoverage', locale))
      return
    }
    onPick({ kind: 'zip', zip: trimmed, label: trimmed })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('changeArea', locale)}
        onClick={(event) => event.stopPropagation()}
      >
        <h2>{t('changeArea', locale)}</h2>
        <p className="field-hint">{t('locationOptIn', locale)}</p>

        <button type="button" className="btn" onClick={detect} disabled={detecting}>
          {detecting ? t('detecting', locale) : t('autoDetect', locale)}
        </button>

        <label className="field" style={{ marginTop: 16 }}>
          <span>{t('enterZip', locale)}</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            value={zip}
            placeholder={t('zipPlaceholder', locale)}
            onChange={(event) => {
              setZip(event.target.value.replace(/\D/g, ''))
              setError(null)
            }}
          />
        </label>
        <button type="button" className="btn" onClick={submitZip}>
          {t('useZip', locale)}
        </button>

        {error ? (
          <p className="field-error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginTop: 16 }}
          onClick={() => onPick(COUNTY_AREA)}
        >
          {t('useWholeCounty', locale)}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('cancel', locale)}
        </button>
      </div>
    </div>
  )
}
