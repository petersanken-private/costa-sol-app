// ═══════════════════════════════════════════════════════════════════════════════
// Supabase Edge Function · analyze-portfolio
// ═══════════════════════════════════════════════════════════════════════════════
//
// Anropar Anthropic Claude API med portföljkontext och returnerar AI-analys.
// Använder prompt caching för att minska kostnaden för upprepade frågor.
//
// Secrets som måste sättas i Supabase:
//   npx supabase secrets set ANTHROPIC_API_KEY="sk-ant-..."
//
// Deploy:
//   npx supabase functions deploy analyze-portfolio --use-api
// ═══════════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY       = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY  = Deno.env.get('ANTHROPIC_API_KEY')!;
const MODEL              = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS         = 2048;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Preset-frågor ───────────────────────────────────────────────────────────
type Preset =
  | 'rank-prospects'
  | 'portfolio-summary'
  | 'cost-anomalies'
  | 'next-quarter'
  | 'property-deepdive'
  | 'custom';

const PRESET_PROMPTS: Record<Exclude<Preset, 'custom' | 'property-deepdive'>, string> = {
  'rank-prospects':
    'Rangordna mina prospekt (objekt jag överväger att köpa) baserat på riskjusterad avkastning över 10 år. ' +
    'Ta hänsyn till områdets marknadsdata, prisnivå per kvm, förväntad ADR/beläggning, och köpkostnader. ' +
    'Ge varje prospekt en kort motivering. Använd markdown med en numrerad lista och en tabell över nyckeltal. ' +
    'Lyft också fram eventuella röda flaggor.',

  'portfolio-summary':
    'Ge en kort lägesrapport över min portfölj: ' +
    '1) Total exponering (köpeskilling, nuv. värde, orealiserad vinst). ' +
    '2) Geografisk koncentration. ' +
    '3) Status-fördelning (off-plan vs ägs vs bevakar). ' +
    '4) Hyresavkastning för objekt som genererar intäkter. ' +
    '5) Tre konkreta nästa steg jag bör fokusera på. ' +
    'Skriv på svenska i markdown. Var konkret och undvik generiska råd.',

  'cost-anomalies':
    'Analysera mina kostnader (expenses) per objekt och hitta avvikelser eller besparingsmöjligheter. ' +
    'Jämför mot rimliga benchmarks för Costa del Sol-fastigheter (förvaltning ~18%, städning ~€55/natt, fasta ~€5600/år för en mindre lägenhet). ' +
    'Identifiera 3-5 konkreta observationer med rekommenderade åtgärder. Använd markdown.',

  'next-quarter':
    'Med utgångspunkt från mina aktiva milstolpar, budgetar och innevarande månad, ' +
    'ge mig en actionable plan för nästa kvartal. ' +
    'Vad bör jag fokusera på? Vilka deadlines närmar sig? Finns det ekonomiska beslut jag måste fatta? ' +
    'Skriv som en prioriterad to-do-lista i markdown.',
};

const PROPERTY_DEEPDIVE_PROMPT =
  'Analysera detta enskilda objekt grundligt: ' +
  '1) Investeringscaset (köpeskilling vs marknadsdata för området, förväntad yield). ' +
  '2) Operationell hälsa (faktiska hyror & kostnader vs budget). ' +
  '3) Risker (off-plan-betalningar, VFT, områdeskoncentration). ' +
  '4) Konkreta nästa steg för att maximera värdet. ' +
  'Skriv på svenska i markdown.';

const SYSTEM_PROMPT =
  'Du är en erfaren fastighetsrådgivare som har djup kunskap om Costa del Sol-marknaden ' +
  '(Marbella, Estepona, Cancelada, Golden Mile, Puerto Banús m.fl.) och spansk skattelagstiftning för utländska investerare ' +
  '(IRNR 19% för EU-bosatta, ITP 7% i Andalusien, Modelo 210). ' +
  'Du svarar på svenska, är direkt och praktisk, och undviker generiska floskler. ' +
  'När du citerar siffror använder du svensk formatering med mellanslag som tusentalsavgränsare och kommatecken för decimaler. ' +
  'Belopp anges i EUR med €-tecken. ' +
  'Du skriver i markdown och använder tabeller där det är lämpligt.';

// ── Main handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { preset, context, customPrompt, propertyId } = body as {
      preset:        Preset;
      context:       Record<string, unknown>;  // properties, rentals, expenses, prospects, markets, milestones, budgets, mortgages
      customPrompt?: string;
      propertyId?:   string;
    };

    if (!preset) {
      return jsonResponse({ error: 'preset krävs' }, 400);
    }

    // Bygg user-message baserat på preset
    let userPrompt: string;
    if (preset === 'custom') {
      if (!customPrompt?.trim()) {
        return jsonResponse({ error: 'customPrompt krävs för custom preset' }, 400);
      }
      userPrompt = customPrompt;
    } else if (preset === 'property-deepdive') {
      if (!propertyId) {
        return jsonResponse({ error: 'propertyId krävs för property-deepdive' }, 400);
      }
      userPrompt = PROPERTY_DEEPDIVE_PROMPT + `\n\nFokusera analysen på objekt med id "${propertyId}".`;
    } else {
      userPrompt = PRESET_PROMPTS[preset];
    }

    // Bygg portföljkontext som JSON-block (cachas av Claude)
    const contextBlock = `Här är användarens kompletta portföljdata i JSON-format:\n\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\``;

    // Anropa Anthropic API med prompt caching
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: MAX_TOKENS,
        system: [
          {
            type:          'text',
            text:          SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },   // cacha system-prompten
          },
        ],
        messages: [
          {
            role: 'user',
            content: [
              {
                type:          'text',
                text:          contextBlock,
                cache_control: { type: 'ephemeral' }, // cacha portföljdatan
              },
              {
                type: 'text',
                text: userPrompt,
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API error:', anthropicRes.status, errText);
      return jsonResponse({
        error: `Anthropic API svarade ${anthropicRes.status}: ${errText.substring(0, 500)}`,
      }, 500);
    }

    const result = await anthropicRes.json();
    const duration = Date.now() - startTime;

    // Extrahera svar
    const responseText = (result.content as Array<{ type: string; text: string }>)
      ?.filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n\n') ?? '';

    const usage = (result.usage as Record<string, number>) ?? {};

    // Spara till databasen
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const insightId = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await supabase.from('ai_insights').insert({
      id:                  insightId,
      preset,
      property_id:         propertyId ?? null,
      prompt:              userPrompt,
      response:            responseText,
      model:               MODEL,
      tokens_input:        usage.input_tokens               ?? 0,
      tokens_output:       usage.output_tokens              ?? 0,
      tokens_cache_read:   usage.cache_read_input_tokens    ?? 0,
      tokens_cache_write:  usage.cache_creation_input_tokens ?? 0,
      duration_ms:         duration,
    });

    return jsonResponse({
      ok: true,
      id:         insightId,
      response:   responseText,
      model:      MODEL,
      duration,
      usage: {
        input:      usage.input_tokens               ?? 0,
        output:     usage.output_tokens              ?? 0,
        cacheRead:  usage.cache_read_input_tokens    ?? 0,
        cacheWrite: usage.cache_creation_input_tokens ?? 0,
      },
    });
  } catch (err) {
    console.error('Edge Function error:', err);
    return jsonResponse({
      error: err instanceof Error ? err.message : String(err),
    }, 500);
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
