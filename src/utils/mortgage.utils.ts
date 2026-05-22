import { Mortgage, MortgageRatePeriod, AmortizationType } from '../types';

export interface AmortizationRow {
  month:         number;          // 1-baserat
  date:          string;          // ISO YYYY-MM
  openingBalance: number;
  interest:      number;
  amortization:  number;          // amorteringsdel
  payment:       number;          // total månadsbetalning
  closingBalance: number;
  ratePct:       number;          // använd ränta detta månad
}

/**
 * Hitta gällande ränta för ett givet datum från en lista av perioder.
 * Fallback: 4.5% om inga perioder.
 */
export function rateForDate(periods: MortgageRatePeriod[], date: string): number {
  const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
  let current = 4.5;
  for (const p of sorted) {
    if (p.startDate <= date && (!p.endDate || p.endDate >= date)) {
      current = p.ratePct;
    }
  }
  return current;
}

/**
 * Annuitetslån: konstant månadsbetalning, räntedelen minskar över tid.
 * P = L * r / (1 - (1+r)^-n)
 */
function annuityPayment(principal: number, monthlyRate: number, months: number): number {
  if (monthlyRate === 0) return principal / months;
  return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
}

/**
 * Bygg en fullständig amorteringsplan månad för månad.
 * Hanterar räntebyten genom att slå upp gällande ränta per månad.
 */
export function buildAmortizationSchedule(
  mortgage: Mortgage,
  periods: MortgageRatePeriod[],
): AmortizationRow[] {
  const totalMonths = mortgage.termYears * 12;
  const rows: AmortizationRow[] = [];

  let balance = mortgage.originalAmount;
  const startY = parseInt(mortgage.startDate.substring(0, 4), 10);
  const startM = parseInt(mortgage.startDate.substring(5, 7), 10);

  // Linjär amortering: fast amorteringsbelopp per månad
  const linearAmort = mortgage.originalAmount / totalMonths;

  for (let i = 0; i < totalMonths; i++) {
    if (balance <= 0.01) break;

    const y = startY + Math.floor((startM - 1 + i) / 12);
    const m = ((startM - 1 + i) % 12) + 1;
    const dateStr = `${y}-${String(m).padStart(2, '0')}`;

    const annualRate  = rateForDate(periods, `${dateStr}-01`);
    const monthlyRate = annualRate / 100 / 12;

    let interest = balance * monthlyRate;
    let amortization = 0;
    let payment = 0;

    if (mortgage.amortizationType === 'annuity') {
      // Beräkna annuitetsbetalning baserat på återstående saldo + återstående tid
      payment = annuityPayment(balance, monthlyRate, totalMonths - i);
      amortization = payment - interest;
    } else if (mortgage.amortizationType === 'linear') {
      amortization = linearAmort;
      payment = amortization + interest;
    } else {
      // interest_only — betala bara ränta. Amortering = 0 (balloon-betalning vid termen slut hanteras separat).
      amortization = 0;
      payment = interest;
    }

    // Sista månaden: justera amortering så saldot går till 0
    if (amortization > balance) amortization = balance;
    if (payment < interest)     payment = interest + amortization;

    const closingBalance = Math.max(0, balance - amortization);

    rows.push({
      month: i + 1,
      date: dateStr,
      openingBalance: balance,
      interest,
      amortization,
      payment,
      closingBalance,
      ratePct: annualRate,
    });

    balance = closingBalance;
  }

  return rows;
}

/**
 * Aggregera amorteringsplan till år-nivå för diagram/översikt.
 */
export interface MortgageYearSummary {
  year:          number;
  totalInterest: number;
  totalAmort:    number;
  totalPayment:  number;
  endBalance:    number;
}

export function summarizeByYear(schedule: AmortizationRow[]): MortgageYearSummary[] {
  const byYear = new Map<number, MortgageYearSummary>();

  for (const row of schedule) {
    const y = parseInt(row.date.substring(0, 4), 10);
    if (!byYear.has(y)) {
      byYear.set(y, { year: y, totalInterest: 0, totalAmort: 0, totalPayment: 0, endBalance: 0 });
    }
    const s = byYear.get(y)!;
    s.totalInterest += row.interest;
    s.totalAmort    += row.amortization;
    s.totalPayment  += row.payment;
    s.endBalance    = row.closingBalance;
  }

  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}

/**
 * Nuvarande saldo (vid givet datum eller idag).
 */
export function currentBalance(
  schedule: AmortizationRow[],
  asOfDate: string = new Date().toISOString().substring(0, 7),
): number {
  // Hitta senaste raden vars datum <= asOfDate
  const past = schedule.filter(r => r.date <= asOfDate);
  if (past.length === 0) return schedule[0]?.openingBalance ?? 0;
  return past[past.length - 1].closingBalance;
}

/**
 * Snabbsammandrag för UI: total räntekostnad över hela låneperioden.
 */
export function totalInterestPaid(schedule: AmortizationRow[]): number {
  return schedule.reduce((s, r) => s + r.interest, 0);
}

/**
 * Kort textsammandrag för amorteringstyp.
 */
export function amortizationLabel(type: AmortizationType): string {
  switch (type) {
    case 'annuity':       return 'Annuitet (konstant betalning)';
    case 'linear':        return 'Rak amortering (sjunkande betalning)';
    case 'interest_only': return 'Endast ränta (amorteringsfritt)';
  }
}
