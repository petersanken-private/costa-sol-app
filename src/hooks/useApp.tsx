import React, {
  createContext, useContext, useReducer, useEffect, useCallback, useState, ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { Property, RentalEntry, Expense, PageKey } from '../types';
import { SEED_PROPERTIES, SEED_RENTALS, SEED_EXPENSES } from '../data';
import {
  propertyFromDb, propertyToDb,
  rentalFromDb,   rentalToDb,
  expenseFromDb,  expenseToDb,
} from '../lib/mappers';

// ── State ─────────────────────────────────────────────────────────────────────

interface AppState {
  properties:         Property[];
  rentals:            RentalEntry[];
  expenses:           Expense[];
  activePage:         PageKey;
  selectedPropertyId: string | null;
}

const UI_DEFAULTS = {
  activePage:         'dashboard' as PageKey,
  selectedPropertyId: null,
};

// ── Actions ───────────────────────────────────────────────────────────────────

export type Action =
  | { type: 'SET_DATA';        properties: Property[]; rentals: RentalEntry[]; expenses: Expense[] }
  | { type: 'NAVIGATE';        page: PageKey; propertyId?: string }
  | { type: 'ADD_PROPERTY';    property: Property }
  | { type: 'UPDATE_PROPERTY'; property: Property }
  | { type: 'DELETE_PROPERTY'; id: string }
  | { type: 'ADD_RENTAL';      rental: RentalEntry }
  | { type: 'DELETE_RENTAL';   id: string }
  | { type: 'ADD_EXPENSE';     expense: Expense }
  | { type: 'DELETE_EXPENSE';  id: string }
  | { type: 'RESET_ALL' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, properties: action.properties, rentals: action.rentals, expenses: action.expenses };
    case 'NAVIGATE':
      return { ...state, activePage: action.page, selectedPropertyId: action.propertyId ?? null };
    case 'ADD_PROPERTY':
      return { ...state, properties: [...state.properties, action.property] };
    case 'UPDATE_PROPERTY':
      return { ...state, properties: state.properties.map(p => p.id === action.property.id ? action.property : p) };
    case 'DELETE_PROPERTY':
      return {
        ...state,
        properties: state.properties.filter(p => p.id !== action.id),
        rentals:    state.rentals.filter(r => r.propertyId !== action.id),
        expenses:   state.expenses.filter(e => e.propertyId !== action.id),
      };
    case 'ADD_RENTAL':
      return { ...state, rentals: [...state.rentals, action.rental] };
    case 'DELETE_RENTAL':
      return { ...state, rentals: state.rentals.filter(r => r.id !== action.id) };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.expense] };
    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter(e => e.id !== action.id) };
    case 'RESET_ALL':
      return { ...UI_DEFAULTS, properties: SEED_PROPERTIES, rentals: SEED_RENTALS, expenses: SEED_EXPENSES };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface AppContextValue {
  state:                  AppState;
  dispatch:               React.Dispatch<Action>;
  navigate:               (page: PageKey, propertyId?: string) => void;
  getProperty:            (id: string) => Property | undefined;
  getRentalsForProperty:  (id: string) => RentalEntry[];
  getExpensesForProperty: (id: string) => Expense[];
  resetAllData:           () => void;
  loading:                boolean;
  dbError:                string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    ...UI_DEFAULTS,
    properties: [],
    rentals:    [],
    expenses:   [],
  });
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const SEED_FLAG_KEY = 'costa-sol:seeded-v1';

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [{ data: props, error: e1 }, { data: rents, error: e2 }, { data: exps, error: e3 }] =
        await Promise.all([
          supabase.from('properties').select('*').order('created_at'),
          supabase.from('rentals').select('*').order('year').order('month'),
          supabase.from('expenses').select('*').order('date'),
        ]);

      if (e1 || e2 || e3) throw new Error((e1 ?? e2 ?? e3)?.message);

      const properties = (props ?? []).map(r => propertyFromDb(r as Record<string, unknown>));
      const rentals    = (rents ?? []).map(r => rentalFromDb(r as Record<string, unknown>));
      const expenses   = (exps  ?? []).map(e => expenseFromDb(e as Record<string, unknown>));

      // Seed bara EN gång per browser — markeras i localStorage.
      // Annars återskapas seed-data så fort användaren tömt sin databas.
      const hasSeeded = localStorage.getItem(SEED_FLAG_KEY) === 'true';
      if (properties.length === 0 && !hasSeeded) {
        localStorage.setItem(SEED_FLAG_KEY, 'true');
        await seedDatabase();
        return;
      }

      dispatch({ type: 'SET_DATA', properties, rentals, expenses });
      setDbError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Okänt fel';
      setDbError(`Kunde inte ansluta: ${msg}`);
      dispatch({ type: 'SET_DATA', properties: SEED_PROPERTIES, rentals: SEED_RENTALS, expenses: SEED_EXPENSES });
    } finally {
      setLoading(false);
    }
  }

  async function seedDatabase() {
    try {
      // Insert properties FÖRST och stoppa om något fail:ar — annars FK-fel på rentals/expenses
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
      await loadAll();
    } catch (err) {
      console.error('Seed failed:', err);
      setDbError(`Seed-data kunde inte skapas: ${err instanceof Error ? err.message : 'Okänt fel'}`);
      // Fall tillbaka på empty state istället för oändlig laddning
      dispatch({ type: 'SET_DATA', properties: [], rentals: [], expenses: [] });
      setLoading(false);
    }
  }

  // ── DB först, state efter ─────────────────────────────────────────────────
  //
  // VIKTIGT: Tidigare gjorde vi optimistic UI-update FÖRST och DB-anrop sedan,
  // utan att fånga supabase-js:s `{ data, error }`-returvärde. Det betydde att
  // RLS-fel, auth-utgång och nätverksfel passerade tyst — UI:t visade objekt
  // som aldrig sparades. Vid refresh laddades data om från DB och allt försvann.
  //
  // Nu väntar vi på DB-bekräftelse FÖRE state-uppdatering. Vid fel kastar vi
  // ett tydligt error, behåller state oförändrad och visar en banner.
  // Trade-off: ~100-300ms extra latency vid varje skriv — värt det för
  // garanterad datapersistens.

  /** Kör en Supabase-operation och kasta tydligt fel om Supabase rapporterar error. */
  async function runSupabase(
    label: string,
    op: () => PromiseLike<{ error: { message: string } | null }>,
  ): Promise<void> {
    const { error } = await op();
    if (error) {
      console.error(`Supabase ${label} failed:`, error);
      throw new Error(`${label}: ${error.message}`);
    }
  }

  const syncDispatch = useCallback(async (action: Action) => {
    try {
      switch (action.type) {
        case 'ADD_PROPERTY':
          await runSupabase('ADD_PROPERTY',
            () => supabase.from('properties').insert(propertyToDb(action.property)));
          break;
        case 'UPDATE_PROPERTY':
          await runSupabase('UPDATE_PROPERTY',
            () => supabase.from('properties').update(propertyToDb(action.property)).eq('id', action.property.id));
          break;
        case 'DELETE_PROPERTY':
          await runSupabase('DELETE_PROPERTY',
            () => supabase.from('properties').delete().eq('id', action.id));
          break;
        case 'ADD_RENTAL':
          await runSupabase('ADD_RENTAL',
            () => supabase.from('rentals').insert(rentalToDb(action.rental)));
          break;
        case 'DELETE_RENTAL':
          await runSupabase('DELETE_RENTAL',
            () => supabase.from('rentals').delete().eq('id', action.id));
          break;
        case 'ADD_EXPENSE':
          await runSupabase('ADD_EXPENSE',
            () => supabase.from('expenses').insert(expenseToDb(action.expense)));
          break;
        case 'DELETE_EXPENSE':
          await runSupabase('DELETE_EXPENSE',
            () => supabase.from('expenses').delete().eq('id', action.id));
          break;
        case 'RESET_ALL':
          await runSupabase('RESET_ALL',
            () => supabase.from('properties').delete().neq('id', ''));
          localStorage.removeItem(SEED_FLAG_KEY);
          // Seed kör egen DB + state-uppdatering — vi returnerar tidigt.
          await seedDatabase();
          return;
        case 'SET_DATA':
        case 'NAVIGATE':
          // Klient-bara actions — ingen DB-skrivning behövs.
          dispatch(action);
          return;
        default:
          break;
      }

      // DB-anropet lyckades → uppdatera state nu.
      dispatch(action);
      setDbError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Okänt fel';
      setDbError(`Ändringen kunde INTE sparas: ${msg}. Försök igen — om det fortsätter, ladda om sidan.`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate               = useCallback((page: PageKey, propertyId?: string) => dispatch({ type: 'NAVIGATE', page, propertyId }), []);
  const getProperty            = useCallback((id: string) => state.properties.find(p => p.id === id), [state.properties]);
  const getRentalsForProperty  = useCallback((id: string) => state.rentals.filter(r => r.propertyId === id), [state.rentals]);
  const getExpensesForProperty = useCallback((id: string) => state.expenses.filter(e => e.propertyId === id), [state.expenses]);
  const resetAllData           = useCallback(() => syncDispatch({ type: 'RESET_ALL' }), [syncDispatch]);

  return (
    <AppContext.Provider value={{
      state, dispatch: syncDispatch, navigate,
      getProperty, getRentalsForProperty, getExpensesForProperty,
      resetAllData, loading, dbError,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp måste användas inuti AppProvider');
  return ctx;
}
