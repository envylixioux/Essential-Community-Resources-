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

create type resource_category as enum (
  'food', 'shelter', 'documents', 'employment', 'crisis'
);

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

  -- { "monday": [{ "open": "09:00", "close": "17:00" }], ... }
  -- A missing weekday key means "unknown". An empty array means "closed".
  -- A range whose close is earlier than its open runs overnight.
  hours jsonb,
  open_24_hours boolean not null default false,

  eligibility text,
  eligibility_es text,
  languages text[],

  -- Nothing renders until a person has called and confirmed the details.
  verified boolean not null default false,
  last_verified_at date,

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

-- Anyone may read a verified resource. Unverified rows are invisible:
-- wrong hours are worse than no listing.
create policy resources_public_read on resources
  for select to anon
  using (verified = true);

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
