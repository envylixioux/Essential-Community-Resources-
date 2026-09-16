import { useEffect, useRef, useState } from 'react'
import { t, type Locale } from '../lib/i18n'

/**
 * "Scroll for hours, reviews & more".
 *
 * The detail page puts the phone number above the fold on purpose, which
 * means the hours are below it. This says so, once, for the reader who would
 * otherwise assume the page ended.
 *
 * It appears only when there is actually something below the fold — a
 * hotline-only resource with no hours and no reviews does not get a hint
 * pointing at nothing. It fades rather than unmounting, so nothing shifts
 * under a thumb that is already moving.
 */
export function ScrollHint({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLParagraphElement | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Is there real content below the fold? Measure rather than guess.
    const belowFold = document.documentElement.scrollHeight - window.innerHeight
    if (belowFold < 80) return

    setVisible(true)

    const onScroll = () => {
      if (window.scrollY > 100) {
        setVisible(false)
        window.removeEventListener('scroll', onScroll)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <p
      className={`scroll-hint${visible ? ' scroll-hint-visible' : ''}`}
      ref={ref}
      aria-hidden={!visible}
    >
      <span aria-hidden="true">↓</span> {t('scrollHint', locale)}
    </p>
  )
}
