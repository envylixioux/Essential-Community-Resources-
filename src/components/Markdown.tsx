import { Fragment, type ReactNode } from 'react'

/**
 * A deliberately tiny Markdown renderer for the Know Your Rights page.
 *
 * It builds React elements directly and never touches innerHTML, so nothing
 * in the source file can inject markup. It understands headings, bullet
 * lists, blockquotes, paragraphs, bold, and links — which is all the content
 * uses. Anything else renders as plain text rather than silently disappearing.
 */

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /\*\*(.+?)\*\*|\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let index = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b${index}`}>{match[1]}</strong>)
    } else {
      nodes.push(
        <a key={`${keyPrefix}-a${index}`} href={match[3]} rel="noopener noreferrer" target="_blank">
          {match[2]}
        </a>,
      )
    }
    lastIndex = match.index + match[0].length
    index += 1
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

export function Markdown({ source }: { source: string }) {
  const lines = source.split('\n')
  const blocks: ReactNode[] = []

  let paragraph: string[] = []
  let list: string[] = []
  let quote: string[] = []
  let key = 0

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    const text = paragraph.join(' ')
    blocks.push(<p key={`p${key++}`}>{inline(text, `p${key}`)}</p>)
    paragraph = []
  }

  const flushList = () => {
    if (list.length === 0) return
    const items = list
    blocks.push(
      <ul key={`ul${key++}`}>
        {items.map((item, i) => (
          <li key={i}>{inline(item, `li${key}-${i}`)}</li>
        ))}
      </ul>,
    )
    list = []
  }

  const flushQuote = () => {
    if (quote.length === 0) return
    const text = quote.join(' ')
    blocks.push(
      <p className="notice notice-safety" key={`q${key++}`}>
        {inline(text, `q${key}`)}
      </p>,
    )
    quote = []
  }

  const flushAll = () => {
    flushParagraph()
    flushList()
    flushQuote()
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line.trim() === '') {
      flushAll()
      continue
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      flushAll()
      const level = heading[1].length
      const content = inline(heading[2], `h${key}`)
      blocks.push(
        level === 1 ? (
          <h1 key={`h${key++}`}>{content}</h1>
        ) : level === 2 ? (
          <h2 key={`h${key++}`}>{content}</h2>
        ) : (
          <h3 key={`h${key++}`}>{content}</h3>
        ),
      )
      continue
    }

    if (line.startsWith('> ')) {
      flushParagraph()
      flushList()
      quote.push(line.slice(2).trim())
      continue
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line)
    if (bullet) {
      flushParagraph()
      flushQuote()
      list.push(bullet[1])
      continue
    }

    // A continuation line for the bullet directly above it.
    if (list.length > 0 && /^\s{2,}\S/.test(raw)) {
      list[list.length - 1] += ` ${line.trim()}`
      continue
    }

    flushList()
    flushQuote()
    paragraph.push(line.trim())
  }

  flushAll()

  return <Fragment>{blocks}</Fragment>
}
