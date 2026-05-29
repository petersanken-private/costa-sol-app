// ── Kassaflödesprognos — pure functions ──────────────────────────────────────
//
// Strategi:
//   - Past + current månad: faktisk data från rentals/expenses.
//   - Future månad: baseline = samma månad förra året (per fastighet).
//   - Mortgage payments: ränta + amortering per mortgage period.
//   - Recurring expenses: genererade enligt frequency (monthly/quarterly/yearly).
//   - Tax: kvartalsvis Modelo 210 (apr/jul/okt/jan), 19% på YTD-netto EU-bosatt.

import { MONTHS_SV } from '../data';
import { TAX } from '../constants/tax';
import { rateForDate } from './mortgage.utils';
import type {
  Property, RentalEntry, Expense, RecurringExpense,
} from '../types';
import type { MortgageWithPeriods } from '../hooks/useMortgages';
import type { ForecastMonth, ForecastSummary, ForecastConfig } from '../types/forecast.types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function ymToKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function dateYearMonth(iso: string): [number, number] {
  const d = new Date(iso);
  return [d.getFullYear(), d.getMonth() + 1];
}

/** Add N months to (year, month), wrapping correctly. */
function addMonths(year: number, month: number, n: number): [number, number] {
  const total = (year * 12 + (month - 1)) + n;
  return [Math.floor(total / 12), (total % 12) + 1];
}

// ── Intäkter ─────────────────────────────────────────────────────────────────

/**
 * Intäkter per (fastighet, månad) från historiska rentals.
 * Returnerar Map<"propId:yyyy-mm", revenue>.
 */
function indexRentals(rentals: RentalEntry[]): Map<string, number> {
  const idx = new Map<string, number>();
  for (const r of rentals) {
    const key = `${r.propertyId}:${ymToKey(r.year, r.month)}`;
    idx.set(key, (idx.get(key) ?? 0) + r.revenue);
  }
  return idx;
}

function forecastRentalIncome(
  rentalsIdx: Map<string, number>,
  property: Property,
  year: number,
  month: number,
  isPast: boolean,
): number {
  const key = `${property.id}:${ymToKey(year, month)}`;

  if (isPast) {
    // Faktisk historik — om saknas, 0.
    return rentalsIdx.get(key) ?? 0;
  }

  // Framtid: baseline = samma månad förra året.
  const prevYearKey = `${property.id}:${ymToKey(year - 1, month)}`;
  return rentalsIdx.get(prevYearKey) ?? 0;
}

// ── Recurring expenses ───────────────────────────────────────────────────────

/** Returnerar utgift för (recurring template, year, month) eller 0. */
function recurringForMonth(r: RecurringExpense, year: number, month: number): number {
  if (!r.active) return 0;

  const [startY, startM] = dateYearMonth(r.startDate);
  // Startat?
  if (year < startY || (year === startY && month < startM)) return 0;
  // Slutat?
  if (r.endDate) {
    const [endY, endM] = dateYearMonth(r.endDate);
    if (year > endY || (year === endY && month > endM)) return 0;
  }

  switch (r.frequency) {
    case 'monthly':
      return r.amount;

    case 'quarterly': {
      // Kvartalsvis från startdatum: startM, startM+3, startM+6, startM+9
      const monthsSinceStart = (year - startY) * 12 + (month - startM);
      return monthsSinceStart % 3 === 0 ? r.amount : 0;
    }

    case 'yearly':
      return r.monthOfYear === month ? r.amount : 0;
  }
}

// ── Mortgage payments ────────────────────────────────────────────────────────

interface MonthlyMortgageCost {
  interest:  number;
  amort:     number;
}

function mortgageCostForMonth(
  m:        MortgageWithPeriods,
  year:     number,
  month:    number,
): MonthlyMortgageCost {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;
  const [startY, startM] = dateYearMonth(m.mortgage.startDate);

  // Inte aktivt ännu eller redan avslutat?
  if (year < startY || (year === startY && month < startM)) {
    return { interest: 0, amort: 0 };
  }
  const monthsActive = (year - startY) * 12 + (month - startM);
  const termMonths   = m.mortgage.termYears * 12;
  if (monthsActive >= termMonths) {
    return { interest: 0, amort: 0 };
  }

  // Ungefärlig saldo: original − amort × månader (rakt). Bra nog för forecast.
  const monthlyAmort = m.mortgage.originalAmount / termMonths;
  const balance      = Math.max(0, m.mortgage.originalAmount - monthlyAmort * monthsActive);
  const ratePct      = rateForDate(m.periods, dateStr);
  const monthlyRate  = ratePct / 100 / 12;
  const interest     = balance * monthlyRate;

  return { interest, amort: monthlyAmort };
}

// ── Faktiska expenses per månad ──────────────────────────────────────────────

function indexActualExpenses(expenses: Expense[]): Map<string, number> {
  const idx = new Map<string, number>();
  for (const e of expenses) {
    const [y, m] = dateYearMonth(e.date);
    const key    = `${e.propertyId}:${ymToKey(y, m)}`;
    idx.set(key, (idx.get(key) ?? 0) + e.amount);
  }
  return idx;
}

// ── Skatt (Modelo 210, kvartalsvis) ──────────────────────────────────────────

/**
 * Modelo 210 deklareras 1-20 apr/jul/okt/jan för föregående kvartal.
 * Vi modellerar betalningen som inträffar i deklarationsmånaden (apr/jul/okt/jan).
 */
function isTaxMonth(month: number): boolean {
  return month === 1 || month === 4 || month === 7 || month === 10;
}

/** Föregående kvartals månader givet en deklarationsmånad. */
function quarterMonths(taxMonth: number, year: number): { year: number; month: number }[] {
  // Apr → Q1 (jan-mar), Jul → Q2 (apr-jun), Okt → Q3 (jul-sep), Jan → Q4 (okt-dec föregående år)
  switch (taxMonth) {
    case 4:  return [{ year, month: 1 }, { year, month: 2 }, { year, month: 3 }];
    case 7:  return [{ year, month: 4 }, { year, month: 5 }, { year, month: 6 }];
    case 10: return [{ year, month: 7 }, { year, month: 8 }, { year, month: 9 }];
    case 1:  return [{ year: year - 1, month: 10 }, { year: year - 1, month: 11 }, { year: year - 1, month: 12 }];
    default: return [];
  }
}

// ── Huvudfunktion ───────────────────────────────────────────────────────────

export function buildForecast(
  config:      ForecastConfig,
  properties:  Property[],
  rentals:     RentalEntry[],
  expenses:    Expense[],
  recurring:   RecurringExpense[],
  mortgages:   MortgageWithPeriods[],
): { months: ForecastMonth[]; summary: ForecastSummary } {
  // Filtrera per propertyId om satt.
  const filterProps = config.propertyId === 'all'
    ? properties
    : properties.filter(p => p.id === config.propertyId);
  const propIds = new Set(filterProps.map(p => p.id));

  const filteredRentals    = rentals.filter(r => propIds.has(r.propertyId));
  const filteredExpenses   = expenses.filter(e => propIds.has(e.propertyId));
  const filteredRecurring  = recurring.filter(r => propIds.has(r.propertyId));
  const filteredMortgages  = mortgages.filter(m => propIds.has(m.mortgage.propertyId));

  const rentalsIdx  = indexRentals(filteredRentals);
  const expensesIdx = indexActualExpenses(filteredExpenses);

  const startDate = new Date(config.startDate);
  const startY    = startDate.getFullYear();
  const startM    = startDate.getMonth() + 1;

  const now = new Date();
  const nowY = now.getFullYear();
  const nowM = now.getMonth() + 1;

  const months: ForecastMonth[] = [];
  let balance = config.startBalance;

  for (let i = 0; i < config.horizonMonths; i++) {
    const [y, m] = addMonths(startY, startM, i);
    const isPast    = y < nowY || (y === nowY && m < nowM);
    const isCurrent = y === nowY && m === nowM;

    // Intäkter
    let rentalIncome = 0;
    for (const prop of filterProps) {
      rentalIncome += forecastRentalIncome(rentalsIdx, prop, y, m, isPast);
    }

    // Recurring expenses
    let recurringExpenses = 0;
    for (const r of filteredRecurring) {
      recurringExpenses += recurringForMonth(r, y, m);
    }

    // Mortgage costs
    let interest = 0, amort = 0;
    for (const mort of filteredMortgages) {
      const cost = mortgageCostForMonth(mort, y, m);
      interest += cost.interest;
      amort    += cost.amort;
    }

    // Faktiska one-off expenses (bara för past + current)
    let oneOffExpenses = 0;
    if (isPast || isCurrent) {
      for (const prop of filterProps) {
        const key = `${prop.id}:${ymToKey(y, m)}`;
        oneOffExpenses += expensesIdx.get(key) ?? 0;
      }
      // Subtrahera recurring så vi inte dubbelräknar (de finns ofta som expenses
      // när auto-generatorn körts).
      oneOffExpenses = Math.max(0, oneOffExpenses - recurringExpenses);
    }

    // Skatt (Modelo 210 kvartalsvis)
    let taxPayment = 0;
    if (isTaxMonth(m) && !isPast) {
      // Räkna netto för föregående kvartal
      const qMonths = quarterMonths(m, y);
      let qNet = 0;
      for (const qm of qMonths) {
        let qIncome = 0, qExpenses = 0;
        for (const prop of filterProps) {
          const past = qm.year < nowY || (qm.year === nowY && qm.month < nowM);
          qIncome += forecastRentalIncome(rentalsIdx, prop, qm.year, qm.month, past);
        }
        for (const r of filteredRecurring) {
          if (r.deductible) qExpenses += recurringForMonth(r, qm.year, qm.month);
        }
        qNet += qIncome - qExpenses;
      }
      taxPayment = Math.max(0, qNet * TAX.IRNR_EU_PCT);
    }

    const netCashflow = rentalIncome - recurringExpenses - oneOffExpenses - interest - amort - taxPayment;
    balance += netCashflow;

    months.push({
      year:              y,
      month:             m,
      label:             `${MONTHS_SV[m - 1]} ${y}`,
      isPast,
      isCurrent,
      rentalIncome,
      recurringExpenses,
      mortgageInterest:  interest,
      mortgageAmort:     amort,
      oneOffExpenses,
      taxPayment,
      netCashflow,
      balanceEnd:        balance,
    });
  }

  // ── Summary ────────────────────────────────────────────────────────────
  const totalIncome   = months.reduce((s, m) => s + m.rentalIncome, 0);
  const totalExpenses = months.reduce((s, m) =>
    s + m.recurringExpenses + m.mortgageInterest + m.mortgageAmort + m.oneOffExpenses + m.taxPayment, 0);
  const minMonth = months.reduce((min, m) => m.balanceEnd < min.balanceEnd ? m : min, months[0]);

  return {
    months,
    summary: {
      startBalance: config.startBalance,
      totalIncome,
      totalExpenses,
      totalNet:     totalIncome - totalExpenses,
      endBalance:   balance,
      minBalance:   minMonth?.balanceEnd ?? config.startBalance,
      minBalanceMonth: minMonth?.label,
    },
  };
}
