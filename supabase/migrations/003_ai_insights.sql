-- ═══════════════════════════════════════════════════════════════════════════════
-- Costa Sol · AI-rådgivning
-- Kör i Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists ai_insights (
  id                text primary key,
  preset            text not null,                  -- 'rank-prospects' | 'portfolio-summary' | 'cost-anomalies' | 'next-quarter' | 'property-deepdive' | 'custom'
  property_id       text references properties(id) on delete cascade,  -- null = portfölj-bred analys
  prompt            text not null,                  -- frågan som ställdes (utan kontext)
  response          text not null,                  -- Claude:s markdown-svar
  model             text not null default 'claude-sonnet-4-5-20250929',
  tokens_input      integer not null default 0,
  tokens_output     integer not null default 0,
  tokens_cache_read integer not null default 0,     -- antal tokens från cache (gratis)
  tokens_cache_write integer not null default 0,   -- antal tokens som cachades
  duration_ms       integer not null default 0,
  created_at        timestamptz default now()
);

alter table ai_insights enable row level security;
create policy "anon full access ai_insights" on ai_insights for all using (true) with check (true);

create index if not exists idx_ai_insights_created on ai_insights(created_at desc);
create index if not exists idx_ai_insights_property on ai_insights(property_id);
create index if not exists idx_ai_insights_preset on ai_insights(preset);
