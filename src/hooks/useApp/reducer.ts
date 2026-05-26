import { Property, RentalEntry, Expense, PageKey } from '../../types';
import { SEED_PROPERTIES, SEED_RENTALS, SEED_EXPENSES } from '../../data';

// ── State ─────────────────────────────────────────────────────────────────────

export interface AppState {
  properties:         Property[];
  rentals:            RentalEntry[];
  expenses:           Expense[];
  activePage:         PageKey;
  selectedPropertyId: string | null;
}

export const UI_DEFAULTS = {
  activePage:         'dashboard' as PageKey,
  selectedPropertyId: null,
};

export const INITIAL_STATE: AppState = {
  ...UI_DEFAULTS,
  properties: [],
  rentals:    [],
  expenses:   [],
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

export function reducer(state: AppState, action: Action): AppState {
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
