import { describe, expect, it } from 'vitest'
import { formatTime, getOpenStatus, laNow, parseTime } from '../hours'
import type { Hours } from '../types'

/** A real instant, expressed as a UTC timestamp, so tests do not depend on
 * the machine's timezone. PST is UTC-8, PDT is UTC-7. */
const at = (iso: string) => new Date(iso)

describe('parseTime / formatTime', () => {
  it('round-trips valid times', () => {
    expect(parseTime('07:00')).toBe(420)
    expect(parseTime('19:30')).toBe(1170)
    expect(formatTime(420)).toBe('07:00')
    expect(formatTime(1170)).toBe('19:30')
  })

  it('rejects malformed values', () => {
    expect(parseTime('7pm')).toBeNull()
    expect(parseTime('25:00')).toBeNull()
    expect(parseTime('12:75')).toBeNull()
    expect(parseTime('')).toBeNull()
  })
})

describe('laNow', () => {
  it('reads Los Angeles wall-clock time, not the host timezone', () => {
    // 2024-01-10 is a Wednesday. 20:00 UTC is 12:00 PST.
    const now = laNow(at('2024-01-10T20:00:00Z'))
    expect(now.weekday).toBe(3)
    expect(now.minutes).toBe(12 * 60)
  })

  it('accounts for daylight saving', () => {
    // 2024-07-10 is a Wednesday. 20:00 UTC is 13:00 PDT.
    const now = laNow(at('2024-07-10T20:00:00Z'))
    expect(now.minutes).toBe(13 * 60)
  })

  it('handles the midnight boundary', () => {
    // 08:00 UTC on 2024-01-11 is 00:00 PST on 2024-01-11 (Thursday).
    const now = laNow(at('2024-01-11T08:00:00Z'))
    expect(now.weekday).toBe(4)
    expect(now.minutes).toBe(0)
  })
})

const weekdayNineToFive: Hours = {
  monday: [{ open: '09:00', close: '17:00' }],
  tuesday: [{ open: '09:00', close: '17:00' }],
  wednesday: [{ open: '09:00', close: '17:00' }],
  thursday: [{ open: '09:00', close: '17:00' }],
  friday: [{ open: '09:00', close: '17:00' }],
  saturday: [],
  sunday: [],
}

describe('getOpenStatus — standard hours', () => {
  const resource = { hours: weekdayNineToFive, open_24_hours: false }

  it('is open during the window', () => {
    const status = getOpenStatus(resource, at('2024-01-10T20:00:00Z')) // Wed 12:00 PST
    expect(status.state).toBe('open')
    expect(status.closesAt).toBe('17:00')
  })

  it('is closed before opening and reports today’s opening time', () => {
    const status = getOpenStatus(resource, at('2024-01-10T16:00:00Z')) // Wed 08:00 PST
    expect(status.state).toBe('closed')
    expect(status.opensAt).toBe('09:00')
    expect(status.opensNextDay).toBe(false)
  })

  it('is closed at exactly the closing minute', () => {
    const status = getOpenStatus(resource, at('2024-01-11T01:00:00Z')) // Wed 17:00 PST
    expect(status.state).toBe('closed')
  })

  it('is open at exactly the opening minute', () => {
    const status = getOpenStatus(resource, at('2024-01-10T17:00:00Z')) // Wed 09:00 PST
    expect(status.state).toBe('open')
  })

  it('is closed on an explicitly empty day', () => {
    const status = getOpenStatus(resource, at('2024-01-13T20:00:00Z')) // Sat 12:00 PST
    expect(status.state).toBe('closed')
  })

  it('points at the next open day after the window has passed', () => {
    const status = getOpenStatus(resource, at('2024-01-11T04:00:00Z')) // Wed 20:00 PST
    expect(status.state).toBe('closed')
    expect(status.opensAt).toBe('09:00')
    expect(status.opensNextDay).toBe(true)
  })
})

describe('getOpenStatus — overnight ranges', () => {
  // A shelter open 19:00 through 07:00 the next morning, every day.
  const overnight: Hours = {
    sunday: [{ open: '19:00', close: '07:00' }],
    monday: [{ open: '19:00', close: '07:00' }],
    tuesday: [{ open: '19:00', close: '07:00' }],
    wednesday: [{ open: '19:00', close: '07:00' }],
    thursday: [{ open: '19:00', close: '07:00' }],
    friday: [{ open: '19:00', close: '07:00' }],
    saturday: [{ open: '19:00', close: '07:00' }],
  }
  const resource = { hours: overnight, open_24_hours: false }

  it('is open late at night on the day the range started', () => {
    const status = getOpenStatus(resource, at('2024-01-11T06:00:00Z')) // Wed 22:00 PST
    expect(status.state).toBe('open')
    expect(status.closesAt).toBe('07:00')
  })

  it('is open in the small hours, carried over from yesterday', () => {
    const status = getOpenStatus(resource, at('2024-01-11T10:00:00Z')) // Thu 02:00 PST
    expect(status.state).toBe('open')
    expect(status.closesAt).toBe('07:00')
  })

  it('is closed after the overnight range ends', () => {
    const status = getOpenStatus(resource, at('2024-01-11T16:00:00Z')) // Thu 08:00 PST
    expect(status.state).toBe('closed')
    expect(status.opensAt).toBe('19:00')
  })

  it('does not carry over when yesterday was a closed day', () => {
    const sundayOnly: Hours = {
      sunday: [{ open: '19:00', close: '07:00' }],
      monday: [],
      tuesday: [],
    }
    // Tue 02:00 PST — Monday was closed, so nothing carries into Tuesday.
    const status = getOpenStatus(
      { hours: sundayOnly, open_24_hours: false },
      at('2024-01-09T10:00:00Z'),
    )
    expect(status.state).toBe('closed')
  })
})

describe('getOpenStatus — split ranges', () => {
  const lunchBreak: Hours = {
    wednesday: [
      { open: '09:00', close: '12:00' },
      { open: '13:00', close: '17:00' },
    ],
  }
  const resource = { hours: lunchBreak, open_24_hours: false }

  it('is closed during the break and reports the afternoon reopening', () => {
    const status = getOpenStatus(resource, at('2024-01-10T20:30:00Z')) // Wed 12:30 PST
    expect(status.state).toBe('closed')
    expect(status.opensAt).toBe('13:00')
  })

  it('is open in the afternoon block', () => {
    const status = getOpenStatus(resource, at('2024-01-10T22:00:00Z')) // Wed 14:00 PST
    expect(status.state).toBe('open')
    expect(status.closesAt).toBe('17:00')
  })
})

describe('getOpenStatus — naming the next open day', () => {
  const resource = { hours: weekdayNineToFive, open_24_hours: false }

  it('names today when the resource opens again later today', () => {
    const status = getOpenStatus(resource, at('2024-01-10T16:00:00Z')) // Wed 08:00 PST
    expect(status.opensOnWeekday).toBe('wednesday')
    expect(status.opensNextDay).toBe(false)
  })

  it('names tomorrow once today is over', () => {
    const status = getOpenStatus(resource, at('2024-01-11T04:00:00Z')) // Wed 20:00 PST
    expect(status.opensAt).toBe('09:00')
    expect(status.opensOnWeekday).toBe('thursday')
    expect(status.opensNextDay).toBe(true)
  })

  it('skips closed days to name the next one that opens', () => {
    // Saturday 12:00 PST — Sunday is closed, so Monday is the answer.
    const status = getOpenStatus(resource, at('2024-01-13T20:00:00Z'))
    expect(status.opensOnWeekday).toBe('monday')
  })

  it('wraps around the end of the week', () => {
    const fridayOnly: Hours = {
      sunday: [], monday: [], tuesday: [], wednesday: [], thursday: [],
      friday: [{ open: '10:00', close: '14:00' }],
      saturday: [],
    }
    // Saturday 12:00 PST — the next opening is the following Friday.
    const status = getOpenStatus({ hours: fridayOnly, open_24_hours: false }, at('2024-01-13T20:00:00Z'))
    expect(status.opensOnWeekday).toBe('friday')
    expect(status.opensAt).toBe('10:00')
  })
})

describe('getOpenStatus — 24 hours and missing data', () => {
  it('reports open for open_24_hours regardless of the hours JSON', () => {
    const status = getOpenStatus({ hours: null, open_24_hours: true }, at('2024-01-11T11:00:00Z'))
    expect(status.state).toBe('open')
    expect(status.alwaysOpen).toBe(true)
  })

  it('reports unknown rather than guessing when hours are missing', () => {
    expect(getOpenStatus({ hours: null, open_24_hours: false }).state).toBe('unknown')
    expect(getOpenStatus({ hours: {}, open_24_hours: false }).state).toBe('unknown')
  })

  it('reports unknown when today has no entry at all', () => {
    const partial: Hours = { monday: [{ open: '09:00', close: '17:00' }] }
    // Wednesday has no key — that is a gap in our data, not a closure.
    const status = getOpenStatus({ hours: partial, open_24_hours: false }, at('2024-01-10T20:00:00Z'))
    expect(status.state).toBe('unknown')
  })

  it('reports unknown when every range for today is malformed', () => {
    const broken: Hours = { wednesday: [{ open: 'morning', close: 'evening' }] }
    const status = getOpenStatus({ hours: broken, open_24_hours: false }, at('2024-01-10T20:00:00Z'))
    expect(status.state).toBe('unknown')
  })

  it('treats an identical open and close as malformed rather than guessing', () => {
    const ambiguous: Hours = { wednesday: [{ open: '00:00', close: '00:00' }] }
    const status = getOpenStatus({ hours: ambiguous, open_24_hours: false }, at('2024-01-10T20:00:00Z'))
    expect(status.state).toBe('unknown')
  })
})
