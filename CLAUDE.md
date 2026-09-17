# CLAUDE.md — Quick Connect LA

Project context for Claude Code. Read this before making changes.

## What this is

Quick Connect LA is a mobile-first web app that puts Los Angeles County's essential community resources — food, shelter, ID and document help, employment services, and crisis support — in one place anyone can reach by scanning a QR code, with no app download or account required. It's built for people reentering the community after incarceration and for their neighbors alike, focusing on immediate, same-day needs in English and Spanish.

This is a university group project with a three-week deadline. Prioritize a working, safe, demonstrable app over architectural elegance.

## Who uses it

Someone standing outside a building on a phone with 12% battery, trying to find out whether the food bank is still open and how to get there. Possibly on an older Android. Possibly on a metered connection. Possibly reading in Spanish. Design and code decisions get judged against that person.

## Non-negotiables

These are not preferences. Do not trade them away for convenience.

### 1. Confidential locations

Some resources are domestic violence shelters whose addresses must never be published. Publishing one can get someone killed.

There is a single shared helper:

```ts
canShowLocation(resource: Resource): boolean
```

It returns `false` when `confidential_location` is true, or when `access_type` is `hotline-only` or `online`.

Every component that could render a location must call it. When it returns false:

* No address rendered
* No map pin — the resource is excluded from map data entirely, not hidden with CSS
* No Directions button — removed from the DOM, not disabled
* Show the hotline or phone number with a Call button instead

If you add a new component that displays resource data, wire it to this helper. If you find a code path that bypasses it, that's a bug with the highest priority in the repo.

### 2. No authentication

No login, no signup, no account wall, no email capture before content. An account requirement is a barrier for exactly the people this exists for. If a feature seems to need auth, the feature is wrong.

### 3. Unverified data does not render

Resources only appear when `verified === true`. Reviews only appear when `status === 'approved'`. Submissions never appear until a human moves them into the resources table. Wrong hours are worse than no listing — someone takes two buses to a closed door.

### 4. Accessibility floor

* Tap targets ≥ 44×44px
* Body text ≥ 16px
* Works down to 320px viewport width
* WCAG AA contrast
* Category meaning never conveyed by color alone — always include text
* Labels on every icon button

## Stack

Check `package.json` for what's actually installed before assuming.

The frontend was scaffolded in Lovable and exported to this repo. Expect generated code that is verbose and inconsistently organized. Refactor opportunistically when touching a file; don't launch a cleanup project.

Backend is Supabase (Postgres). If you find Firebase remnants from earlier planning, they're dead code — remove them.

Deployment target is Vercel or Netlify, auto-deploying from `main`.

## Data model

Full annotated schema lives in `firestore-schema.js` at the repo root. It was written for Firestore and the field names there use camelCase; the actual Postgres tables use snake_case. The comments explaining why each field exists are still accurate and worth reading.

Three tables:

* resources — the directory itself. Five categories: `food`, `shelter`, `documents`, `employment`, `crisis`.
* reviews — user reviews, default status `pending`, manually approved.
* submissions — community-suggested resources, default status `pending`, manually promoted into `resources`.

Two fields drive most of the UI logic: `access_type` (walk-in, appointment, hotline-only, online, application) and `confidential_location`. Between them they determine whether a resource has an address, hours, a map presence, or just a phone number.

## Screens

1. Home — search, category filter pills, resource list with computed open/closed status
2. Resource detail — Call and Directions buttons, hours, eligibility, reviews
3. Map — category-colored pins, optional geolocation, nearest three
4. Suggest a resource — public submission form
5. Know your rights — static markdown page on California and LA fair chance hiring law. Content in `know-your-rights.md`. It carries a "not legal advice" notice and a last-reviewed date — keep both.

## Current priorities

Work top down. Ask before reordering.

1. Audit `canShowLocation` coverage. Grep for every place `address`, `latitude`, `longitude`, or a maps URL is referenced. Confirm each is guarded. This is the first task regardless of what else is open.
2. Open/closed calculation. Compute from the `hours` JSON against current time in `America/Los_Angeles`. Handle: closed days, overnight ranges (shelters open 7pm–7am), `open_24_hours`, and missing hours. Do not use the browser's local timezone — a user could be anywhere.
3. Mobile pass on a real device. Not the browser preview. Test one-handed.
4. Spanish fallback behavior. When `name_es` or `description_es` is empty, render the English value. Never render blank.
5. Loading states. Skeletons, not spinners. List renders as soon as resource data arrives — do not block on map or geolocation.
6. QR code. Generate one pointing at the deployed URL for print flyers. A static image is fine; this doesn't need to be dynamic.

## Definition of done for the assignment

* Deployed at a public URL
* At least 40 verified resources across all five categories
* All five screens functional
* EN/ES toggle works throughout
* No address visible for any confidential-location resource, verified by searching the running app
* Repo has a README with setup instructions
* Works on a phone

## Things not to do

* Don't add authentication.
* Don't add analytics or tracking. This app's users have real reasons to not want their resource searches logged.
* Don't scrape resource data from Google Maps or 211 and mark it verified. Verified means a human called and confirmed.
* Don't add DV shelter addresses even if you find them published elsewhere. Other sites being careless isn't permission.
* Don't restructure the database schema without checking with the team — the research group is entering data against it right now.
* Don't upgrade major dependency versions during week three.

## Open questions for the team

Flag these rather than deciding unilaterally:

* Review moderation currently has no admin interface. Someone approves rows by hand in the Supabase dashboard. Is that acceptable for the demo, or is a minimal admin view in scope?
* Distance sorting requires geospatial calculation. If it's slow or inaccurate, is sorting by neighborhood an acceptable fallback?
* Who is the named owner of the "last reviewed" date on the Know Your Rights page after the assignment ends?

---

# Addendum: where the code has moved since the above was written

*Added 2026-09-16. Everything above is the original brief, kept as written. This section records where the code no longer matches it, so the two do not quietly disagree. The non-negotiables above are unchanged and still govern.*

## Categories: nine, not five

The five categories were renamed to plain-need language and three were added later:

| Now | Was |
| --- | --- |
| `emergency-housing` | `shelter` |
| `fair-chance-jobs` | `employment` |
| `docs-and-expungement` | `documents` |
| `food-and-meals` | `food` |
| `health-and-support` | `crisis` |
| `clothing` | (new) |
| `mobile-services` | (new) |
| `family-support` | (new) |
| `faith-based` | (new) |

`resolveCategory()` in `src/lib/categories.ts` still accepts the old names and logs a console warning naming the replacement. Delete that legacy half, and run step 4 of `supabase/migrations/001_category_rename.sql`, once the warnings stop.

`health-and-support` is deliberately broader than the `crisis` category it replaced: free clinics and ongoing counseling sit in it alongside crisis lines. That is only safe because the hotlines strip at the top of the home screen carries the immediate-danger case and is never behind a filter. **Do not remove that strip.**

**Neither migration has been applied to the live database.** Both carry headers explaining which steps are safe to run during data entry. Coordinate with the research group before running either.

## Two categories require a sub-type tag

A `fair-chance-jobs` resource needs `fair_chance_type`, and a `docs-and-expungement` resource needs `service_provided`. A row missing its tag is withheld exactly like an unverified one, in the app and in the Postgres read policy both.

This extends non-negotiable 3 rather than replacing it. "Fair chance employer" is a claim about how someone will be treated when they disclose a record; publishing it untagged sends an applicant to be rejected on our say-so.

## Screens: five, plus what sits above the list

The five screens are all built. The home screen also carries, above the resource list: a hotlines strip, a location indicator with opt-in detection, and a Quick Finder tile grid. Nothing there is behind a menu.

## Priorities 1, 2, 4, 5 and 6 are done

1. The `canShowLocation` audit is a standing test, not a one-time grep. `src/lib/__tests__/locationGuard.test.ts` walks every source file on each run and fails if a file outside a short allowlist reads `.address`, `.latitude`, `.longitude`, or builds a maps URL. Route new code through `LocationBlock` or the helpers in `canShowLocation.ts` rather than adding yourself to the allowlist.
2. Open/closed is computed in `America/Los_Angeles` in `src/lib/hours.ts`, covering closed days, overnight ranges, split ranges, `open_24_hours` and missing hours.
4. Spanish falls back to English through `localizedField()`. It never renders blank.
5. Skeletons, not spinners. The map is lazy-loaded so the list never waits on Leaflet.
6. `npm run qr` writes `public/qr-code.svg` and `.png`.

**Priority 3, the real-device pass, is still owed.** Everything has been verified in Chromium at phone viewports with touch emulation, which is not a thumb on glass.

## Definition of done: what is left

* **Not deployed.** Configs for Vercel and Netlify are in the repo; deploying needs the team's account.
* **No verified resources.** The app ships with clearly-labelled fictional placeholders and shows a sample-data banner whenever they are what is on screen. The 40 real rows need a person to call each organisation. Do not fill this gap by copying another directory.
* Everything else on that list is met, except the real-device pass noted above.

## Two things needing a human

* The LA County ZIP ranges in `src/lib/searchArea.ts` are close but not authoritative. A wrong entry tells a real person we do not serve them when we do. Check them against the county's published list.
* The Know Your Rights last-reviewed date is 2026-09-01 in both language files and still has no named owner.

## Dependency advisories

`npm audit` reports seven. Five are dev-only tooling (vite, vitest, esbuild) and affect the dev server and test runner, not the deployed site. Two are in `react-router` and reach production, but neither applies here: one is an SSR hydration issue and this is a client-only SPA, and the other is an open redirect through `Link`/`useNavigate`, which this app only ever calls with literals or database identifiers, never user input.

Every available fix is a major-version bump, which the rule above rules out for now. Revisit after week three.
