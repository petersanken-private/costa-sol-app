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

/**
 * camelCase → snake_case med akronym-stöd.
 *
 * Exempel:
 *  - `sizeSqm`        → `size_sqm`
 *  - `propertyId`     → `property_id`
 *  - `occupancyPct`   → `occupancy_pct`      (Pct är akronym)
 *  - `hasVFTLicense`  → `has_vft_license`    (VFT är akronym)
 *  - `annualGrowthPct`→ `annual_growth_pct`
 *
 * VIKTIGT: en tidigare version av denna funktion (s.replace(/[A-Z]/g, ...))
 * insatte `_` före VARJE versal vilket gav `has_v_f_t_license` och
 * `occupancy_p_c_t`. Eftersom vi inte destrukturerade Supabase:s { error }
 * passerade dessa fel tyst och data försvann vid refresh. Båda buggar är
 * åtgärdade nu — denna funktion (smartare regex) + useApp:s hotfix.
 */
export function camelToSnake(s: string): string {
  return s
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')  // VFTL → VFT_L, hanterar akronymer
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')      // sV → s_V, vanliga camelCase-gränser
    .toLowerCase();
}

/**
 * Konvertera en DB-rad till app-typ.
 *
 * @param row             Raden från Supabase
 * @param optionalFields  Fält som kan vara null/undefined i app-typen
 *                        (null konverteras till undefined för dem).
 * @param dbFieldOverrides Mapping {DB-kolumn → app-fält} för fält som inte
 *                         följer naivt snake↔camel (t.ex. akronymer som
 *                         `has_vft_license` ↔ `hasVFTLicense`).
 */
export function fromDb<T>(
  row: DbRow,
  optionalFields: (keyof T)[] = [],
  dbFieldOverrides: Record<string, string> = {},
): T {
  const out: Record<string, unknown> = {};
  const optionalSet = new Set(optionalFields.map(String));

  for (const [k, v] of Object.entries(row)) {
    const camel = dbFieldOverrides[k] ?? snakeToCamel(k);
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

import type {
  Property, RentalEntry, Expense, PropertyDocument,
  ProspectProperty, AreaMarketData,
} from '../types';

const PROPERTY_OPTIONAL:  (keyof Property)[]          = ['purchaseDate', 'completionDate', 'notes'];
// VFT-akronymen följer inte naivt snake↔camel-mönster. snakeToCamel skulle
// annars ge 'hasVftLicense'. Detta override:r läsvägen så app-typen behåller
// 'hasVFTLicense'. Skrivvägen funkar automatiskt via smart camelToSnake.
const PROPERTY_FROM_DB_OVERRIDES = { has_vft_license: 'hasVFTLicense' };
const RENTAL_OPTIONAL:    (keyof RentalEntry)[]       = ['notes'];
const EXPENSE_OPTIONAL:   (keyof Expense)[]           = [];
const DOC_OPTIONAL:       (keyof PropertyDocument)[]  = ['notes'];
const PROSPECT_OPTIONAL:  (keyof ProspectProperty)[]  = ['floor', 'development', 'link', 'notes'];
const MARKET_OPTIONAL:    (keyof AreaMarketData)[]    = ['notes'];

export const propertyFromDb = (r: DbRow) =>
  fromDb<Property>(r, PROPERTY_OPTIONAL, PROPERTY_FROM_DB_OVERRIDES);
export const propertyToDb   = (p: Property) => toDb<Property>(p, PROPERTY_OPTIONAL);

export const rentalFromDb = (r: DbRow) => fromDb<RentalEntry>(r, RENTAL_OPTIONAL);
export const rentalToDb   = (r: RentalEntry) => toDb<RentalEntry>(r, RENTAL_OPTIONAL);

export const expenseFromDb = (r: DbRow) => fromDb<Expense>(r, EXPENSE_OPTIONAL);
export const expenseToDb   = (e: Expense) => toDb<Expense>(e, EXPENSE_OPTIONAL);

export const docFromDb = (r: DbRow) => fromDb<PropertyDocument>(r, DOC_OPTIONAL);
export const docToDb   = (d: PropertyDocument) => toDb<PropertyDocument>(d, DOC_OPTIONAL);

export const prospectFromDb = (r: DbRow) => fromDb<ProspectProperty>(r, PROSPECT_OPTIONAL);
export const prospectToDb   = (p: ProspectProperty) => toDb<ProspectProperty>(p, PROSPECT_OPTIONAL);

// Marknadsdata: occupancyPct och annualGrowthPct kommer som strängar från
// postgres NUMERIC-typen — coerce till Number här.
export function marketFromDb(r: DbRow): AreaMarketData {
  const base = fromDb<AreaMarketData>(r, MARKET_OPTIONAL);
  return {
    ...base,
    occupancyPct:    Number(base.occupancyPct),
    annualGrowthPct: Number(base.annualGrowthPct),
  };
}
export const marketToDb = (m: AreaMarketData) => toDb<AreaMarketData>(m, MARKET_OPTIONAL);
