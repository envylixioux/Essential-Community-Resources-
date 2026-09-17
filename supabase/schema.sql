-- Quick Connect LA — Postgres schema (Supabase)
--
-- REFERENCE COPY. The research group is entering data against the live
-- project right now. Do not run this against a populated database and do not
-- change column names here without checking with the team first — a rename
-- breaks their data entry mid-flight.
--
-- The annotated reasoning for each field is in firestore-schema.js at the
-- repo root. That file predates the move to Postgres and uses camelCase; the
-- explanations are still accurate.

-- Named for what a person would say they need, not how a directory would
-- file it. See supabase/migrations/001_category_rename.sql for the move from
-- the previous names and the compatibility window.
create type resource_category as enum (
  'emergency-housing',
  'fair-chance-jobs',
  'docs-and-expungement',
  'food-and-meals',
  'health-and-support',
  'clothing',
  'mobile-services',
  'family-support',
  -- Tagged rather than folded into the others: some people are looking for a
  -- congregation and some are avoiding one. Both deserve to know first.
  'faith-based'
);

-- A short fixed vocabulary so both languages are written once and the card
-- can show the single most useful one.
create type eligibility_tag as enum (
  'referral-needed', 'women-only', 'no-id-needed', 'walk-ins-welcome', 'free'
);

-- What kind of fair-chance resource this is. A workforce center serves
-- everyone walking in; a placement program has an intake and a waiting list.
-- Different phone calls, and worth knowing which before making one.
create type fair_chance_type as enum (
  'signatory',
  'placement-program',
  'staffing-agency',
  'workforce-center'
);

-- Which half of docs-and-expungement a resource covers.
create type service_provided as enum ('id-replacement', 'expungement', 'both');

create type resource_access_type as enum (
  'walk-in', 'appointment', 'hotline-only', 'online', 'application'
);

create type moderation_status as enum ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------------------------
-- resources
-- ---------------------------------------------------------------------------

create table resources (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  name_es text,
  description text not null,
  description_es text,

  category resource_category not null,
  access_type resource_access_type not null,

  -- When true the address must never leave this table. Domestic violence
  -- shelters live behind this flag. The app refuses to render a location for
  -- these rows; see src/lib/canShowLocation.ts.
  confidential_location boolean not null default false,

  address text,
  neighborhood text,
  latitude double precision,
  longitude double precision,

  phone text,
  hotline text,
  website text,
  email text,

  -- { "monday": [{ "open": "09:00", "close": "17:00" }], ... }
  -- A missing weekday key means "unknown". An empty array means "closed".
  -- A range whose close is earlier than its open runs overnight.
  hours jsonb,
  open_24_hours boolean not null default false,
  hours_note text,
  hours_note_es text,

  eligibility text,
  eligibility_es text,
  eligibility_tags eligibility_tag[],
  languages text[],
  cost text,
  cost_es text,

  -- Three-state on purpose: null means we have not asked, which is not the
  -- same as "no". The UI shows this only when we actually know.
  wheelchair_accessible boolean,

  serves_population text,
  serves_population_es text,

  -- Never hides the phone number. The notice sits below the Call button,
  -- because calling to ask how to get a referral is the right next step.
  referral_required boolean not null default false,
  referral_note text,
  referral_note_es text,

  -- Required for their own categories; see the check constraints below.
  fair_chance_type fair_chance_type,
  service_provided service_provided,

  -- Nothing renders until a person has called and confirmed the details.
  verified boolean not null default false,
  last_verified_at date,
  -- How it was confirmed: 'phone call', 'site visit', 'staff email'. Shown to
  -- the reader so they can judge how much to trust the hours above it.
  verification_method text,

  created_at timestamptz not null default now(),

  -- A confidential resource must not carry coordinates at all. Belt and
  -- braces behind the application-level gate: if the row cannot hold a
  -- location, no bug in the client can leak one.
  constraint confidential_has_no_coordinates check (
    not confidential_location or (latitude is null and longitude is null)
  ),
  constraint confidential_has_no_address check (
    not confidential_location or address is null
  ),
  -- A confidential resource is reachable by phone or it is not reachable.
  constraint confidential_has_a_number check (
    not confidential_location or (hotline is not null or phone is not null)
  ),

  -- A fair-chance listing with no type does not render anywhere. Naming an
  -- employer as "fair chance" without knowing what kind sends an applicant to
  -- be rejected over their record on our say-so.
  constraint fair_chance_needs_type check (
    category <> 'fair-chance-jobs' or fair_chance_type is not null
  ),
  constraint docs_need_service check (
    category <> 'docs-and-expungement' or service_provided is not null
  )
);

create index resources_category_idx on resources (category) where verified;
create index resources_verified_idx on resources (verified);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------

create table reviews (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text,
  status moderation_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index reviews_approved_idx on reviews (resource_id) where status = 'approved';

-- ---------------------------------------------------------------------------
-- submissions
-- ---------------------------------------------------------------------------

create table submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category resource_category not null,
  access_type resource_access_type not null,
  description text not null,
  address text,
  phone text,
  notes text,
  status moderation_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row level security
--
-- There is no login anywhere in this app, so every request arrives as the
-- anon role. RLS is what keeps unverified rows, pending reviews, and the
-- submissions queue out of the client.
-- ---------------------------------------------------------------------------

alter table resources enable row level security;
alter table reviews enable row level security;
alter table submissions enable row level security;

-- Anyone may read a verified resource that carries every tag its category
-- requires. Unverified rows are invisible, and so are incomplete ones: wrong
-- hours are worse than no listing, and an untagged "fair chance employer" is
-- worse than both.
create policy resources_public_read on resources
  for select to anon
  using (
    verified = true
    and (category <> 'fair-chance-jobs' or fair_chance_type is not null)
    and (category <> 'docs-and-expungement' or service_provided is not null)
  );

-- Anyone may read an approved review. Pending and rejected notes never leave
-- the database.
create policy reviews_public_read on reviews
  for select to anon
  using (status = 'approved');

-- Anyone may file a suggestion, and nobody may read the queue back.
-- Submissions are promoted into resources by hand.
create policy submissions_public_insert on submissions
  for insert to anon
  with check (status = 'pending');

-- Deliberately no select policy on submissions, and no insert, update, or
-- delete policy on resources. Moderation happens in the Supabase dashboard
-- with a privileged role.
