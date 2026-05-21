-- ═══════════════════════════════════════════════════════════════════════════════
-- Costa Sol · Stäng av anon-åtkomst, kräv inloggning
-- Kör i Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- INNAN du kör denna:
-- 1. Gå till Supabase Dashboard → Authentication → Users
-- 2. Klicka "Add user" → "Create new user" → fyll i e-mail + lösenord
-- 3. SPARA INLOGGNINGSUPPGIFTERNA — du kommer behöva dem för att logga in i appen
--
-- Annars stänger denna migration ute dig själv från appen.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ta bort gamla anon-policies
drop policy if exists "anon full access properties"      on properties;
drop policy if exists "anon full access rentals"         on rentals;
drop policy if exists "anon full access expenses"        on expenses;
drop policy if exists "anon full access market"          on area_market_data;
drop policy if exists "anon full access prospects"       on prospects;
drop policy if exists "anon full access docs"            on property_documents;
drop policy if exists "anon full access recurring"      on recurring_expenses;
drop policy if exists "anon full access mortgages"       on mortgages;
drop policy if exists "anon full access rate_periods"    on mortgage_rate_periods;
drop policy if exists "anon full access budgets"         on budgets;
drop policy if exists "anon full access data_sources"    on market_data_sources;
drop policy if exists "anon full access ai_insights"     on ai_insights;
drop policy if exists "anon full access rental_sources" on rental_sources;
drop policy if exists "anon full access milestones"      on milestones;

-- Skapa nya policies: bara inloggade får läsa/skriva
-- (För ett delat konto räcker detta — alla inloggade ser samma data.)

create policy "auth full access properties"
  on properties for all to authenticated using (true) with check (true);

create policy "auth full access rentals"
  on rentals for all to authenticated using (true) with check (true);

create policy "auth full access expenses"
  on expenses for all to authenticated using (true) with check (true);

create policy "auth full access market"
  on area_market_data for all to authenticated using (true) with check (true);

create policy "auth full access prospects"
  on prospects for all to authenticated using (true) with check (true);

create policy "auth full access docs"
  on property_documents for all to authenticated using (true) with check (true);

create policy "auth full access recurring"
  on recurring_expenses for all to authenticated using (true) with check (true);

create policy "auth full access mortgages"
  on mortgages for all to authenticated using (true) with check (true);

create policy "auth full access rate_periods"
  on mortgage_rate_periods for all to authenticated using (true) with check (true);

create policy "auth full access budgets"
  on budgets for all to authenticated using (true) with check (true);

create policy "auth full access data_sources"
  on market_data_sources for all to authenticated using (true) with check (true);

create policy "auth full access ai_insights"
  on ai_insights for all to authenticated using (true) with check (true);

create policy "auth full access rental_sources"
  on rental_sources for all to authenticated using (true) with check (true);

create policy "auth full access milestones"
  on milestones for all to authenticated using (true) with check (true);

-- Storage bucket för dokument: kräv inloggning även där
-- (Detta gäller "property-docs" bucket — uppdatera namn om annorlunda)
-- Storage-policies sätts via Supabase Dashboard → Storage → Policies
-- eftersom de hanteras annorlunda än vanliga tabell-policies.
