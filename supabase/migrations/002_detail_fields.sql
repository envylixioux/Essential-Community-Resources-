-- 002 — three more categories, and the fields the detail page shows
--
-- Additive only. Nothing is renamed and nothing is dropped, so this is safe
-- to run while the research group is entering data. Every new column is
-- nullable and every new enum value is optional, which means existing rows
-- stay valid and keep rendering exactly as they did.
--
-- Coordinate the enum additions anyway: the team needs to know the three new
-- categories exist before they start filing resources under them.

begin;

-- ---------------------------------------------------------------------------
-- Three more categories.
--
-- faith-based is tagged rather than folded into the others on purpose. Some
-- people are looking for a congregation and some are avoiding one, and both
-- deserve to know before they walk in.
-- ---------------------------------------------------------------------------

alter type resource_category add value if not exists 'mobile-services';
alter type resource_category add value if not exists 'family-support';
alter type resource_category add value if not exists 'faith-based';

commit;

begin;

-- ---------------------------------------------------------------------------
-- Eligibility tags.
--
-- A short fixed vocabulary rather than free text, so both languages are
-- written once and the card can pick the single most useful one to show.
-- ---------------------------------------------------------------------------

create type eligibility_tag as enum (
  'referral-needed',
  'women-only',
  'no-id-needed',
  'walk-ins-welcome',
  'free'
);

alter table resources add column eligibility_tags eligibility_tag[];

-- ---------------------------------------------------------------------------
-- Fields the detail page reads.
--
-- wheelchair_accessible is deliberately nullable three-state: null means we
-- have not asked, which is not the same as "no". The UI shows the row only
-- when we actually know, rather than implying a building has stairs.
-- ---------------------------------------------------------------------------

alter table resources add column hours_note text;
alter table resources add column hours_note_es text;
alter table resources add column email text;
alter table resources add column cost text;
alter table resources add column cost_es text;
alter table resources add column wheelchair_accessible boolean;
alter table resources add column serves_population text;
alter table resources add column serves_population_es text;

-- A referral requirement never hides the phone number. The app puts this
-- notice below the Call button, because calling to ask how to get a referral
-- is the right next step.
alter table resources add column referral_required boolean not null default false;
alter table resources add column referral_note text;
alter table resources add column referral_note_es text;

-- How the listing was confirmed: 'phone call', 'site visit', 'staff email'.
-- Shown to the reader so they can judge how much to trust the hours above it.
alter table resources add column verification_method text;

-- A referral requirement and the tag that announces it should not disagree.
-- NOT VALID so existing rows are not rejected; validate once they are tidied.
alter table resources
  add constraint referral_tag_matches check (
    not referral_required
    or eligibility_tags is null
    or 'referral-needed' = any (eligibility_tags)
  ) not valid;

commit;
