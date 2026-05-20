// ═══════════════════════════════════════════════════════════════════════════════
// Supabase Edge Function · refresh-market-data
// ═══════════════════════════════════════════════════════════════════════════════
//
// Hämtar gratis marknadsdata för Costa del Sol-områden och uppdaterar
// area_market_data-tabellen.
//
// Källor:
//   1. INE IPV API     — bostadsprisindex per provins (årlig tillväxt %)
//   2. Inside Airbnb   — STR ADR + occupancy (CSV listings för Málaga)
//
// Deploy:
//   supabase functions deploy refresh-market-data
//
// Kör manuellt:
//   supabase functions invoke refresh-market-data
//
// Schemalägg (via pg_cron i Supabase dashboard):
//   select cron.schedule('refresh-market-data', '0 6 * * 1',
//     $$ select net.http_post(url := '<function-url>') $$);
// ═══════════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// CORS-headers så browsern kan anropa funktionen från localhost / produktion
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Områden vi spårar. Mappar Costa del Sol-stadsdelar till INE-koder och
// Inside Airbnb-neighbourhoods. Lägg till nya rader här när du följer fler områden.
const AREA_MAP = [
  { area: 'Marbella',                ineCode: '29',    airbnbNeighbourhood: 'Marbella' },
  { area: 'Estepona',                ineCode: '29',    airbnbNeighbourhood: 'Estepona' },
  { area: 'Estepona Gamla Stan',     ineCode: '29',    airbnbNeighbourhood: 'Estepona' },
  { area: 'Cancelada',               ineCode: '29',    airbnbNeighbourhood: 'Estepona' },
  { area: 'Golden Mile',             ineCode: '29',    airbnbNeighbourhood: 'Marbella' },
  { area: 'Puerto Banús',            ineCode: '29',    airbnbNeighbourhood: 'Marbella' },
  { area: 'Nueva Andalucía',         ineCode: '29',    airbnbNeighbourhood: 'Marbella' },
];

// ── 1. INE IPV — årlig prisutveckling per provins ───────────────────────────
// API-doc: https://www.ine.es/dyngs/DataLab/manual.html?cid=64
async function fetchIneGrowth(provinceCode: string): Promise<number | null> {
  try {
    // INE har en publik JSON-API. Provins 29 = Málaga.
    // Tabell 25171 = IPV General per provins. Vi tar senaste årliga förändring.
    const url = `https://servicios.ine.es/wstempus/jsCache/EN/DATOS_TABLA/25171?nult=4&det=2`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    // Hitta serien för Málaga med "tasa anual"
    const series = (data as Array<Record<string, unknown>>).find((s) => {
      const name = (s.Nombre as string) ?? '';
      return name.includes('Málaga') && name.toLowerCase().includes('anual');
    });

    if (!series) return null;
    const values = series.Data as Array<{ Valor: number }>;
    const latest = values[values.length - 1];
    return latest?.Valor ?? null;
  } catch (err) {
    console.error('INE fetch failed:', err);
    return null;
  }
}

// ── 2. Inside Airbnb — ADR + occupancy från senaste listings-dump ──────────
// Data: http://insideairbnb.com/get-the-data — Málaga (manuellt nedladdat CSV
// kan också laddas upp till storage-bucket).
//
// För denna funktion antar vi en cached version finns i Supabase Storage
// bucket "market-data" som listings.csv. Kör en separat one-shot import varje
// kvartal för att uppdatera CSV-filen.
async function fetchAirbnbStatsFromStorage(
  supabase: ReturnType<typeof createClient>,
  neighbourhood: string,
): Promise<{ adr: number; occupancyPct: number } | null> {
  try {
    const { data, error } = await supabase.storage
      .from('market-data')
      .download('inside-airbnb-malaga-listings.csv');
    if (error || !data) return null;

    const csv = await data.text();
    const lines = csv.split('\n');
    const header = lines[0].split(',');

    const nbhCol   = header.indexOf('neighbourhood');
    const priceCol = header.indexOf('price');
    const availCol = header.indexOf('availability_365');
    const reviewsCol = header.indexOf('number_of_reviews_ltm');

    if (nbhCol < 0 || priceCol < 0 || availCol < 0) return null;

    const matching = lines.slice(1)
      .map(l => l.split(','))
      .filter(cols => cols[nbhCol]?.replace(/"/g, '') === neighbourhood)
      .filter(cols => parseInt(cols[reviewsCol] || '0') >= 3); // bara aktiva listings

    if (matching.length === 0) return null;

    const prices = matching
      .map(c => parseFloat(c[priceCol]?.replace(/["$,]/g, '') ?? '0'))
      .filter(p => p > 30 && p < 2000);
    const avails = matching
      .map(c => parseInt(c[availCol] ?? '0'))
      .filter(a => a > 0 && a < 366);

    const medianPrice = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
    const medianAvail = avails.sort((a, b) => a - b)[Math.floor(avails.length / 2)];

    // availability_365 är dagar TILLGÄNGLIGA — beläggning ≈ (365 - tillgängligt) / 365
    const occupancy = Math.max(0, Math.min(100, ((365 - medianAvail) / 365) * 100));

    return {
      adr: Math.round(medianPrice),
      occupancyPct: Math.round(occupancy),
    };
  } catch (err) {
    console.error('Airbnb fetch failed:', err);
    return null;
  }
}

// ── Main handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const today    = new Date().toISOString().split('T')[0];
  const results: Array<{ area: string; updated: boolean; error?: string }> = [];

  for (const cfg of AREA_MAP) {
    try {
      const growth     = await fetchIneGrowth(cfg.ineCode);
      const airbnbData = await fetchAirbnbStatsFromStorage(supabase, cfg.airbnbNeighbourhood);

      // Bygg ihop uppdatering — bara fält vi faktiskt fick data för
      const update: Record<string, unknown> = {
        updated_at: today,
        source:     'INE + Inside Airbnb (auto)',
      };
      if (growth !== null)     update.annual_growth_pct = growth;
      if (airbnbData) {
        update.avg_adr       = airbnbData.adr;
        update.occupancy_pct = airbnbData.occupancyPct;
      }

      // Upsert: uppdatera befintlig rad eller skapa ny
      const { data: existing } = await supabase
        .from('area_market_data')
        .select('id')
        .eq('area', cfg.area)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('area_market_data')
          .update(update)
          .eq('id', existing.id);
      } else {
        await supabase.from('area_market_data').insert({
          id:                `auto-${cfg.area.toLowerCase().replace(/\s+/g, '-')}`,
          area:              cfg.area,
          price_per_sqm:     0,  // INE ger inte absoluta priser gratis — fylls manuellt
          avg_adr:           update.avg_adr ?? 0,
          occupancy_pct:     update.occupancy_pct ?? 0,
          annual_growth_pct: update.annual_growth_pct ?? 0,
          source:            'INE + Inside Airbnb (auto)',
          updated_at:        today,
        });
      }

      results.push({ area: cfg.area, updated: true });
    } catch (err) {
      results.push({ area: cfg.area, updated: false, error: String(err) });
    }
  }

  // Logga körningen
  await supabase.from('market_data_sources').upsert([
    { id: 'ine-ipv',       source_name: 'INE Índice de Precios de Vivienda', last_fetched_at: new Date().toISOString(), fetch_status: 'success' },
    { id: 'inside-airbnb', source_name: 'Inside Airbnb (Málaga)',             last_fetched_at: new Date().toISOString(), fetch_status: 'success' },
  ]);

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
