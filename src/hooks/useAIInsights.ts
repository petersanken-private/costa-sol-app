import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from './useApp';
import { AIInsight, AIPreset } from '../types';
import { fromDb } from '../lib/mappers';

const INSIGHT_OPTIONAL: (keyof AIInsight)[] = ['propertyId'];

export interface AnalyzeRequest {
  preset:        AIPreset;
  customPrompt?: string;
  propertyId?:   string;
}

export interface AnalyzeResult {
  ok:        boolean;
  id?:       string;
  response?: string;
  model?:    string;
  duration?: number;
  usage?: {
    input:      number;
    output:     number;
    cacheRead:  number;
    cacheWrite: number;
  };
  error?:    string;
}

export function useAIInsights(propertyId?: string) {
  const { state } = useApp();
  const [insights,  setInsights]  = useState<AIInsight[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('ai_insights').select('*').order('created_at', { ascending: false }).limit(50);
    if (propertyId) q = q.eq('property_id', propertyId);

    const { data } = await q;
    setInsights((data ?? []).map(r => fromDb<AIInsight>(r as Record<string, unknown>, INSIGHT_OPTIONAL)));
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  /**
   * Anropa Edge Function med portföljkontext + vald preset.
   * Hämtar all data från useApp + extra hämtning av prospects/markets för analys.
   */
  async function analyze(req: AnalyzeRequest): Promise<AnalyzeResult> {
    setAnalyzing(true);
    try {
      // Hämta extra data som useApp inte håller (prospects, markets, milestones, budgets, mortgages)
      const [prospectsRes, marketsRes, milestonesRes, budgetsRes, mortgagesRes, ratePeriodsRes, recurringRes] =
        await Promise.all([
          supabase.from('prospects').select('*'),
          supabase.from('area_market_data').select('*'),
          supabase.from('milestones').select('*'),
          supabase.from('budgets').select('*'),
          supabase.from('mortgages').select('*'),
          supabase.from('mortgage_rate_periods').select('*'),
          supabase.from('recurring_expenses').select('*'),
        ]);

      const context = {
        properties:        state.properties,
        rentals:           state.rentals,
        expenses:          state.expenses,
        prospects:         prospectsRes.data ?? [],
        areaMarketData:    marketsRes.data ?? [],
        milestones:        milestonesRes.data ?? [],
        budgets:           budgetsRes.data ?? [],
        mortgages:         mortgagesRes.data ?? [],
        mortgageRatePeriods: ratePeriodsRes.data ?? [],
        recurringExpenses: recurringRes.data ?? [],
        meta: {
          generatedAt:     new Date().toISOString(),
          totalProperties: state.properties.length,
        },
      };

      const { data, error } = await supabase.functions.invoke('analyze-portfolio', {
        body: { ...req, context },
      });

      if (error) {
        return { ok: false, error: error.message };
      }

      // Ladda om listan så ny insight syns
      await load();
      return data as AnalyzeResult;
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    } finally {
      setAnalyzing(false);
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from('ai_insights').delete().eq('id', id);
    if (!error) setInsights(prev => prev.filter(i => i.id !== id));
    return { error: error?.message ?? null };
  }

  return { insights, loading, analyzing, analyze, remove, reload: load };
}
