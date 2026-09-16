/**
 * Quick Connect LA — annotated data model.
 *
 * HISTORICAL NOTE: this file was written while the project was planned on
 * Firestore, so the field names here are camelCase. The live database is
 * Postgres on Supabase and uses snake_case (name_es, confidential_location,
 * access_type, and so on). See supabase/schema.sql for the real DDL and
 * src/lib/types.ts for the TypeScript shape.
 *
 * What is still worth reading here is WHY each field exists. That reasoning
 * did not change when the database did.
 *
 * This file is documentation. Nothing imports it.
 */

export const resources = {
  id: 'uuid',

  // Two names and two descriptions per resource rather than a translations
  // table: the research group enters these by hand and a second table would
  // double their work. When the Spanish field is empty the app renders the
  // English one — never a blank.
  name: 'string',
  nameEs: 'string | null',
  description: 'string',
  descriptionEs: 'string | null',

  // Six categories, fixed. A person in a hurry can hold six options in their
  // head; fifteen sends them scrolling.
  //
  // Named for what someone would actually say they need. Nobody thinks "I
  // need a shelter resource"; they think "I need somewhere to sleep
  // tonight". The old names (food, shelter, documents, employment, crisis)
  // are accepted for one release cycle by resolveCategory() and warn in the
  // console.
  //
  // health-and-support is deliberately broader than the 'crisis' category it
  // replaced: free clinics, mental health care and substance use support sit
  // in it alongside crisis lines. Immediate danger is carried by the hotlines
  // strip at the top of the home screen, which is never behind a filter.
  category:
    "'emergency-housing' | 'fair-chance-jobs' | 'docs-and-expungement' | " +
    "'food-and-meals' | 'health-and-support' | 'clothing'",

  // Required when category is 'fair-chance-jobs'. A listing without it does
  // not render, in the app and in the RLS policy both.
  //
  // "Fair chance employer" is a claim about how someone will be treated when
  // they disclose a record. Publishing that claim untagged means an applicant
  // walks in on our say-so and gets rejected anyway. If we cannot say what
  // kind of fair-chance resource it is, we do not list it.
  fairChanceType:
    "'signatory' | 'placement-program' | 'staffing-agency' | 'workforce-center' | null",

  // Required when category is 'docs-and-expungement'. 'both' marks the
  // organisations that handle ID and record work at one intake, which saves
  // someone a second trip across the county.
  serviceProvided: "'id-replacement' | 'expungement' | 'both' | null",

  // The field that drives most of the UI. It answers "what do I actually do
  // to get help here?", which is a different question from what the resource
  // offers:
  //   walk-in      — turn up during opening hours
  //   appointment  — call first, then turn up
  //   hotline-only — there is nowhere to go, only a number to call
  //   online       — there is nowhere to go, only a website
  //   application  — apply and wait for a decision
  // Combined with confidentialLocation it decides whether a resource has an
  // address, hours, a map pin, or only a phone number.
  accessType: "'walk-in' | 'appointment' | 'hotline-only' | 'online' | 'application'",

  // THE safety field. Domestic violence shelters publish a phone number and
  // nothing else. Their address is withheld because an abuser who finds it
  // can kill someone. This flag is checked by canShowLocation, which every
  // component that could render a location calls before it renders anything.
  //
  // The Postgres table also refuses to store coordinates or an address on a
  // row with this flag set, so a client bug cannot leak what is not there.
  confidentialLocation: 'boolean',

  address: 'string | null',
  // Kept separate from the address so the list can say "Boyle Heights"
  // without giving a street. Also the fallback if distance sorting turns out
  // too slow or inaccurate to ship.
  neighborhood: 'string | null',
  latitude: 'number | null',
  longitude: 'number | null',

  // phone is the main line; hotline is the staffed crisis number. A resource
  // with no location shows the hotline first, because that is the number
  // somebody will actually answer.
  phone: 'string | null',
  hotline: 'string | null',
  website: 'string | null',

  // Per weekday, a list of open ranges as 24-hour "HH:MM" strings:
  //   { monday: [{ open: '09:00', close: '17:00' }] }
  //
  // Three states have to be distinguishable, which is why this is not a
  // single string:
  //   key missing     — we do not know this day's hours. Say so.
  //   empty array     — closed that day. We do know.
  //   one or more     — open during those ranges.
  //
  // A range whose close is earlier than its open runs overnight, which is
  // how shelters open 19:00–07:00 are stored. Open/closed is computed
  // against America/Los_Angeles, never the browser's timezone: the reader
  // could be anywhere, and a wrong answer sends them to a locked door.
  hours: 'object | null',
  openTwentyFourHours: 'boolean',

  // Written in plain language and aimed at the actual question, which is
  // usually "will they turn me away?" — ID requirements, residency, whether
  // a record disqualifies you.
  eligibility: 'string | null',
  eligibilityEs: 'string | null',
  languages: 'string[] | null',

  // Verified means a human called the organisation and confirmed the details.
  // It does not mean the data was copied from another directory. Nothing
  // renders until this is true, because wrong hours are worse than no
  // listing: someone takes two buses to a closed door.
  verified: 'boolean',
  lastVerifiedAt: 'date | null',
}

export const reviews = {
  id: 'uuid',
  resourceId: 'uuid',
  rating: 'number (1-5)',
  body: 'string | null',
  // Defaults to pending. Only approved reviews reach the app. Moderation is
  // manual — a public directory for vulnerable people cannot carry an
  // unmoderated comment field.
  status: "'pending' | 'approved' | 'rejected'",
  createdAt: 'timestamp',
}

export const submissions = {
  id: 'uuid',
  name: 'string',
  category: 'same enum as resources.category',
  accessType: 'same enum as resources.accessType',
  description: 'string',
  address: 'string | null',
  phone: 'string | null',
  notes: 'string | null',
  // A submission never appears in the directory. A person reads it, calls to
  // verify it, and creates a row in resources by hand.
  status: "'pending' | 'approved' | 'rejected'",
  createdAt: 'timestamp',
}
