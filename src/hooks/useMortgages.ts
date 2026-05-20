import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Mortgage, MortgageRatePeriod } from '../types';
import { fromDb, toDb } from '../lib/mappers';

const MORTGAGE_OPTIONAL: (keyof Mortgage)[]               = ['currentBalance', 'notes'];
const PERIOD_OPTIONAL:   (keyof MortgageRatePeriod)[]     = ['endDate', 'notes'];

export interface MortgageWithPeriods {
  mortgage: Mortgage;
  periods:  MortgageRatePeriod[];
}

export function useMortgages(propertyId?: string) {
  const [items,   setItems]   = useState<MortgageWithPeriods[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    let q = supabase.from('mortgages').select('*').order('start_date');
    if (propertyId) q = q.eq('property_id', propertyId);

    const { data: mortgages, error: e1 } = await q;
    if (e1) { setError(e1.message); setLoading(false); return; }

    const mortgageIds = (mortgages ?? []).map(m => m.id as string);
    let periods: Record<string, unknown>[] = [];
    if (mortgageIds.length > 0) {
      const { data: p, error: e2 } = await supabase
        .from('mortgage_rate_periods')
        .select('*')
        .in('mortgage_id', mortgageIds);
      if (e2) { setError(e2.message); setLoading(false); return; }
      periods = (p ?? []) as Record<string, unknown>[];
    }

    const result: MortgageWithPeriods[] = (mortgages ?? []).map(m => {
      const mortgage = fromDb<Mortgage>(m as Record<string, unknown>, MORTGAGE_OPTIONAL);
      const myPeriods = periods
        .filter(p => p.mortgage_id === m.id)
        .map(p => fromDb<MortgageRatePeriod>(p, PERIOD_OPTIONAL))
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
      return { mortgage, periods: myPeriods };
    });

    setItems(result);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  async function add(mortgage: Mortgage, initialRate: number) {
    const { error: e1 } = await supabase
      .from('mortgages')
      .insert(toDb(mortgage, MORTGAGE_OPTIONAL));
    if (e1) return { error: e1.message };

    // Lägg till en initial räntperiod
    const period: MortgageRatePeriod = {
      id:         `rp-${mortgage.id}-init`,
      mortgageId: mortgage.id,
      startDate:  mortgage.startDate,
      ratePct:    initialRate,
      rateType:   'fixed',
    };
    const { error: e2 } = await supabase
      .from('mortgage_rate_periods')
      .insert(toDb(period, PERIOD_OPTIONAL));
    if (e2) return { error: e2.message };

    await load();
    return { error: null };
  }

  async function update(mortgage: Mortgage) {
    const { error: err } = await supabase
      .from('mortgages')
      .update(toDb(mortgage, MORTGAGE_OPTIONAL))
      .eq('id', mortgage.id);
    if (!err) await load();
    return { error: err?.message ?? null };
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('mortgages').delete().eq('id', id);
    if (!err) setItems(prev => prev.filter(x => x.mortgage.id !== id));
    return { error: err?.message ?? null };
  }

  async function addRatePeriod(period: MortgageRatePeriod) {
    const { error: err } = await supabase
      .from('mortgage_rate_periods')
      .insert(toDb(period, PERIOD_OPTIONAL));
    if (!err) await load();
    return { error: err?.message ?? null };
  }

  async function removeRatePeriod(id: string) {
    const { error: err } = await supabase
      .from('mortgage_rate_periods')
      .delete()
      .eq('id', id);
    if (!err) await load();
    return { error: err?.message ?? null };
  }

  return { items, loading, error, add, update, remove, addRatePeriod, removeRatePeriod, reload: load };
}
