-- 001 — rename categories to plain-need language, add sub-type tags
--
-- DO NOT RUN THIS UNPLANNED. The research group is entering data against the
-- live project. Coordinate a window with them before applying it: steps 1-3
-- are safe to run while data entry continues, step 4 is not.
--
-- Run steps 1 through 3 together. Leave step 4 until every writer (the app,
-- any spreadsheet import, any dashboard view) has been updated and the
-- deprecation warnings in the browser console have stopped appearing. That
-- is the "one release cycle" the compatibility layer buys.

begin;

-- ---------------------------------------------------------------------------
-- Step 1. Add the new category values alongside the old ones.
--
-- Postgres cannot add an enum value inside a transaction in versions before
-- 12. Supabase is well past that, but if this errors with "ALTER TYPE ... ADD
-- cannot run inside a transaction block", run the six ALTER TYPE statements
-- on their own first and then the rest of this file.
-- ---------------------------------------------------------------------------

alter type resource_category add value if not exists 'emergency-housing';
alter type resource_category add value if not exists 'fair-chance-jobs';
alter type resource_category add value if not exists 'docs-and-expungement';
alter type resource_category add value if not exists 'food-and-meals';
alter type resource_category add value if not exists 'health-and-support';
alter type resource_category add value if not exists 'clothing';

commit;

begin;

-- ---------------------------------------------------------------------------
-- Step 2. Move existing rows onto the new values.
--
-- 'crisis' becomes 'health-and-support', which is a genuine broadening rather
-- than a rename: free clinics, mental health care and substance use support
-- now belong in it alongside the crisis lines. The immediate-danger case is
-- carried by the hotlines strip at the top of the home screen, which is not
-- behind any filter.
-- ---------------------------------------------------------------------------

update resources set category = 'emergency-housing'    where category = 'shelter';
update resources set category = 'fair-chance-jobs'     where category = 'employment';
update resources set category = 'docs-and-expungement' where category = 'documents';
update resources set category = 'food-and-meals'       where category = 'food';
update resources set category = 'health-and-support'   where category = 'crisis';

update submissions set category = 'emergency-housing'    where category = 'shelter';
update submissions set category = 'fair-chance-jobs'     where category = 'employment';
update submissions set category = 'docs-and-expungement' where category = 'documents';
update submissions set category = 'food-and-meals'       where category = 'food';
update submissions set category = 'health-and-support'   where category = 'crisis';

-- ---------------------------------------------------------------------------
-- Step 3. Sub-type tags.
--
-- Both are nullable columns with a constraint that makes them required for
-- their own category. Existing employment rows are NOT auto-tagged: a human
-- has to decide what each one actually is. Until then they are withheld from
-- the app, which is the intended behaviour — see the constraint comment.
-- ---------------------------------------------------------------------------

create type fair_chance_type as enum (
  'signatory',          -- employer has publicly signed a fair-chance pledge
  'placement-program',  -- places justice-impacted workers; has an intake
  'staffing-agency',    -- agency specialising in this hiring
  'workforce-center'    -- WorkSource or America's Job Center; serves everyone
);

create type service_provided as enum (
  'id-replacement',  -- birth certificate, CA ID, SSN card
  'expungement',     -- record clearing, dismissal, sealing
  'both'             -- handles ID and record work at one intake
);

alter table resources add column fair_chance_type fair_chance_type;
alter table resources add column service_provided service_provided;

-- A fair-chance listing with no type does not render. Naming an employer as
-- "fair chance" without knowing what kind sends an applicant to be rejected
-- over their record on our say-so. This is enforced in the app, in the RLS
-- read policy below, and here.
--
-- NOT VALID so the migration does not fail on rows the team has yet to tag.
-- Run `alter table resources validate constraint fair_chance_needs_type;`
-- once every employment row has been categorised.
alter table resources
  add constraint fair_chance_needs_type check (
    category <> 'fair-chance-jobs' or fair_chance_type is not null
  ) not valid;

alter table resources
  add constraint docs_need_service check (
    category <> 'docs-and-expungement' or service_provided is not null
  ) not valid;

-- The public read policy withholds untagged rows the same way it withholds
-- unverified ones, so an incomplete row cannot reach a reader even if the
-- constraint is still NOT VALID.
drop policy if exists resources_public_read on resources;
create policy resources_public_read on resources
  for select to anon
  using (
    verified = true
    and (category <> 'fair-chance-jobs' or fair_chance_type is not null)
    and (category <> 'docs-and-expungement' or service_provided is not null)
  );

commit;

-- ---------------------------------------------------------------------------
-- Step 4. LATER — drop the old enum values.
--
-- Leave this commented until the deprecation warnings stop. Postgres cannot
-- remove a value from an enum in place, so this rebuilds the type.
--
-- begin;
--
-- alter type resource_category rename to resource_category_old;
--
-- create type resource_category as enum (
--   'emergency-housing', 'fair-chance-jobs', 'docs-and-expungement',
--   'food-and-meals', 'health-and-support', 'clothing'
-- );
--
-- alter table resources
--   alter column category type resource_category using category::text::resource_category;
-- alter table submissions
--   alter column category type resource_category using category::text::resource_category;
--
-- drop type resource_category_old;
--
-- commit;
