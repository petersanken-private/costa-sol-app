import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AreaMarketData } from '../types';
import { marketFromDb, marketToDb } from '../lib/mappers';

/**
 * Hook för områdesmarknadsdata (€/kvm, ADR, beläggning, tillväxt per stadsdel).
 *
 * Compare.tsx och Market.tsx delar denna istället av att läsa Supabase direkt.
 */
export function useMarketData() {
  const [items,   setItems]   = useState<AreaMarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('area_market_data')
      .select('*')
      .order('area');

    if (err) setError(err.message);
    else     setItems((data ?? []).map(r => marketFromDb(r as Record<string, unknown>)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function upsert(m: AreaMarketData) {
    const { error: err } = await supabase.from('area_market_data').upsert(marketToDb(m));
    if (!err) {
      setItems(prev => {
        const exists = prev.find(x => x.id === m.id);
        return exists ? prev.map(x => x.id === m.id ? m : x) : [...prev, m];
      });
    }
    return { error: err?.message ?? null };
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('area_market_data').delete().eq('id', id);
    if (!err) setItems(prev => prev.filter(m => m.id !== id));
    return { error: err?.message ?? null };
  }

  return { markets: items, loading, error, upsert, remove, reload: load };
}
