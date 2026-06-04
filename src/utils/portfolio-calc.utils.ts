// ── Koppla portföljobjekt → Kalkylatorn ───────────────────────────────────────
//
// Rena funktioner som översätter ett riktigt portföljobjekt + dess faktiska
// uthyrningar till ett ScenarioConfig som kalkylmotorn (calc.utils) kan räkna på.
// Intäkterna baseras på de senaste 12 datamånaderna istället för hypotetiska
// scenario-gissningar. Värdetillväxten (annualGrowthPct) ärvs från det valda
// presets-scenariot — vi har ingen tillförlitlig egen appreciering att gissa.

import type { Property, RentalEntry } from '../types/database.types';
import type { ScenarioConfig } from '../types';

/** Sorterbart heltalsindex för (år, månad). Månad är 1-baserad. */
const monthIndex = (year: number, month: number): number => year * 12 + (month - 1);

export interface ActualUsage {
  /** Summerade uthyrda nätter i fönstret. */
  nights:  number;
  /** Summerad bruttointäkt i fönstret (EUR). */
  revenue: number;
  /** Härledd snittnatt (revenue / nights), 0 om inga nätter. */
  adr:     number;
  /** Antal distinkta månader med uthyrningsdata i fönstret. */
  months:  number;
}

/**
 * Plocka ut objektets uthyrningar inom de senaste 12 datamånaderna, räknat
 * bakåt från den SENASTE månaden med data (inte dagens datum) — så att glesa
 * eller historiska portföljer ändå ger ett rättvist TTM-värde.
 */
export function trailing12mRentals(rentals: RentalEntry[], propertyId: string): RentalEntry[] {
  const own = rentals.filter(r => r.propertyId === propertyId);
  if (own.length === 0) return [];

  const latestIdx = Math.max(...own.map(r => monthIndex(r.year, r.month)));
  const cutoff    = latestIdx - 11; // 12 månader inklusive senaste
  return own.filter(r => monthIndex(r.year, r.month) >= cutoff);
}

/** Summera faktiskt nyttjande (nätter, intäkt, ADR) för ett objekt. */
export function actualUsage(rentals: RentalEntry[], propertyId: string): ActualUsage {
  const window = trailing12mRentals(rentals, propertyId);

  const nights  = window.reduce((s, r) => s + r.nights, 0);
  const revenue = window.reduce((s, r) => s + r.revenue, 0);
  const months  = new Set(window.map(r => monthIndex(r.year, r.month))).size;

  return {
    nights,
    revenue,
    adr: nights > 0 ? revenue / nights : 0,
    months,
  };
}

export interface ActualScenario {
  /** Scenario med faktiska nätter/ADR men ärvd värdetillväxt + färg. */
  scenario: ScenarioConfig;
  usage:    ActualUsage;
}

/**
 * Bygg ett "Faktisk"-scenario från ett objekts riktiga uthyrningar.
 * Returnerar null om objektet saknar uthyrda nätter — då finns inget faktiskt
 * intäktsunderlag och anroparen bör falla tillbaka på presets-scenariot.
 *
 * Värdetillväxten (annualGrowthPct) och färgen ärvs från `base`, så att
 * scenario-knapparna fortfarande styr appreciering medan intäkten är verklig.
 */
export function deriveActualScenario(
  property: Property,
  rentals:  RentalEntry[],
  base:     ScenarioConfig,
): ActualScenario | null {
  const usage = actualUsage(rentals, property.id);
  if (usage.nights <= 0) return null;

  return {
    usage,
    scenario: {
      key:             base.key,           // växt-källa; ScenarioKey tillåter ej egen
      label:           'Faktisk',
      nights:          usage.nights,
      adr:             usage.adr,
      annualGrowthPct: base.annualGrowthPct,
      color:           base.color,
    },
  };
}
