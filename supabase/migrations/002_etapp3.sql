-- ═══════════════════════════════════════════════════════════════════════════════
-- Costa Sol · Etapp 3 migration
-- Kör i Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Återkommande utgifter ──────────────────────────────────────────────────
-- Mall för utgifter som genereras automatiskt (IBI årligen, community månadsvis etc.)

create table if not exists recurring_expenses (
  id            text primary key,
  property_id   text not null references properties(id) on delete cascade,
  category      text not null,                 -- samma kategorier som expenses
  description   text not null default '',
  amount        integer not null,              -- belopp per period i €
  frequency     text not null default 'yearly',-- 'monthly' | 'quarterly' | 'yearly'
  start_date    text not null,                 -- ISO YYYY-MM-DD
  end_date      text,                          -- ISO eller null = pågående
  day_of_month  integer not null default 1,    -- vilken dag i månaden (1-28)
  month_of_year integer,                       -- för yearly: vilken månad (1-12)
  deductible    boolean not null default true,
  last_generated_date text,                    -- ISO — senast genererade
  active        boolean not null default true,
  notes         text,
  created_at    timestamptz default now()
);

alter table recurring_expenses enable row level security;
create policy "anon full access recurring" on recurring_expenses for all using (true) with check (true);

create index if not exists idx_recurring_property on recurring_expenses(property_id);

-- ── 2. Bolån ──────────────────────────────────────────────────────────────────
-- Ett bolån per objekt (kan finnas flera ifall refinansiering).

create table if not exists mortgages (
  id              text primary key,
  property_id     text not null references properties(id) on delete cascade,
  bank_name       text not null default '',
  original_amount integer not null,             -- ursprungligt lånebelopp €
  start_date      text not null,                -- ISO YYYY-MM-DD
  term_years      integer not null default 25,
  amortization_type text not null default 'annuity', -- 'annuity' | 'linear' | 'interest_only'
  current_balance integer,                      -- om null beräknas från amortizationsschema
  notes           text,
  created_at      timestamptz default now()
);

alter table mortgages enable row level security;
create policy "anon full access mortgages" on mortgages for all using (true) with check (true);

create index if not exists idx_mortgages_property on mortgages(property_id);

-- ── 3. Ränteperioder ──────────────────────────────────────────────────────────
-- Möjliggör att räntan ändras över tid (initial 4.5%, sen 3.8% från visst datum etc.)

create table if not exists mortgage_rate_periods (
  id          text primary key,
  mortgage_id text not null references mortgages(id) on delete cascade,
  start_date  text not null,                    -- ISO YYYY-MM-DD
  end_date    text,                             -- null = pågående
  rate_pct    numeric(5,3) not null,            -- t.ex. 4.500 = 4.5%
  rate_type   text not null default 'fixed',    -- 'fixed' | 'variable'
  notes       text,
  created_at  timestamptz default now()
);

alter table mortgage_rate_periods enable row level security;
create policy "anon full access rate_periods" on mortgage_rate_periods for all using (true) with check (true);

create index if not exists idx_rate_periods_mortgage on mortgage_rate_periods(mortgage_id);

-- ── 4. Budgetar ───────────────────────────────────────────────────────────────
-- Per objekt + år: planerade intäkter & kostnader att jämföra mot faktiskt utfall.

create table if not exists budgets (
  id                  text primary key,
  property_id         text not null references properties(id) on delete cascade,
  year                integer not null,
  expected_revenue    integer not null default 0,  -- bruttohyra €
  expected_nights     integer not null default 0,
  expected_management integer not null default 0,
  expected_cleaning   integer not null default 0,
  expected_fixed      integer not null default 0,  -- IBI + försäkring + community + gestor
  expected_maintenance integer not null default 0,
  expected_other      integer not null default 0,
  notes               text,
  created_at          timestamptz default now(),
  unique (property_id, year)
);

alter table budgets enable row level security;
create policy "anon full access budgets" on budgets for all using (true) with check (true);

-- ── 5. Marknadsdata-källor & cache ────────────────────────────────────────────
-- Spårar var data kommer ifrån och när den senast uppdaterades.

create table if not exists market_data_sources (
  id              text primary key,
  source_name     text not null,                -- 'INE IPV', 'Inside Airbnb', 'Manual'
  source_url      text,
  last_fetched_at timestamptz,
  fetch_status    text default 'pending',       -- 'success' | 'error' | 'pending'
  error_message   text,
  raw_payload     jsonb,                        -- senaste råa data för debug
  created_at      timestamptz default now()
);

alter table market_data_sources enable row level security;
create policy "anon full access data_sources" on market_data_sources for all using (true) with check (true);

-- Seed med kända källor
insert into market_data_sources (id, source_name, source_url) values
  ('ine-ipv',       'INE Índice de Precios de Vivienda', 'https://www.ine.es/jaxiT3/Tabla.htm?t=25171'),
  ('inside-airbnb', 'Inside Airbnb (Málaga)',             'http://insideairbnb.com/get-the-data'),
  ('manual',        'Manuell inmatning',                  null)
on conflict (id) do nothing;
