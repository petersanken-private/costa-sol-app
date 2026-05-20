-- ═══════════════════════════════════════════════════════════════════════════════
-- Costa Sol · iCal-import från Airbnb/Booking/Vrbo
-- Kör i Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- Per fastighet: en eller flera .ics-feed-URL:er (en per plattform)
create table if not exists rental_sources (
  id              text primary key,
  property_id     text not null references properties(id) on delete cascade,
  platform        text not null default 'airbnb',     -- 'airbnb' | 'booking' | 'direct' | 'long-term'
  feed_url        text not null,                       -- t.ex. https://www.airbnb.com/calendar/ical/...
  display_name    text not null default '',           -- t.ex. "Estepona Airbnb"
  default_rate    integer not null default 0,         -- €/natt — används när feed inte innehåller pris
  active          boolean not null default true,
  last_imported_at timestamptz,
  last_status     text,                                -- 'success' | 'error'
  last_error      text,
  bookings_imported integer not null default 0,       -- löpande räknare
  created_at      timestamptz default now()
);

alter table rental_sources enable row level security;
create policy "anon full access rental_sources" on rental_sources for all using (true) with check (true);
create index if not exists idx_rental_sources_property on rental_sources(property_id);

-- Lägg till kolumn på rentals för att markera importerade poster och undvika dubbletter
alter table rentals add column if not exists source_id text references rental_sources(id) on delete set null;
alter table rentals add column if not exists ical_uid text;     -- UID från VEVENT, garanterat unik per bokning
alter table rentals add column if not exists checkin_date text;  -- ISO date — bookings sträcker sig över flera månader
alter table rentals add column if not exists checkout_date text;

-- Unik constraint per (source_id, ical_uid) så samma bokning inte importeras två gånger
create unique index if not exists uniq_rentals_ical
  on rentals(source_id, ical_uid)
  where ical_uid is not null;
