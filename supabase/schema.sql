-- Costa Sol · Supabase schema
-- Kör detta i Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ── Properties ────────────────────────────────────────────────────────────────
create table if not exists properties (
  id               text primary key,
  name             text not null,
  development      text not null default '',
  area             text not null default '',
  type             text not null default 'apartment',
  status           text not null default 'watchlist',
  bedrooms         integer not null default 2,
  bathrooms        integer not null default 2,
  size_sqm         integer not null default 0,
  terrace_sqm      integer not null default 0,
  purchase_price   integer not null default 0,
  current_value    integer not null default 0,
  purchase_date    text,
  completion_date  text,
  rental_strategy  text not null default 'short-term',
  has_vft_license  boolean not null default false,
  notes            text,
  created_at       timestamptz default now()
);

-- ── Rentals ───────────────────────────────────────────────────────────────────
create table if not exists rentals (
  id           text primary key,
  property_id  text not null references properties(id) on delete cascade,
  year         integer not null,
  month        integer not null,
  nights       integer not null,
  revenue      integer not null,
  platform     text not null default 'airbnb',
  notes        text,
  created_at   timestamptz default now()
);

-- ── Expenses ──────────────────────────────────────────────────────────────────
create table if not exists expenses (
  id           text primary key,
  property_id  text not null references properties(id) on delete cascade,
  date         text not null,
  category     text not null,
  amount       integer not null,
  description  text not null default '',
  deductible   boolean not null default true,
  created_at   timestamptz default now()
);

-- ── Row Level Security (öppen för alla — ingen auth) ─────────────────────────
-- OBS: Detta gör datan tillgänglig för alla med din anon-nyckel.
-- Lämpligt för familjebruk utan inloggning.

alter table properties enable row level security;
alter table rentals     enable row level security;
alter table expenses    enable row level security;

-- Tillåt full åtkomst via anon-nyckeln
create policy "anon full access properties" on properties for all using (true) with check (true);
create policy "anon full access rentals"    on rentals    for all using (true) with check (true);
create policy "anon full access expenses"   on expenses   for all using (true) with check (true);

-- ── Marknadsdata per område ───────────────────────────────────────────────────
create table if not exists area_market_data (
  id               text primary key,
  area             text not null,
  price_per_sqm    integer not null default 0,
  avg_adr          integer not null default 0,
  occupancy_pct    numeric(5,2) not null default 0,
  annual_growth_pct numeric(5,2) not null default 0,
  source           text not null default '',
  updated_at       text not null,
  notes            text,
  created_at       timestamptz default now()
);

create policy "anon full access market" on area_market_data for all using (true) with check (true);
alter table area_market_data enable row level security;

-- ── Prospekt (objektjämförelse) ───────────────────────────────────────────────
create table if not exists prospects (
  id             text primary key,
  name           text not null,
  area           text not null default '',
  type           text not null default 'apartment',
  bedrooms       integer not null default 2,
  size_sqm       integer not null default 0,
  terrace_sqm    integer not null default 0,
  purchase_price integer not null default 0,
  floor          text,
  development    text,
  link           text,
  notes          text,
  created_at     timestamptz default now()
);

create policy "anon full access prospects" on prospects for all using (true) with check (true);
alter table prospects enable row level security;

-- ── Dokument per fastighet ────────────────────────────────────────────────────
create table if not exists property_documents (
  id           text primary key,
  property_id  text not null,
  name         text not null,
  category     text not null default 'other',
  storage_path text not null,
  size_bytes   integer not null default 0,
  uploaded_at  timestamptz default now(),
  notes        text
);

create policy "anon full access docs" on property_documents for all using (true) with check (true);
alter table property_documents enable row level security;

-- Storage bucket skapas via Supabase dashboard eller CLI:
-- supabase storage create property-docs --public false

-- ── Påminnelser & milstolpar ──────────────────────────────────────────────────
create table if not exists milestones (
  id           text primary key,
  property_id  text not null default '',
  title        text not null,
  category     text not null default 'other',
  priority     text not null default 'medium',
  due_date     text not null,
  status       text not null default 'upcoming',
  amount       integer,
  notes        text,
  completed_at text,
  created_at   timestamptz default now()
);

create policy "anon full access milestones" on milestones for all using (true) with check (true);
alter table milestones enable row level security;

-- ── Milestones ────────────────────────────────────────────────────────────────
create table if not exists milestones (
  id           text primary key,
  property_id  text not null default '',
  title        text not null,
  category     text not null default 'other',
  due_date     text not null,
  status       text not null default 'upcoming',
  amount       integer,
  notes        text,
  completed_at text,
  created_at   timestamptz default now()
);

create policy "anon full access milestones" on milestones for all using (true) with check (true);
alter table milestones enable row level security;
