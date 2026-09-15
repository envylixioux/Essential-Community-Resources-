import type { Hours, HoursRange, Resource, Weekday } from './types'

/**
 * Open/closed status computed against Los Angeles wall-clock time.
 *
 * Never use the browser's local timezone here. Someone checking whether a
 * food bank is still open could be on a phone set to any timezone, and a
 * wrong answer sends them across the county to a locked door.
 */

export const LA_TIME_ZONE = 'America/Los_Angeles'

const WEEKDAYS: Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export type OpenState =
  /** Confirmed open right now. */
  | 'open'
  /** Confirmed closed right now. */
  | 'closed'
  /** We do not have usable hours. Say so; do not guess. */
  | 'unknown'

export interface OpenStatus {
  state: OpenState
  /** True when the resource is open around the clock. */
  alwaysOpen: boolean
  /** "HH:MM" LA time this resource closes, when state is 'open'. */
  closesAt: string | null
  /** "HH:MM" LA time this resource next opens, when state is 'closed'. */
  opensAt: string | null
  /** True when opensAt refers to a later day rather than today. */
  opensNextDay: boolean
}

interface LaNow {
  /** 0 = Sunday. */
  weekday: number
  /** Minutes since LA midnight. */
  minutes: number
}

/** Parses "HH:MM" into minutes since midnight, or null if malformed. */
export function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const mins = Number(match[2])
  if (hours < 0 || hours > 23 || mins < 0 || mins > 59) return null
  return hours * 60 + mins
}

/** Formats minutes-since-midnight back to "HH:MM". */
export function formatTime(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440
  const h = String(Math.floor(wrapped / 60)).padStart(2, '0')
  const m = String(wrapped % 60).padStart(2, '0')
  return `${h}:${m}`
}

/**
 * Reads the current Los Angeles weekday and time-of-day from a Date.
 * Intl handles Pacific daylight saving for us, so only wall-clock values are
 * ever compared.
 */
export function laNow(now: Date = new Date()): LaNow {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: LA_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekday = Math.max(0, weekdayNames.indexOf(get('weekday')))

  // Intl can emit "24" for midnight in some runtimes; normalise it to 0.
  const hour = Number(get('hour')) % 24
  const minute = Number(get('minute'))

  return { weekday, minutes: hour * 60 + minute }
}

/**
 * A range is "overnight" when it closes at or before it opens, e.g. a shelter
 * open 19:00–07:00. A range whose open and close are identical is treated as
 * malformed and ignored: we would rather say "hours unknown" than guess
 * between "closed all day" and "open all day".
 */
function rangeBounds(range: HoursRange): { open: number; close: number } | null {
  const open = parseTime(range.open)
  const close = parseTime(range.close)
  if (open === null || close === null) return null
  if (open === close) return null
  return { open, close }
}

function isOvernight(open: number, close: number): boolean {
  return close < open
}

function rangesFor(hours: Hours, weekday: number): HoursRange[] | undefined {
  return hours[WEEKDAYS[((weekday % 7) + 7) % 7]]
}

const UNKNOWN: OpenStatus = {
  state: 'unknown',
  alwaysOpen: false,
  closesAt: null,
  opensAt: null,
  opensNextDay: false,
}

/**
 * Computes whether a resource is open at `now` (defaults to the real clock).
 *
 * Handles closed days (an empty array for that weekday), overnight ranges
 * that started yesterday, resources flagged open_24_hours, and missing or
 * malformed hours.
 */
export function getOpenStatus(
  resource: Pick<Resource, 'hours' | 'open_24_hours'>,
  now: Date = new Date(),
): OpenStatus {
  if (resource.open_24_hours) {
    return { ...UNKNOWN, state: 'open', alwaysOpen: true }
  }

  const hours = resource.hours
  if (!hours || Object.keys(hours).length === 0) return UNKNOWN

  const { weekday, minutes } = laNow(now)

  // 1. Did a range that opened yesterday run past midnight into right now?
  const yesterday = rangesFor(hours, weekday - 1)
  if (yesterday) {
    for (const range of yesterday) {
      const bounds = rangeBounds(range)
      if (!bounds) continue
      if (isOvernight(bounds.open, bounds.close) && minutes < bounds.close) {
        return {
          state: 'open',
          alwaysOpen: false,
          closesAt: formatTime(bounds.close),
          opensAt: null,
          opensNextDay: false,
        }
      }
    }
  }

  // 2. Is a range that starts today open right now?
  const today = rangesFor(hours, weekday)
  if (today === undefined) {
    // No entry for today at all. We genuinely do not know.
    return UNKNOWN
  }

  let sawUsableRange = false
  let nextOpenToday: number | null = null

  for (const range of today) {
    const bounds = rangeBounds(range)
    if (!bounds) continue
    sawUsableRange = true

    const { open, close } = bounds
    if (isOvernight(open, close)) {
      // Runs past midnight; open from `open` through end of day.
      if (minutes >= open) {
        return {
          state: 'open',
          alwaysOpen: false,
          closesAt: formatTime(close),
          opensAt: null,
          opensNextDay: false,
        }
      }
    } else if (minutes >= open && minutes < close) {
      return {
        state: 'open',
        alwaysOpen: false,
        closesAt: formatTime(close),
        opensAt: null,
        opensNextDay: false,
      }
    }

    if (minutes < open && (nextOpenToday === null || open < nextOpenToday)) {
      nextOpenToday = open
    }
  }

  // An explicit empty array means "closed today" — that is knowledge, not a gap.
  if (today.length === 0) {
    return { ...UNKNOWN, state: 'closed', opensAt: nextOpening(hours, weekday) }
  }

  if (!sawUsableRange) return UNKNOWN

  if (nextOpenToday !== null) {
    return {
      state: 'closed',
      alwaysOpen: false,
      closesAt: null,
      opensAt: formatTime(nextOpenToday),
      opensNextDay: false,
    }
  }

  return {
    state: 'closed',
    alwaysOpen: false,
    closesAt: null,
    opensAt: nextOpening(hours, weekday),
    opensNextDay: true,
  }
}

/** Earliest opening time on the next day that has one, within a week. */
function nextOpening(hours: Hours, fromWeekday: number): string | null {
  for (let offset = 1; offset <= 7; offset += 1) {
    const ranges = rangesFor(hours, fromWeekday + offset)
    if (!ranges || ranges.length === 0) continue
    const opens = ranges
      .map(rangeBounds)
      .filter((b): b is { open: number; close: number } => b !== null)
      .map((b) => b.open)
    if (opens.length > 0) return formatTime(Math.min(...opens))
  }
  return null
}

/** Human-readable 12-hour time for display, e.g. "7:00 PM". */
export function formatForDisplay(time: string, locale: string): string {
  const minutes = parseTime(time)
  if (minutes === null) return time
  const date = new Date(Date.UTC(2024, 0, 1, Math.floor(minutes / 60), minutes % 60))
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-US' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date)
}

export { WEEKDAYS }
