// ── Co-owner split — pure functions ──────────────────────────────────────────
//
// Räknar fram per-ägare-aggregat över portföljen baserat på `owners`-fältet
// på varje fastighet. Stöder sambo-/skuldebrev-scenarion (90/10, 50/50 etc.).

import type { Property, PropertyOwner, RentalEntry, Expense } from '../types';
import { TAX } from '../constants/tax';

export const DEFAULT_OWNER = 'Jag';

/**
 * Normalisera owners: tom array → single owner 100%.
 * Defensive — om appen har data utan owners eller med felaktig data hamnar
 * allt på "Jag" 100%.
 */
export function effectiveOwners(p: Property): PropertyOwner[] {
  if (!p.owners || p.owners.length === 0) {
    return [{ name: DEFAULT_OWNER, sharePct: 100 }];
  }
  return p.owners;
}

/** Lista alla unika ägare i portföljen (för dropdowns/tabs). */
export function listAllOwners(properties: Property[]): string[] {
  const set = new Set<string>();
  for (const p of properties) {
    for (const o of effectiveOwners(p)) set.add(o.name);
  }
  return Array.from(set).sort();
}

/**
 * Andel av en fastighet som tillhör en specifik ägare.
 * Returnerar 0 om ägaren inte är delägare i fastigheten.
 */
export function shareOf(p: Property, ownerName: string): number {
  const owners = effectiveOwners(p);
  const found = owners.find(o => o.name === ownerName);
  return found ? found.sharePct / 100 : 0;
}

// ── Aggregat per ägare ────────────────────────────────────────────────────────

export interface OwnerPnL {
  ownerName:           string;
  totalInvested:       number;       // share × purchasePrice
  totalCurrentValue:   number;       // share × currentValue
  unrealizedGain:      number;       // share × (currentValue - purchasePrice)
  grossRentalIncome:   number;       // share × totalRent
  deductibleExpenses:  number;       // share × deductible expenses
  totalExpenses:       number;       // share × all expenses
  netBeforeTax:        number;       // gross - deductible
  estimatedTax:        number;       // 19% IRNR EU-bosatt
  netAfterTax:         number;       // net - tax
  propertyCount:       number;       // antal fastigheter ägaren är delägare i
}

/**
 * Räkna per-ägare-aggregat för ett givet år.
 * Filtrerar rentals + expenses till det årets data.
 */
export function calcOwnerPnL(
  owner:      string,
  properties: Property[],
  rentals:    RentalEntry[],
  expenses:   Expense[],
  year:       number,
): OwnerPnL {
  let totalInvested      = 0;
  let totalCurrentValue  = 0;
  let grossRentalIncome  = 0;
  let deductibleExpenses = 0;
  let totalExpenses      = 0;
  let propertyCount      = 0;

  for (const p of properties) {
    const share = shareOf(p, owner);
    if (share === 0) continue;
    propertyCount++;

    totalInvested     += p.purchasePrice * share;
    totalCurrentValue += p.currentValue  * share;

    const yearRentals  = rentals.filter(r => r.propertyId === p.id && r.year === year);
    const yearExpenses = expenses.filter(e => e.propertyId === p.id && e.date.startsWith(String(year)));

    grossRentalIncome += yearRentals.reduce((s, r) => s + r.revenue, 0) * share;

    for (const e of yearExpenses) {
      const amt = e.amount * share;
      totalExpenses += amt;
      if (e.deductible) deductibleExpenses += amt;
    }
  }

  const netBeforeTax = Math.max(0, grossRentalIncome - deductibleExpenses);
  const estimatedTax = netBeforeTax * TAX.IRNR_EU_PCT;

  return {
    ownerName:         owner,
    totalInvested,
    totalCurrentValue,
    unrealizedGain:    totalCurrentValue - totalInvested,
    grossRentalIncome,
    deductibleExpenses,
    totalExpenses,
    netBeforeTax,
    estimatedTax,
    netAfterTax:       netBeforeTax - estimatedTax,
    propertyCount,
  };
}

/** Räkna PnL för alla ägare i portföljen. */
export function calcAllOwnerPnLs(
  properties: Property[],
  rentals:    RentalEntry[],
  expenses:   Expense[],
  year:       number,
): OwnerPnL[] {
  return listAllOwners(properties).map(name =>
    calcOwnerPnL(name, properties, rentals, expenses, year),
  );
}

// ── Validering ───────────────────────────────────────────────────────────────

export function validateOwners(owners: PropertyOwner[]): string | null {
  if (owners.length === 0) return null; // tomt = single owner 100%, OK
  if (owners.some(o => !o.name.trim())) return 'Alla ägare måste ha namn.';
  if (new Set(owners.map(o => o.name.trim())).size !== owners.length) {
    return 'Ägarnamn måste vara unika inom en fastighet.';
  }
  const sum = owners.reduce((s, o) => s + o.sharePct, 0);
  if (Math.abs(sum - 100) > 0.01) {
    return `Andelar måste summera till 100% (nu: ${sum.toFixed(1)}%).`;
  }
  if (owners.some(o => o.sharePct <= 0 || o.sharePct > 100)) {
    return 'Varje andel måste vara mellan 0% och 100%.';
  }
  return null;
}

/** Finns det fastigheter med 2+ ägare i portföljen? Styr om UI ska visas. */
export function hasCoOwnership(properties: Property[]): boolean {
  return properties.some(p => effectiveOwners(p).length > 1);
}
