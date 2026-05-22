import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ProspectProperty } from '../types';
import { prospectFromDb, prospectToDb } from '../lib/mappers';

/**
 * Hook för att hantera prospekt (objekt som övervägs att köpa).
 *
 * Följer feature-hook-mönstret: { items, loading, error, ...actions, reload }.
 * Compare-sidan använder denna istället av att anropa Supabase direkt.
 */
export function useProspects() {
  const [items,   setItems]   = useState<ProspectProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('prospects')
      .select('*')
      .order('created_at');

    if (err) setError(err.message);
    else     setItems((data ?? []).map(r => prospectFromDb(r as Record<string, unknown>)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function upsert(p: ProspectProperty) {
    const { error: err } = await supabase.from('prospects').upsert(prospectToDb(p));
    if (!err) {
      setItems(prev => {
        const exists = prev.find(x => x.id === p.id);
        return exists ? prev.map(x => x.id === p.id ? p : x) : [...prev, p];
      });
    }
    return { error: err?.message ?? null };
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('prospects').delete().eq('id', id);
    if (!err) setItems(prev => prev.filter(p => p.id !== id));
    return { error: err?.message ?? null };
  }

  return { prospects: items, loading, error, upsert, remove, reload: load };
}
