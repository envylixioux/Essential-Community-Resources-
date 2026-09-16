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

## Categories

Six categories, named for what a person would actually say they need rather
than how a directory would file it.

| Category | Spanish |
| --- | --- |
| `emergency-housing` | Vivienda de emergencia |
| `fair-chance-jobs` | Empleo con segunda oportunidad |
| `docs-and-expungement` | Documentos y expunción |
| `food-and-meals` | Comida y comidas |
| `health-and-support` | Salud y apoyo |
| `clothing` | Ropa |

These replaced `shelter`, `employment`, `documents`, `food`, and `crisis`.
`resolveCategory()` in `src/lib/categories.ts` still accepts the old names for
one release cycle and logs a console warning naming the replacement. When the
warnings stop, delete the legacy half of that file, the `LegacyCategory` type,
and run step 4 of `supabase/migrations/001_category_rename.sql`.

`health-and-support` is broader than the `crisis` category it replaced. Free
clinics, counseling, and substance use support now sit in it alongside crisis
lines. That is only safe because the hotlines strip at the top of the home
screen carries the immediate-danger case and is never behind a filter.

### Sub-type tags

Two categories require a tag, and a resource missing its tag does not render
anywhere — same rule as `verified`, enforced in the app, in the data layer,
and in the Postgres read policy.

`fair-chance-jobs` requires `fair_chance_type`: `signatory`,
`placement-program`, `staffing-agency`, or `workforce-center`. A workforce
center serves everyone who walks in; a placement program has an intake and a
waiting list. Those are different phone calls and the chip says which.

**Never list an employer as fair chance without one of those tags.** The claim
is about how someone will be treated when they disclose a record. Publishing
it untagged means an applicant walks in on our say-so and gets rejected
anyway.

`docs-and-expungement` requires `service_provided`: `id-replacement`,
`expungement`, or `both`. Filtering that category shows a secondary chip row
for the two halves, multi-select with OR logic. Detail pages cross-link the
other half, because clearing a record and replacing an ID usually go together
and finding that out on a second trip wastes a day.

## Home screen

Four things stack above the resource list, in this order:

1. **Hotlines strip.** 211, 988, and the domestic violence hotline. Never
   behind a filter, a tile, or a scroll. Labels say what each number actually
   is: 211 is Los Angeles County social services, part of the United Way's
   national 211 network, and is not a reentry hotline.
2. **Location indicator.** The current search area with a Change link, and the
   freshness dot.
3. **Quick Finder tiles.** Six tiles, 3x2 at phone width and 2x3 below 360px.
   A second door into the same data for someone who does not know the app's
   vocabulary yet.
4. **Search box and filter pills.** Neither the tiles nor the pills hide
   behind a menu. Browsing and knowing-what-you-want are different jobs.

### Location

Opt-in every single time. Nothing asks for geolocation on load or in the
background. Auto-detect and ZIP entry both live behind the Change button, and
the only thing stored is the chosen area, in the reader's own browser under
`searchArea`.

A location outside Los Angeles County is refused with a plain message rather
than quietly recentred on LA. Saying "here are your local resources" to
someone 400 miles away is the misleading answer and somebody acts on it.

The ZIP ranges in `src/lib/searchArea.ts` **need verification against the
county's published list before launch.** A wrong entry tells a real person we
do not serve them when we do.

Narrowing by ZIP never hides a resource whose location the gate withholds. A
domestic violence shelter a person cannot find is the same as no shelter.

### Empty state

When a filter returns nothing, the app offers three concrete actions: call
211, widen the search area, or suggest the resource we are missing, with the
filtered category carried into the form. It never leaves someone at a dead
end. An empty state that apologises and blames the connection hands the
reader their own problem back.

### Freshness dot

One dot beside the area name. Green at 80% or more of local resources
verified within 90 days, amber from 50%, red below that. Tap it for the
percentage and the most recent verification date.

This is transparency, not gamification, and the dot is the entire feature.
If it ever grows into a data quality dashboard, it has stopped being useful
to the reader.

## Deliberately not built

These were considered and rejected. Do not add them.

- **A chatbot as a primary interface.** Every resource here is human-verified.
  An AI answering freehand can invent an address, misstate hours, or describe
  a program that does not exist, which undoes the verification work entirely.
  The only acceptable future scope is a scoped router that suggests filters
  and never states a fact, an address, a phone number, or an hour.
- **Sidebar navigation on mobile.** The home-screen-with-filters pattern is
  correct for mobile-first. A sidebar is fine in a future desktop layout but
  must never appear at phone widths.
- **Catchier hotline labels.** Wrong labels erode trust with the people most
  likely to notice the error.

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
src/lib/categories.ts        category compatibility layer and tag rules
src/lib/hours.ts             open/closed in Los Angeles time
src/lib/searchArea.ts        the reader's own location; never a resource's
src/lib/freshness.ts         the one dot
src/lib/i18n.ts              UI strings and Spanish fallback
src/lib/resources.ts         data access; withholds unverified and untagged
src/components/LocationBlock.tsx   the only component that renders a location
src/screens/                 Home, ResourceDetail, MapScreen, Suggest, KnowYourRights
know-your-rights.md          rights page content (English)
know-your-rights.es.md       rights page content (Spanish)
supabase/schema.sql          reference DDL and RLS policies
supabase/migrations/         the category rename; read the header before running
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
- Its pin is absent from the map, and narrowing the search to a ZIP does not
  hide it from the list.
- A `fair-chance-jobs` row with no `fair_chance_type` does not appear, and is
  not reachable by typing its URL directly.
- The language toggle changes every screen, and a resource with no Spanish
  name still shows its English name rather than a blank.
- The whole app is usable one-handed at 320px.

## Status

Not yet deployed, and the directory is still placeholder data. The database
needs at least 40 verified resources across all five categories before this
is demoable, and each one needs a person to call and confirm it. See the
note at the top of `src/data/sampleResources.ts`.
