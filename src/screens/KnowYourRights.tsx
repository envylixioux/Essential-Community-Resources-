import { Markdown } from '../components/Markdown'
import { useApp } from '../lib/AppContext'
import enSource from '../../know-your-rights.md?raw'
import esSource from '../../know-your-rights.es.md?raw'

/**
 * Static content, rendered from the markdown files at the repo root so there
 * is one source of truth for the text.
 *
 * The "not legal advice" notice and the last-reviewed date live in those
 * files and must stay there. If the date goes stale the page is worse than
 * useless — someone could rely on a rule that changed.
 */
export default function KnowYourRights() {
  const { locale } = useApp()
  const source = locale === 'es' ? esSource : enSource

  return (
    <div className="page prose">
      <Markdown source={source} />
    </div>
  )
}
