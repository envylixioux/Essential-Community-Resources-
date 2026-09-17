import { lazy, Suspense } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { MapSkeleton } from './components/Skeletons'
import { useApp } from './lib/AppContext'
import { t } from './lib/i18n'
import Home from './screens/Home'
import KnowYourRights from './screens/KnowYourRights'
import ResourceDetail from './screens/ResourceDetail'
import Suggest from './screens/Suggest'

/**
 * The map pulls in Leaflet and its tiles. It is loaded on demand so the
 * resource list is usable on a slow connection without waiting for any of it.
 */
const MapScreen = lazy(() => import('./screens/MapScreen'))

export default function App() {
  const { locale, setLocale } = useApp()

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        {locale === 'es' ? 'Saltar al contenido' : 'Skip to content'}
      </a>

      <header className="header">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1>{t('appName', locale)}</h1>
        </Link>
        <button
          type="button"
          className="lang-toggle"
          onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}
          lang={locale === 'en' ? 'es' : 'en'}
        >
          {t('languageToggle', locale)}
        </button>
      </header>

      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resource/:id" element={<ResourceDetail />} />
          <Route
            path="/map"
            element={
              <Suspense
                fallback={
                  <div className="page">
                    <MapSkeleton label={t('loading', locale)} />
                  </div>
                }
              >
                <MapScreen />
              </Suspense>
            }
          />
          <Route path="/suggest" element={<Suggest />} />
          <Route path="/rights" element={<KnowYourRights />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      <nav className="nav" aria-label={locale === 'es' ? 'Navegación principal' : 'Main navigation'}>
        <NavLink to="/" end>
          <span className="nav-icon" aria-hidden="true">
            ☰
          </span>
          {t('home', locale)}
        </NavLink>
        <NavLink to="/map">
          <span className="nav-icon" aria-hidden="true">
            ◎
          </span>
          {t('map', locale)}
        </NavLink>
        <NavLink to="/suggest">
          <span className="nav-icon" aria-hidden="true">
            ＋
          </span>
          {t('suggest', locale)}
        </NavLink>
        <NavLink to="/rights">
          <span className="nav-icon" aria-hidden="true">
            §
          </span>
          {t('rights', locale)}
        </NavLink>
      </nav>
    </div>
  )
}
