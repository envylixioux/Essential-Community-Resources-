import { t, type Locale } from '../lib/i18n'

/**
 * Immediate-danger numbers, always at the top of the home screen and never
 * behind a filter, a tile, or a scroll.
 *
 * The health-and-support category is deliberately broad — free clinics and
 * ongoing counseling sit in it alongside crisis lines — and this strip is
 * what makes that safe. Someone in danger right now does not browse.
 *
 * Labels say what each number actually is. 211 is Los Angeles County social
 * services, part of the United Way's national 211 network. It is not a
 * reentry hotline and must not be labelled as one. A catchier wrong label
 * erodes trust with exactly the people most likely to notice the error.
 */

interface Hotline {
  key: string
  number: string
  /** Digits for the tel: link. */
  dial: string
}

const HOTLINES: Hotline[] = [
  { key: 'hotline211', number: '211', dial: '211' },
  { key: 'hotline988', number: '988', dial: '988' },
  { key: 'hotlineDv', number: '1-800-799-7233', dial: '18007997233' },
]

export function HotlinesStrip({ locale }: { locale: Locale }) {
  return (
    <section className="hotlines" aria-label={t('hotlinesLabel', locale)}>
      <h2 className="hotlines-title">{t('hotlinesLabel', locale)}</h2>
      <ul className="hotlines-list">
        {HOTLINES.map((hotline) => (
          <li key={hotline.key}>
            <a className="hotline-chip" href={`tel:${hotline.dial}`}>
              <span className="hotline-number">{hotline.number}</span>
              <span className="hotline-label">{t(hotline.key, locale)}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
