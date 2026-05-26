import { supabase } from '../../lib/supabase';
import { Property, RentalEntry, Expense } from '../../types';
import { SEED_PROPERTIES, SEED_RENTALS, SEED_EXPENSES } from '../../data';
import {
  propertyFromDb, propertyToDb,
  rentalFromDb,   rentalToDb,
  expenseFromDb,  expenseToDb,
} from '../../lib/mappers';

export const SEED_FLAG_KEY = 'costa-sol:seeded-v1';

export interface LoadedData {
  properties: Property[];
  rentals:    RentalEntry[];
  expenses:   Expense[];
}

/**
 * Hämta all data parallellt från Supabase. Kastar vid första felet.
 */
export async function fetchAllFromDb(): Promise<LoadedData> {
  const [{ data: props, error: e1 }, { data: rents, error: e2 }, { data: exps, error: e3 }] =
    await Promise.all([
      supabase.from('properties').select('*').order('created_at'),
      supabase.from('rentals').select('*').order('year').order('month'),
      supabase.from('expenses').select('*').order('date'),
    ]);

  const err = e1 ?? e2 ?? e3;
  if (err) throw new Error(err.message);

  return {
    properties: (props ?? []).map(r => propertyFromDb(r as Record<string, unknown>)),
    rentals:    (rents ?? []).map(r => rentalFromDb(r as Record<string, unknown>)),
    expenses:   (exps  ?? []).map(e => expenseFromDb(e as Record<string, unknown>)),
  };
}

/**
 * Returnerar fallback-data baserad på SEED-konstanter.
 * Används både vid nätverksfel och vid första seed.
 */
export function seedData(): LoadedData {
  return {
    properties: SEED_PROPERTIES,
    rentals:    SEED_RENTALS,
    expenses:   SEED_EXPENSES,
  };
}

/**
 * Skriv SEED-data till Supabase i rätt ordning (FK-beroenden).
 * Properties först — om något fastighet-insert misslyckas, abortar vi
 * innan rentals/expenses försöks (annars FK-fel).
 */
export async function seedDatabase(): Promise<void> {
  for (const p of SEED_PROPERTIES) {
    const { error } = await supabase.from('properties').upsert(propertyToDb(p));
    if (error) throw new Error(`Property ${p.id}: ${error.message}`);
  }
  for (const r of SEED_RENTALS) {
    const { error } = await supabase.from('rentals').upsert(rentalToDb(r));
    if (error) throw new Error(`Rental ${r.id}: ${error.message}`);
  }
  for (const e of SEED_EXPENSES) {
    const { error } = await supabase.from('expenses').upsert(expenseToDb(e));
    if (error) throw new Error(`Expense ${e.id}: ${error.message}`);
  }
}

/** Har vi seedat tidigare i denna browser? Markeras i localStorage. */
export function hasSeededBefore(): boolean {
  return localStorage.getItem(SEED_FLAG_KEY) === 'true';
}

export function markSeeded(): void {
  localStorage.setItem(SEED_FLAG_KEY, 'true');
}

export function clearSeededFlag(): void {
  localStorage.removeItem(SEED_FLAG_KEY);
}
