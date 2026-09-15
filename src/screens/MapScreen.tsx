import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CategoryChip } from '../components/CategoryChip'
import { MapSkeleton } from '../components/Skeletons'
import { useApp } from '../lib/AppContext'
import { canShowOnMap } from '../lib/canShowLocation'
import { formatMiles, haversineMiles } from '../lib/distance'
import { resourceName, t } from '../lib/i18n'
import { CATEGORIES } from '../lib/types'

const LA_CENTER: [number, number] = [34.0522, -118.2437]

const PIN_COLORS: Record<string, string> = {
  food: '#7a4a00',
  shelter: '#1f4d7a',
  documents: '#4a2f7a',
  employment: '#14622f',
  crisis: '#8a1f3d',
}

function pinIcon(category: string) {
  return L.divIcon({
    className: '',
    html: `<span class="map-pin" style="background:${PIN_COLORS[category] ?? '#1b3a5c'}"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  })
}

export default function MapScreen() {
  const { locale, resources, loading } = useApp()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [geoDenied, setGeoDenied] = useState(false)

  /**
   * Map data is built by filtering with canShowOnMap. A confidential
   * resource is never part of this array, so it cannot reach Leaflet, a
   * marker, a popup, or anything that serialises them. It is excluded, not
   * hidden.
   */
  const mappable = useMemo(() => resources.filter(canShowOnMap), [resources])

  const hiddenCount = resources.length - mappable.length

  const nearest = useMemo(() => {
    if (!position) return []
    return mappable
      .map((resource) => ({
        resource,
        miles: haversineMiles(position.lat, position.lng, resource.latitude, resource.longitude),
      }))
      .sort((a, b) => a.miles - b.miles)
      .slice(0, 3)
  }, [mappable, position])

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: LA_CENTER,
      zoom: 11,
      scrollWheelZoom: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  // Re-draw markers when the permitted set changes.
  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    layer.clearLayers()

    for (const resource of mappable) {
      L.marker([resource.latitude, resource.longitude], {
        icon: pinIcon(resource.category),
        alt: resourceName(resource, locale),
      })
        .bindPopup(
          `<strong>${escapeHtml(resourceName(resource, locale))}</strong><br/>` +
            `${escapeHtml(t(resource.category, locale))}<br/>` +
            `<a href="/resource/${encodeURIComponent(resource.id)}">${escapeHtml(t('viewDetails', locale))}</a>`,
        )
        .addTo(layer)
    }
  }, [mappable, locale])

  function requestLocation() {
    if (!navigator.geolocation) {
      setGeoDenied(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (result) => {
        const next = { lat: result.coords.latitude, lng: result.coords.longitude }
        setPosition(next)
        setGeoDenied(false)
        mapRef.current?.setView([next.lat, next.lng], 13)
      },
      () => setGeoDenied(true),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    )
  }

  return (
    <div className="page">
      {/* The list and the map never block on each other. */}
      {loading ? <MapSkeleton label={t('loading', locale)} /> : null}
      <div
        ref={containerRef}
        className="map-canvas"
        style={loading ? { display: 'none' } : undefined}
        role="application"
        aria-label={t('map', locale)}
      />

      <button type="button" className="btn" onClick={requestLocation} style={{ marginTop: 12 }}>
        {t('useMyLocation', locale)}
      </button>

      {geoDenied ? <p className="notice">{t('locationDenied', locale)}</p> : null}

      {hiddenCount > 0 ? (
        <p className="notice notice-safety">{t('mapExcludesConfidential', locale)}</p>
      ) : null}

      <ul className="legend">
        {CATEGORIES.map((category) => (
          <li key={category}>
            <CategoryChip category={category} locale={locale} />
          </li>
        ))}
      </ul>

      {nearest.length > 0 ? (
        <section>
          <h2>{t('nearestThree', locale)}</h2>
          <ul className="resource-list">
            {nearest.map(({ resource, miles }) => (
              <li className="card" key={resource.id}>
                <Link className="card-link" to={`/resource/${resource.id}`}>
                  <h3>{resourceName(resource, locale)}</h3>
                  <div className="card-meta">
                    <CategoryChip category={resource.category} locale={locale} />
                    <span className="neighborhood">{formatMiles(miles, locale)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
