import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { RecurringExpense, Expense } from '../types';
import { fromDb, toDb } from '../lib/mappers';
import { generateMissingExpenses } from '../utils/recurringGenerator';

const RECURRING_OPTIONAL: (keyof RecurringExpense)[] = ['endDate', 'monthOfYear', 'lastGeneratedDate', 'notes'];

export function useRecurringExpenses(propertyId?: string) {
  const [items,    setItems]    = useState<RecurringExpense[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase.from('recurring_expenses').select('*').order('start_date');
    if (propertyId) q = q.eq('property_id', propertyId);

    const { data, error: err } = await q;
    if (err) setError(err.message);
    else     setItems((data ?? []).map(r => fromDb<RecurringExpense>(r as Record<string, unknown>, RECURRING_OPTIONAL)));
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  async function add(rec: RecurringExpense) {
    const { error: err } = await supabase
      .from('recurring_expenses')
      .insert(toDb(rec, RECURRING_OPTIONAL));
    if (!err) setItems(prev => [...prev, rec]);
    return { error: err?.message ?? null };
  }

  async function update(rec: RecurringExpense) {
    const { error: err } = await supabase
      .from('recurring_expenses')
      .update(toDb(rec, RECURRING_OPTIONAL))
      .eq('id', rec.id);
    if (!err) setItems(prev => prev.map(r => r.id === rec.id ? rec : r));
    return { error: err?.message ?? null };
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('recurring_expenses').delete().eq('id', id);
    if (!err) setItems(prev => prev.filter(r => r.id !== id));
    return { error: err?.message ?? null };
  }

  /**
   * Kör generatorn över alla aktiva mallar — skapar saknade Expense-poster i DB
   * och uppdaterar lastGeneratedDate på mallarna.
   */
  async function generateAll(): Promise<{ created: number; error: string | null }> {
    const today = new Date().toISOString().split('T')[0];
    let created = 0;

    for (const rec of items.filter(r => r.active)) {
      const { expenses, nextLastGenerated } = generateMissingExpenses(rec, today);
      if (expenses.length === 0) continue;

      // Skapa Expense-rader med deterministiska IDs (recurring-id + datum)
      const expensesWithIds: Expense[] = expenses.map(e => ({
        ...e,
        id: `rec-${rec.id}-${e.date}`,
      }));

      const { error: insErr } = await supabase
        .from('expenses')
        .upsert(expensesWithIds.map(e => ({
          id:          e.id,
          property_id: e.propertyId,
          date:        e.date,
          category:    e.category,
          amount:      e.amount,
          description: e.description,
          deductible:  e.deductible,
        })));

      if (insErr) return { created, error: insErr.message };

      created += expensesWithIds.length;

      // Uppdatera lastGeneratedDate på mallen
      if (nextLastGenerated) {
        await supabase
          .from('recurring_expenses')
          .update({ last_generated_date: nextLastGenerated })
          .eq('id', rec.id);
      }
    }

    await load();
    return { created, error: null };
  }

  return { items, loading, error, add, update, remove, generateAll, reload: load };
}
