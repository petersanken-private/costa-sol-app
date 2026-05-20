// ═══════════════════════════════════════════════════════════════════════════════
// Supabase Edge Function · import-ical
// ═══════════════════════════════════════════════════════════════════════════════
//
// Hämtar iCal-feed (.ics) från Airbnb/Booking/Vrbo, parsar VEVENT-blocken,
// och skapar rentals-poster för varje bokning. Deduplicerar via (source_id, ical_uid).
//
// Body: { sourceId: string } — importerar för en specifik källa
//   ELLER: { sourceIds: string[] } — batchimport
//
// Deploy:
//   npx supabase functions deploy import-ical --use-api
// ═══════════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── iCal-parser ─────────────────────────────────────────────────────────────
interface VEvent {
  uid:         string;
  summary:     string;
  dtstart:     string;   // YYYYMMDD eller YYYYMMDDTHHmmssZ
  dtend:       string;
  description: string;
}

/**
 * Parsar en .ics-fil till en array av VEVENT.
 * iCal-format: line-folding hanteras (rader som börjar med mellanslag är fortsättning).
 */
function parseICal(ics: string): VEvent[] {
  // Hantera line-folding (RFC 5545): rad som börjar med space/tab är fortsättning av föregående
  const unfolded = ics.replace(/\r?\n[ \t]/g, '');
  const lines    = unfolded.split(/\r?\n/);

  const events: VEvent[] = [];
  let current: Partial<VEvent> | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
    } else if (line === 'END:VEVENT') {
      if (current?.uid && current.dtstart && current.dtend) {
        events.push({
          uid:         current.uid,
          summary:     current.summary     ?? '',
          dtstart:     current.dtstart,
          dtend:       current.dtend,
          description: current.description ?? '',
        });
      }
      current = null;
    } else if (current) {
      // Property:value (med ev. parametrar efter ;)
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const propPart = line.substring(0, colonIdx);
      const value    = line.substring(colonIdx + 1);
      const propName = propPart.split(';')[0];

      switch (propName) {
        case 'UID':         current.uid = value; break;
        case 'SUMMARY':     current.summary = unescape(value); break;
        case 'DTSTART':     current.dtstart = value; break;
        case 'DTEND':       current.dtend = value; break;
        case 'DESCRIPTION': current.description = unescape(value); break;
      }
    }
  }

  return events;
}

function unescape(s: string): string {
  return s.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

/**
 * Konvertera iCal-datum (YYYYMMDD eller YYYYMMDDTHHmmssZ) till ISO YYYY-MM-DD.
 */
function icalDateToIso(d: string): string {
  const base = d.substring(0, 8);
  return `${base.substring(0, 4)}-${base.substring(4, 6)}-${base.substring(6, 8)}`;
}

/**
 * Antal nätter mellan två ISO-datum (checkout är dagen efter sista natten).
 */
function nightsBetween(checkin: string, checkout: string): number {
  const a = new Date(checkin);
  const b = new Date(checkout);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

/**
 * Tilldela en bokning till år+månad baserat på checkin (för rentals-tabellens struktur).
 */
function bookingYearMonth(checkin: string): { year: number; month: number } {
  const d = new Date(checkin);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/**
 * Avgör om en VEVENT är en verklig bokning eller bara en blockering (Airbnb gör båda).
 * Airbnb använder SUMMARY "Reserved" för bokningar och "Not available" / "Blocked" för spärrar.
 * Booking.com använder oftast "CLOSED - Not available".
 */
function isRealBooking(summary: string): boolean {
  const s = summary.toLowerCase();
  if (s.includes('not available')) return false;
  if (s.includes('blocked'))       return false;
  if (s.includes('closed'))        return false;
  if (s.includes('unavailable'))   return false;
  return true;
}

// ── Main handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const sourceIds: string[] = body.sourceIds ?? (body.sourceId ? [body.sourceId] : []);
    if (sourceIds.length === 0) {
      return json({ error: 'sourceId eller sourceIds krävs' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const results: Array<{ sourceId: string; imported: number; skipped: number; error?: string }> = [];

    for (const sourceId of sourceIds) {
      const { data: source, error: srcErr } = await supabase
        .from('rental_sources')
        .select('*')
        .eq('id', sourceId)
        .single();

      if (srcErr || !source) {
        results.push({ sourceId, imported: 0, skipped: 0, error: srcErr?.message ?? 'Källa hittades inte' });
        continue;
      }

      try {
        // Hämta .ics-feed
        const res = await fetch(source.feed_url, { headers: { 'User-Agent': 'CostaSolApp/1.0' } });
        if (!res.ok) throw new Error(`Feed svarade ${res.status}`);
        const ics = await res.text();

        const events = parseICal(ics).filter(e => isRealBooking(e.summary));

        let imported = 0;
        let skipped  = 0;

        for (const ev of events) {
          const checkin  = icalDateToIso(ev.dtstart);
          const checkout = icalDateToIso(ev.dtend);
          const nights   = nightsBetween(checkin, checkout);
          if (nights <= 0) { skipped++; continue; }

          const { year, month } = bookingYearMonth(checkin);
          const revenue = nights * (source.default_rate as number);

          // Generera deterministiskt rental-id baserat på källa + uid
          const rentalId = `ic-${sourceId}-${ev.uid.substring(0, 24).replace(/[^a-zA-Z0-9]/g, '')}`;

          const { error: insErr } = await supabase
            .from('rentals')
            .upsert({
              id:            rentalId,
              property_id:   source.property_id,
              year,
              month,
              nights,
              revenue,
              platform:      source.platform,
              notes:         ev.summary || null,
              source_id:     sourceId,
              ical_uid:      ev.uid,
              checkin_date:  checkin,
              checkout_date: checkout,
            }, { onConflict: 'id' });

          if (insErr) { skipped++; continue; }
          imported++;
        }

        // Uppdatera källans status
        await supabase
          .from('rental_sources')
          .update({
            last_imported_at:  new Date().toISOString(),
            last_status:       'success',
            last_error:        null,
            bookings_imported: (source.bookings_imported as number) + imported,
          })
          .eq('id', sourceId);

        results.push({ sourceId, imported, skipped });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await supabase
          .from('rental_sources')
          .update({
            last_imported_at: new Date().toISOString(),
            last_status:      'error',
            last_error:       msg,
          })
          .eq('id', sourceId);
        results.push({ sourceId, imported: 0, skipped: 0, error: msg });
      }
    }

    return json({ ok: true, results });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
