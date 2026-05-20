import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { RentalSource } from '../types';
import { fromDb, toDb } from '../lib/mappers';

const SOURCE_OPTIONAL: (keyof RentalSource)[] = ['lastImportedAt', 'lastStatus', 'lastError'];

export interface ImportResult {
  ok:       boolean;
  results?: Array<{ sourceId: string; imported: number; skipped: number; error?: string }>;
  error?:   string;
}

export function useRentalSources(propertyId?: string) {
  const [items,     setItems]     = useState<RentalSource[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('rental_sources').select('*').order('created_at');
    if (propertyId) q = q.eq('property_id', propertyId);

    const { data } = await q;
    setItems((data ?? []).map(r => fromDb<RentalSource>(r as Record<string, unknown>, SOURCE_OPTIONAL)));
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  async function add(src: RentalSource) {
    const { error } = await supabase.from('rental_sources').insert(toDb(src, SOURCE_OPTIONAL));
    if (!error) await load();
    return { error: error?.message ?? null };
  }

  async function update(src: RentalSource) {
    const { error } = await supabase
      .from('rental_sources')
      .update(toDb(src, SOURCE_OPTIONAL))
      .eq('id', src.id);
    if (!error) await load();
    return { error: error?.message ?? null };
  }

  async function remove(id: string) {
    const { error } = await supabase.from('rental_sources').delete().eq('id', id);
    if (!error) await load();
    return { error: error?.message ?? null };
  }

  async function importSource(sourceId: string): Promise<ImportResult> {
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-ical', {
        body: { sourceId },
      });
      if (error) return { ok: false, error: error.message };
      await load();
      return data as ImportResult;
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    } finally {
      setImporting(false);
    }
  }

  async function importAll(): Promise<ImportResult> {
    setImporting(true);
    try {
      const sourceIds = items.filter(s => s.active).map(s => s.id);
      if (sourceIds.length === 0) return { ok: true, results: [] };

      const { data, error } = await supabase.functions.invoke('import-ical', {
        body: { sourceIds },
      });
      if (error) return { ok: false, error: error.message };
      await load();
      return data as ImportResult;
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    } finally {
      setImporting(false);
    }
  }

  return { sources: items, loading, importing, add, update, remove, importSource, importAll, reload: load };
}
