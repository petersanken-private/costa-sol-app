// ── Generisk Supabase row ↔ app-typ-mapper ────────────────────────────────────
//
// Supabase använder snake_case i kolumnnamn (size_sqm), appen camelCase (sizeSqm).
// Denna fil tar bort behovet av handskrivna mappers per typ — du beskriver bara
// vilka fält som är optional och nullable, så sköts konverteringen åt båda hållen.

type DbRow = Record<string, unknown>;

/** snake_case → camelCase. `size_sqm` → `sizeSqm`. */
export function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** camelCase → snake_case. `sizeSqm` → `size_sqm`. */
export function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
}

/**
 * Konvertera en DB-rad till app-typ.
 *
 * @param row             Raden från Supabase
 * @param optionalFields  Fält som kan vara null/undefined i app-typen
 *                        (null konverteras till undefined för dem).
 */
export function fromDb<T>(row: DbRow, optionalFields: (keyof T)[] = []): T {
  const out: Record<string, unknown> = {};
  const optionalSet = new Set(optionalFields.map(String));

  for (const [k, v] of Object.entries(row)) {
    const camel = snakeToCamel(k);
    // Hoppa över interna kolumner som inte är del av app-typen
    if (camel === 'createdAt') continue;
    if (v === null && optionalSet.has(camel)) {
      out[camel] = undefined;
    } else {
      out[camel] = v;
    }
  }

  return out as T;
}

/**
 * Konvertera ett app-objekt till DB-rad.
 *
 * @param obj             Objektet
 * @param optionalFields  Fält där `undefined` ska bli `null` i DB.
 * @param omit            Fält som inte ska skickas till DB (t.ex. computed eller relations).
 */
export function toDb<T extends object>(
  obj: T,
  optionalFields: (keyof T)[] = [],
  omit: (keyof T)[] = [],
): DbRow {
  const out: DbRow = {};
  const optionalSet = new Set(optionalFields.map(String));
  const omitSet     = new Set(omit.map(String));

  for (const [k, v] of Object.entries(obj)) {
    if (omitSet.has(k)) continue;
    const snake = camelToSnake(k);
    if (v === undefined && optionalSet.has(k)) {
      out[snake] = null;
    } else if (v !== undefined) {
      out[snake] = v;
    }
  }

  return out;
}

// ── Konkreta mappers (för läsbarhet i useApp.tsx etc.) ────────────────────────
//
// Listorna nedan håller koll på vilka fält som är optional per typ.

import type { Property, RentalEntry, Expense, PropertyDocument } from '../types';

const PROPERTY_OPTIONAL:  (keyof Property)[]         = ['purchaseDate', 'completionDate', 'notes'];
const RENTAL_OPTIONAL:    (keyof RentalEntry)[]      = ['notes'];
const EXPENSE_OPTIONAL:   (keyof Expense)[]          = [];
const DOC_OPTIONAL:       (keyof PropertyDocument)[] = ['notes'];

export const propertyFromDb = (r: DbRow) => fromDb<Property>(r, PROPERTY_OPTIONAL);
export const propertyToDb   = (p: Property) => toDb<Property>(p, PROPERTY_OPTIONAL);

export const rentalFromDb = (r: DbRow) => fromDb<RentalEntry>(r, RENTAL_OPTIONAL);
export const rentalToDb   = (r: RentalEntry) => toDb<RentalEntry>(r, RENTAL_OPTIONAL);

export const expenseFromDb = (r: DbRow) => fromDb<Expense>(r, EXPENSE_OPTIONAL);
export const expenseToDb   = (e: Expense) => toDb<Expense>(e, EXPENSE_OPTIONAL);

export const docFromDb = (r: DbRow) => fromDb<PropertyDocument>(r, DOC_OPTIONAL);
export const docToDb   = (d: PropertyDocument) => toDb<PropertyDocument>(d, DOC_OPTIONAL);
