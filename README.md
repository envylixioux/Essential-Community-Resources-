# Quick Connect LA

Food, shelter, ID and document help, employment services, and crisis support
across Los Angeles County — in one place anyone can reach by scanning a QR
code. No app download. No account. English and Spanish.

Built for people reentering the community after incarceration, and for their
neighbours.

## Setup

Requires Node 18 or newer.

```bash
npm install
cp .env.example .env    # optional; the app runs on sample data without it
npm run dev             # http://localhost:5173
```

Without Supabase credentials the app runs on the placeholder set in
`src/data/sampleResources.ts` and shows a visible "sample data" banner. That
is enough to develop and demo every screen.

### Connecting the database

Put your Supabase project URL and anon key in `.env`:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

The anon key is public by design and safe in the client bundle. Row level
security in Postgres is what protects the data. Never put a `service_role`
key in this file.

`supabase/schema.sql` is a reference copy of the tables and the RLS policies.
Do not run it against the live project — the research group is entering data
against it right now.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Typecheck, then production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite |
| `npm run typecheck` | Types only |
| `npm run qr` | Regenerate the flyer QR code into `public/` |

## The rules this code enforces

These are not style preferences. Read them before changing anything.

### 1. Confidential locations

Some resources are domestic violence shelters whose addresses must never be
published. Publishing one can get someone killed.

One helper decides: `canShowLocation(resource)` in
`src/lib/canShowLocation.ts`. It returns false when `confidential_location`
is set, or when `access_type` is `hotline-only` or `online`. When it returns
false there is no address, no map pin, no Directions button — removed from
the DOM and excluded from map data, never hidden with CSS or merely disabled.
The reader gets a phone number and a Call button instead.

Three things keep this true rather than hoping:

- **One component renders locations.** `src/components/LocationBlock.tsx` is
  the only place an address or a Directions link is produced. Everything else
  goes through it.
- **A test greps for violations.** `src/lib/__tests__/locationGuard.test.ts`
  walks every source file on every test run and fails if any file outside a
  short allowlist reads `.address`, `.latitude`, `.longitude`, or builds a
  maps URL. If you add a component that needs a location, route it through
  `LocationBlock` rather than adding yourself to the allowlist.
- **The data layer redacts on the way in.** `loadResources` passes every row
  through `redactLocation`, so a gated resource carries no coordinates in
  memory at all. And the database refuses to store an address or coordinates
  on a confidential row in the first place.

### 2. No authentication

No login, no signup, no account wall, no email capture. An account
requirement is a barrier for exactly the people this exists for. If a feature
seems to need auth, the feature is wrong.

### 3. Unverified data does not render

Resources appear only when `verified` is true. Reviews appear only when
`status` is `approved`. Submissions never appear until a person moves them
into the resources table by hand. Both rules are enforced in the query *and*
in Postgres row level security.

Wrong hours are worse than no listing — someone takes two buses to a closed
door.

**Verified means a human called the organisation and confirmed the details.**
It does not mean the data was copied from Google Maps or 211. Do not mark
scraped data verified.

### 4. Accessibility floor

Tap targets at least 44x44px. Body text at least 16px. Works down to a 320px
viewport. WCAG AA contrast. Category meaning never carried by colour alone —
every coloured chip spells out its category. Every icon button has a label.

### 5. No tracking

No analytics, no tag managers, no third-party scripts. This app's users have
real reasons not to want their resource searches logged. The Supabase client
is configured not to persist a session, and `Referrer-Policy: no-referrer` is
set at the CDN.

## Open/closed status

Computed in `src/lib/hours.ts` against `America/Los_Angeles`, never the
browser's timezone — a reader could be anywhere and a wrong answer sends them
to a locked door.

It handles closed days, overnight ranges (a shelter open 19:00–07:00),
split ranges with a lunch break, `open_24_hours`, and missing hours. Three
states are distinguishable on purpose:

| Hours JSON for that weekday | Meaning |
| --- | --- |
| key missing | We do not know. The app says so. |
| `[]` | Closed that day. We do know. |
| `[{ open, close }]` | Open during those ranges. |

A range whose `close` is earlier than its `open` runs overnight. A range
whose `open` and `close` are identical is treated as malformed and ignored,
because guessing between "closed all day" and "open all day" is exactly the
kind of guess that strands someone.

## Spanish

`name_es`, `description_es`, and `eligibility_es` fall back to their English
values when empty. Never render a blank. `src/lib/i18n.ts` holds the UI
strings and the fallback helpers.

## Project layout

```
src/lib/canShowLocation.ts   the location gate — read this first
src/lib/hours.ts             open/closed in Los Angeles time
src/lib/i18n.ts              UI strings and Spanish fallback
src/lib/resources.ts         data access; filters unverified, redacts gated
src/components/LocationBlock.tsx   the only component that renders a location
src/screens/                 Home, ResourceDetail, MapScreen, Suggest, KnowYourRights
know-your-rights.md          rights page content (English)
know-your-rights.es.md       rights page content (Spanish)
supabase/schema.sql          reference DDL and RLS policies
firestore-schema.js          annotated data model — why each field exists
```

## Deployment

Vercel and Netlify configs are in the repo (`vercel.json`, `netlify.toml`).
Both rewrite every path to `index.html`, which a single page app needs or a
refresh on `/map` returns a 404. Set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` in the host's environment variables.

After deploying, regenerate the flyer QR code against the real URL:

```bash
npm run qr -- https://your-deployed-url
```

It writes `public/qr-code.svg` and `public/qr-code.png` at high error
correction, so the code still scans off a photocopied flyer taped to a wall.
The code encodes a plain URL and nothing else — no campaign parameters and no
redirect service, so a scan cannot be traced back to a person.

## Testing

```bash
npm test
```

The suite covers the location gate, the Los Angeles open/closed calculation,
and the standing audit that no new file can reach a location without going
through the gate.

Browser checks are not in the suite. Before a release, load the built app on
a real phone and confirm by hand:

- Search a confidential resource by name. There is no address anywhere on its
  page and no Directions button.
- Its pin is absent from the map.
- The language toggle changes every screen, and a resource with no Spanish
  name still shows its English name rather than a blank.
- The whole app is usable one-handed at 320px.

## Status

Not yet deployed, and the directory is still placeholder data. The database
needs at least 40 verified resources across all five categories before this
is demoable, and each one needs a person to call and confirm it. See the
note at the top of `src/data/sampleResources.ts`.
