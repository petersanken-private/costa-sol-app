import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Budget, RentalEntry, Expense, ExpenseCategory } from '../types';
import { fromDb, toDb } from '../lib/mappers';

const BUDGET_OPTIONAL: (keyof Budget)[] = ['notes'];

// Kategori-mappning: hur expenses grupperas mot budgetposter
const FIXED_CATEGORIES:       ExpenseCategory[] = ['ibi', 'insurance', 'community', 'gestor'];
const MAINTENANCE_CATEGORIES: ExpenseCategory[] = ['maintenance'];
const MANAGEMENT_CATEGORIES:  ExpenseCategory[] = ['management'];
const CLEANING_CATEGORIES:    ExpenseCategory[] = ['cleaning'];

export interface BudgetComparison {
  budget:      Budget;
  actual: {
    revenue:     number;
    nights:      number;
    management:  number;
    cleaning:    number;
    fixed:       number;
    maintenance: number;
    other:       number;
  };
  variance: {
    revenue:     number;  // actual - expected (positiv = bättre än budget)
    nights:      number;
    management:  number;  // för kostnader: actual - expected (negativ = under budget = bra)
    cleaning:    number;
    fixed:       number;
    maintenance: number;
    other:       number;
  };
}

export function useBudgets(propertyId?: string) {
  const [items,    setItems]    = useState<Budget[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase.from('budgets').select('*').order('year');
    if (propertyId) q = q.eq('property_id', propertyId);

    const { data, error: err } = await q;
    if (err) setError(err.message);
    else     setItems((data ?? []).map(r => fromDb<Budget>(r as Record<string, unknown>, BUDGET_OPTIONAL)));
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  async function upsert(budget: Budget) {
    const { error: err } = await supabase
      .from('budgets')
      .upsert(toDb(budget, BUDGET_OPTIONAL));
    if (!err) {
      setItems(prev => {
        const idx = prev.findIndex(b => b.id === budget.id);
        if (idx >= 0) return prev.map((b, i) => i === idx ? budget : b);
        return [...prev, budget];
      });
    }
    return { error: err?.message ?? null };
  }

  async function remove(id: string) {
    const { error: err } = await supabase.from('budgets').delete().eq('id', id);
    if (!err) setItems(prev => prev.filter(b => b.id !== id));
    return { error: err?.message ?? null };
  }

  return { budgets: items, loading, error, upsert, remove, reload: load };
}

/**
 * Bygg jämförelse mellan budget och faktiskt utfall för ett objekt + år.
 */
export function buildComparison(
  budget: Budget,
  rentals: RentalEntry[],
  expenses: Expense[],
): BudgetComparison {
  const yearRentals  = rentals.filter(r => r.year === budget.year);
  const yearExpenses = expenses.filter(e => parseInt(e.date.substring(0, 4), 10) === budget.year);

  const sumCategory = (cats: ExpenseCategory[]) =>
    yearExpenses.filter(e => cats.includes(e.category)).reduce((s, e) => s + e.amount, 0);

  const actualRevenue     = yearRentals.reduce((s, r) => s + r.revenue, 0);
  const actualNights      = yearRentals.reduce((s, r) => s + r.nights, 0);
  const actualManagement  = sumCategory(MANAGEMENT_CATEGORIES);
  const actualCleaning    = sumCategory(CLEANING_CATEGORIES);
  const actualFixed       = sumCategory(FIXED_CATEGORIES);
  const actualMaintenance = sumCategory(MAINTENANCE_CATEGORIES);
  const actualOther       = yearExpenses
    .filter(e => !MANAGEMENT_CATEGORIES.includes(e.category)
              && !CLEANING_CATEGORIES.includes(e.category)
              && !FIXED_CATEGORIES.includes(e.category)
              && !MAINTENANCE_CATEGORIES.includes(e.category))
    .reduce((s, e) => s + e.amount, 0);

  return {
    budget,
    actual: {
      revenue:     actualRevenue,
      nights:      actualNights,
      management:  actualManagement,
      cleaning:    actualCleaning,
      fixed:       actualFixed,
      maintenance: actualMaintenance,
      other:       actualOther,
    },
    variance: {
      revenue:     actualRevenue     - budget.expectedRevenue,
      nights:      actualNights      - budget.expectedNights,
      management:  actualManagement  - budget.expectedManagement,
      cleaning:    actualCleaning    - budget.expectedCleaning,
      fixed:       actualFixed       - budget.expectedFixed,
      maintenance: actualMaintenance - budget.expectedMaintenance,
      other:       actualOther       - budget.expectedOther,
    },
  };
}
