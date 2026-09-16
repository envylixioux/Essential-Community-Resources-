import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Standing audit of the location gate.
 *
 * CLAUDE.md asks for a grep over every place `address`, `latitude`,
 * `longitude`, or a maps URL is referenced, confirming each is guarded. A
 * one-time grep goes stale the moment someone adds a component, so the grep
 * lives here and runs on every test run instead.
 *
 * If this test fails, a new code path can reach a resource's location without
 * going through canShowLocation. Route it through LocationBlock or the
 * helpers in canShowLocation.ts rather than adding the file to the allowlist.
 * Only add an allowlist entry when the file itself performs the gating.
 */

const SRC = join(process.cwd(), 'src')

/** Files permitted to touch location fields, and why. */
const ALLOWED = new Map<string, string>([
  ['lib/types.ts', 'declares the fields'],
  ['lib/canShowLocation.ts', 'is the gate itself'],
  ['lib/resources.ts', 'redacts gated rows on the way in'],
  ['lib/distance.ts', 'takes plain numbers, never a Resource'],
  ['components/LocationBlock.tsx', 'the only component that renders a location'],
  ['screens/MapScreen.tsx', 'filters markers with canShowOnMap'],
  ['data/sampleResources.ts', 'placeholder data, gated like any other row'],
  ['lib/searchArea.ts', "handles the READER'S own coordinates, never a Resource's"],
])

/**
 * What counts as reaching for a resource's location:
 *   - reading .address / .latitude / .longitude off an object
 *   - destructuring those fields out of one
 *   - building a maps or geo URL by hand
 *
 * A local form field named `address` (the suggestion form collects one from
 * the person filling it in) and a UI string containing the word are not
 * reads of a Resource, so the patterns are property-shaped on purpose.
 */
const LOCATION_PATTERNS: RegExp[] = [
  /\.\s*address\b/,
  /\.\s*latitude\b/,
  /\.\s*longitude\b/,
  /\[['"](address|latitude|longitude)['"]\]/,
  /\{[^}]*\b(address|latitude|longitude)\b[^}]*\}\s*=/,
  /google\.com\/maps/i,
  /maps\.apple\.com/i,
  /\bgeo:/i,
]

/** Removes line comments, block comments, and JSX comment expressions. */
function stripComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\/\/.*$/gm, '')
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__') continue
      out.push(...walk(full))
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

describe('location gate coverage', () => {
  const files = walk(SRC)

  it('finds source files to audit', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('confines every location reference to a file that gates it', () => {
    const offenders: string[] = []

    for (const file of files) {
      const rel = relative(SRC, file).split('\\').join('/')
      if (ALLOWED.has(rel)) continue

      // Comments explaining the rule are not code paths.
      const code = stripComments(readFileSync(file, 'utf8'))

      code.split('\n').forEach((line, index) => {
        if (LOCATION_PATTERNS.some((pattern) => pattern.test(line))) {
          offenders.push(`${rel}:${index + 1}: ${line.trim()}`)
        }
      })
    }

    expect(offenders).toEqual([])
  })

  it('keeps every allowlisted file in existence', () => {
    const present = new Set(files.map((file) => relative(SRC, file).split('\\').join('/')))
    for (const entry of ALLOWED.keys()) {
      expect(present.has(entry), `${entry} is allowlisted but missing`).toBe(true)
    }
  })

  it('checks that the map screen filters rather than hides', () => {
    const map = readFileSync(join(SRC, 'screens/MapScreen.tsx'), 'utf8')
    expect(map).toContain('canShowOnMap')
    // A gated resource must never reach the marker loop. Guard against
    // someone switching the filter for a CSS or opacity trick.
    expect(map).not.toMatch(/display:\s*['"]none['"].*marker/i)
  })

  it('keeps the reader-location module away from resource locations', () => {
    // searchArea.ts is allowlisted because it reads the reader's own
    // coordinates for a coverage check. That is only safe while it has
    // nothing to do with Resource — otherwise the allowlist entry becomes a
    // hole in the gate.
    // Comments discuss the rule, so only the code is checked.
    const area = stripComments(readFileSync(join(SRC, 'lib/searchArea.ts'), 'utf8'))
    expect(area).not.toMatch(/\bResource\b/)
    expect(area).not.toMatch(/from '\.\/types'/)
    expect(area).not.toMatch(/canShowLocation/)
  })

  it('checks that LocationBlock returns before producing a directions link', () => {
    const block = readFileSync(join(SRC, 'components/LocationBlock.tsx'), 'utf8')
    const gateIndex = block.indexOf('canShowLocation(resource)')
    const directionsIndex = block.indexOf('directionsUrl(resource)')
    expect(gateIndex).toBeGreaterThan(-1)
    expect(directionsIndex).toBeGreaterThan(gateIndex)
  })
})
