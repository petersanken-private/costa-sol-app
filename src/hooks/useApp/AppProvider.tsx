import {
  createContext, useContext, useReducer, useEffect, useCallback, useState, ReactNode,
} from 'react';
import { Property, RentalEntry, Expense, PageKey } from '../../types';
import { reducer, Action, AppState, INITIAL_STATE } from './reducer';
import {
  fetchAllFromDb, seedData, seedDatabase,
  hasSeededBefore, markSeeded, clearSeededFlag,
} from './data-loader';
import { writeAction } from './db-sync';

// ── Context ───────────────────────────────────────────────────────────────────

interface AppContextValue {
  state:                  AppState;
  dispatch:               (action: Action) => Promise<void>;
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
  const [state, rawDispatch] = useReducer(reducer, INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // ── Initial load + seed-hantering ─────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const data = await fetchAllFromDb();

      // Seed bara EN gång per browser — annars återskapas seed så fort
      // användaren tömt sin databas.
      if (data.properties.length === 0 && !hasSeededBefore()) {
        markSeeded();
        try {
          await seedDatabase();
          const fresh = await fetchAllFromDb();
          rawDispatch({ type: 'SET_DATA', ...fresh });
        } catch (seedErr) {
          console.error('Seed failed:', seedErr);
          setDbError(`Seed-data kunde inte skapas: ${seedErr instanceof Error ? seedErr.message : 'Okänt fel'}`);
          rawDispatch({ type: 'SET_DATA', properties: [], rentals: [], expenses: [] });
        }
      } else {
        rawDispatch({ type: 'SET_DATA', ...data });
        setDbError(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Okänt fel';
      setDbError(`Kunde inte ansluta: ${msg}`);
      rawDispatch({ type: 'SET_DATA', ...seedData() });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── DB-FÖRST, state-EFTER dispatch ────────────────────────────────────────
  //
  // Tidigare gjorde vi optimistic UI-update FÖRST och DB-anrop sedan,
  // utan att fånga supabase-js:s `{ data, error }`-returvärde. RLS-fel,
  // auth-utgång och nätverksfel passerade tyst — UI:t visade objekt som
  // aldrig sparades. Vid refresh laddades data om från DB och allt försvann.
  //
  // Nu väntar vi på DB-bekräftelse FÖRE state-uppdatering. ~100-300ms extra
  // latency per skriv — värt det för garanterad datapersistens.
  const dispatch = useCallback(async (action: Action) => {
    try {
      const result = await writeAction(action);

      if (result === 'special' && action.type === 'RESET_ALL') {
        // RESET_ALL har egen seed-flöde
        clearSeededFlag();
        await seedDatabase();
        await loadAll();
        return;
      }

      // 'ok' eller 'skip' — bara uppdatera state.
      rawDispatch(action);
      setDbError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Okänt fel';
      setDbError(`Ändringen kunde INTE sparas: ${msg}. Försök igen — om det fortsätter, ladda om sidan.`);
    }
  }, [loadAll]);

  // ── Selectors / convenience-helpers ───────────────────────────────────────
  const navigate               = useCallback((page: PageKey, propertyId?: string) => rawDispatch({ type: 'NAVIGATE', page, propertyId }), []);
  const getProperty            = useCallback((id: string) => state.properties.find(p => p.id === id), [state.properties]);
  const getRentalsForProperty  = useCallback((id: string) => state.rentals.filter(r => r.propertyId === id), [state.rentals]);
  const getExpensesForProperty = useCallback((id: string) => state.expenses.filter(e => e.propertyId === id), [state.expenses]);
  const resetAllData           = useCallback(() => dispatch({ type: 'RESET_ALL' }), [dispatch]);

  return (
    <AppContext.Provider value={{
      state, dispatch, navigate,
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
