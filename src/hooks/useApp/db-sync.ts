import { supabase } from '../../lib/supabase';
import { propertyToDb, rentalToDb, expenseToDb } from '../../lib/mappers';
import { Action } from './reducer';

/**
 * Kör en Supabase-operation och kasta tydligt fel om Supabase rapporterar error.
 *
 * VIKTIGT: Detta är en fix för en historisk bugg där supabase-js:s
 * `{ data, error }`-returvärde ignorerades — RLS-fel och nätverksfel
 * passerade tyst och UI:t visade objekt som aldrig sparades.
 */
async function runSupabase(
  label: string,
  op:    () => PromiseLike<{ error: { message: string } | null }>,
): Promise<void> {
  const { error } = await op();
  if (error) {
    console.error(`Supabase ${label} failed:`, error);
    throw new Error(`${label}: ${error.message}`);
  }
}

/**
 * Mappa en Action till motsvarande Supabase-skrivning.
 * Returnerar `'skip'` för rena klient-actions (NAVIGATE, SET_DATA) och
 * `'special'` för RESET_ALL (måste kombineras med seed:ning av provider).
 *
 * DB FÖRST, state EFTER — providern dispatch:ar bara när detta resolves.
 */
export async function writeAction(action: Action): Promise<'ok' | 'skip' | 'special'> {
  switch (action.type) {
    case 'ADD_PROPERTY':
      await runSupabase('ADD_PROPERTY',
        () => supabase.from('properties').insert(propertyToDb(action.property)));
      return 'ok';
    case 'UPDATE_PROPERTY':
      await runSupabase('UPDATE_PROPERTY',
        () => supabase.from('properties').update(propertyToDb(action.property)).eq('id', action.property.id));
      return 'ok';
    case 'DELETE_PROPERTY':
      await runSupabase('DELETE_PROPERTY',
        () => supabase.from('properties').delete().eq('id', action.id));
      return 'ok';
    case 'ADD_RENTAL':
      await runSupabase('ADD_RENTAL',
        () => supabase.from('rentals').insert(rentalToDb(action.rental)));
      return 'ok';
    case 'DELETE_RENTAL':
      await runSupabase('DELETE_RENTAL',
        () => supabase.from('rentals').delete().eq('id', action.id));
      return 'ok';
    case 'ADD_EXPENSE':
      await runSupabase('ADD_EXPENSE',
        () => supabase.from('expenses').insert(expenseToDb(action.expense)));
      return 'ok';
    case 'DELETE_EXPENSE':
      await runSupabase('DELETE_EXPENSE',
        () => supabase.from('expenses').delete().eq('id', action.id));
      return 'ok';
    case 'RESET_ALL':
      await runSupabase('RESET_ALL',
        () => supabase.from('properties').delete().neq('id', ''));
      return 'special';
    case 'SET_DATA':
    case 'NAVIGATE':
      return 'skip';
  }
}
