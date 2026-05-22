import { ScenarioConfig, CalcResult } from '../types';
import { TAX, BUYING_COSTS, OPERATING, MORTGAGE_DEFAULTS } from '../constants/tax';

// ── Formattering ──────────────────────────────────────────────────────────────

export const fmt = (n: number): string =>
  new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n);

export const fmtEur = (n: number): string =>
  '€' + new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Math.abs(n));

export const fmtPct = (n: number, decimals = 1): string =>
  n.toFixed(decimals) + '%';

export const fmtSignEur = (n: number): string =>
  (n >= 0 ? '+' : '−') + fmtEur(n);

// ── Display-valuta (för UI). PDF-export använder alltid fmtEur. ────────────────
// Modulnivå-state som sätts av CurrencyProvider. Sweepa fmtEur → fmtMoney i UI.

export type DisplayCurrency = 'EUR' | 'SEK';

let _displayCurrency: DisplayCurrency = 'EUR';
let _eurToSekRate: number = 11.5;

export function setDisplayCurrency(c: DisplayCurrency): void { _displayCurrency = c; }
export function setEurToSekRate(rate: number): void { _eurToSekRate = rate; }
export function getDisplayCurrency(): DisplayCurrency { return _displayCurrency; }

/** Formatera EUR-belopp i nuvarande display-valuta. Använd i UI istället för fmtEur. */
export const fmtMoney = (eur: number): string => {
  if (_displayCurrency === 'EUR') return fmtEur(eur);
  const sek = Math.abs(eur) * _eurToSekRate;
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(sek) + ' kr';
};

/** Som fmtMoney men med +/− tecken. */
export const fmtSignMoney = (eur: number): string =>
  (eur >= 0 ? '+' : '−') + fmtMoney(eur);

// ── Köpkostnader ──────────────────────────────────────────────────────────────

export interface BuyingCostBreakdown {
  transferTax:   number;
  notary:        number;
  landRegistry:  number;
  lawyer:        number;
  admin:         number;
  total:         number;
}

export function calcBuyingCosts(purchasePrice: number): BuyingCostBreakdown {
  const transferTax  = purchasePrice * BUYING_COSTS.TRANSFER_TAX_PCT;
  const notary       = purchasePrice * BUYING_COSTS.NOTARY_PCT;
  const landRegistry = purchasePrice * BUYING_COSTS.LAND_REGISTRY_PCT;
  const lawyer       = purchasePrice * BUYING_COSTS.LAWYER_PCT;
  const admin        = BUYING_COSTS.ADMIN_FEE_EUR;
  return {
    transferTax, notary, landRegistry, lawyer, admin,
    total: transferTax + notary + landRegistry + lawyer + admin,
  };
}

// ── Investeringskalkyl ────────────────────────────────────────────────────────

export interface CalcOptions {
  purchasePrice: number;
  scenario:      ScenarioConfig;
  horizonYears:  number;
  useMortgage:   boolean;
  mortgagePct:   number;   // 0–100
  mortgageRate:  number;   // 0–1, t.ex. 0.045
}

export function calcInvestment(opts: CalcOptions): CalcResult {
  const { purchasePrice, scenario, horizonYears, useMortgage, mortgagePct, mortgageRate } = opts;

  const costs = calcBuyingCosts(purchasePrice);
  const loanAmount   = useMortgage ? purchasePrice * (mortgagePct / 100) : 0;
  const equity       = useMortgage
    ? purchasePrice * (1 - mortgagePct / 100) + costs.total
    : purchasePrice + costs.total;
  const mortgageCost = loanAmount * mortgageRate;

  // Intäkter
  const grossRent = scenario.nights * scenario.adr;

  // Driftskostnader
  const managementFee = grossRent * OPERATING.MANAGEMENT_FEE_PCT;
  const cleaningCost  = scenario.nights * OPERATING.CLEANING_PER_NIGHT_EUR;
  const fixedCosts    = OPERATING.DEFAULT_FIXED_TOTAL_EUR;
  const maintenance   = purchasePrice * OPERATING.MAINTENANCE_PCT;
  const totalOpex     = managementFee + cleaningCost + fixedCosts + maintenance + mortgageCost;

  // Skatt (IRNR 19% på nettoinkomst för EU/EEA)
  const netBeforeTax  = grossRent - totalOpex;
  const taxableIncome = Math.max(0, netBeforeTax);
  const tax           = taxableIncome * TAX.IRNR_EU_PCT;
  const netAfterTax   = netBeforeTax - tax;

  // Yield
  const grossYield = (grossRent / purchasePrice) * 100;
  const netYield   = equity > 0 ? (netAfterTax / equity) * 100 : 0;

  // Exit
  const exitPrice       = purchasePrice * Math.pow(1 + scenario.annualGrowthPct / 100, horizonYears);
  const capitalGain     = exitPrice - purchasePrice;
  const capitalGainsTax = capitalGain * TAX.CAPITAL_GAINS_PCT;
  const saleProfit      = capitalGain - capitalGainsTax;

  // Totalavkastning
  const cumulativeRent    = netAfterTax * horizonYears;
  const totalReturn       = cumulativeRent + saleProfit;
  const annualizedReturn  = equity > 0
    ? (Math.pow(1 + totalReturn / equity, 1 / horizonYears) - 1) * 100
    : 0;

  return {
    grossRent, managementFee, cleaningCost, fixedCosts, mortgageCost,
    totalOpex, netBeforeTax, tax, netAfterTax,
    grossYield, netYield, equity,
    exitPrice, capitalGain, capitalGainsTax, saleProfit,
    cumulativeRent, totalReturn, annualizedReturn,
  };
}

// ── Portfölj ──────────────────────────────────────────────────────────────────

export function calcPortfolioKPIs(properties: { purchasePrice: number; currentValue: number }[]) {
  const totalInvested     = properties.reduce((s, p) => s + p.purchasePrice, 0);
  const totalCurrentValue = properties.reduce((s, p) => s + p.currentValue, 0);
  const unrealizedGain    = totalCurrentValue - totalInvested;
  return { totalInvested, totalCurrentValue, unrealizedGain };
}

// ── Cashflow-projektion år för år ─────────────────────────────────────────────

export interface ProjectionYear {
  year:          number;   // 1-baserat
  calendarYear:  number;
  grossRent:     number;
  opex:          number;
  mortgagePayment: number; // ränta + amortering
  netBeforeTax:  number;
  tax:           number;
  netAfterTax:   number;   // driftnetto
  propertyValue: number;
  loanBalance:   number;
  equity:        number;   // fastighetsvärde - lånesaldo
  cumulativeCashflow: number; // ackumulerat driftnetto fr. år 1
  totalWealth:   number;   // equity + ackumulerat kassaflöde - köpkostnad
}

export interface ProjectionOptions {
  purchasePrice:   number;
  startYear:       number;
  horizonYears:    number;
  scenario:        ScenarioConfig;
  useMortgage:     boolean;
  mortgagePct:     number;
  mortgageRate:    number;
  amortizationPct: number;  // % av lånet per år, default 2%
  inflationPct:    number;  // kostnads-inflation per år, default 2%
}

export function calcProjection(opts: ProjectionOptions): ProjectionYear[] {
  const {
    purchasePrice, startYear, horizonYears, scenario,
    useMortgage, mortgagePct, mortgageRate, amortizationPct, inflationPct,
  } = opts;

  const costs      = calcBuyingCosts(purchasePrice);
  const loanAmount = useMortgage ? purchasePrice * (mortgagePct / 100) : 0;

  let loanBalance       = loanAmount;
  let cumulativeCashflow = 0;

  return Array.from({ length: horizonYears }, (_, i) => {
    const yr = i + 1;

    // Inflation-adjusted opex
    const inflFactor    = Math.pow(1 + inflationPct / 100, i);
    const rentGrowth    = Math.min(scenario.annualGrowthPct, MORTGAGE_DEFAULTS.RENT_GROWTH_CAP_PCT);
    const grossRent     = scenario.nights * scenario.adr * Math.pow(1 + rentGrowth / 100, i);
    const managementFee = grossRent * OPERATING.MANAGEMENT_FEE_PCT;
    const cleaningCost  = scenario.nights * OPERATING.CLEANING_PER_NIGHT_EUR * inflFactor;
    const fixedCosts    = OPERATING.DEFAULT_FIXED_TOTAL_EUR * inflFactor;
    const maintenance   = purchasePrice * OPERATING.MAINTENANCE_PCT * inflFactor;
    const opex          = managementFee + cleaningCost + fixedCosts + maintenance;

    // Mortgage: interest on remaining balance + amortization
    const interestCost   = loanBalance * mortgageRate;
    const amortization   = loanAmount * (amortizationPct / 100);
    const mortgagePayment = useMortgage ? interestCost + amortization : 0;
    loanBalance           = Math.max(0, loanBalance - amortization);

    // Net income
    const netBeforeTax = grossRent - opex - interestCost; // ränta avdragsgill, ej amortering
    const tax          = Math.max(0, netBeforeTax) * TAX.IRNR_EU_PCT;
    const netAfterTax  = netBeforeTax - tax;

    cumulativeCashflow += netAfterTax;

    // Property value & wealth
    const propertyValue = purchasePrice * Math.pow(1 + scenario.annualGrowthPct / 100, yr);
    const equity        = propertyValue - loanBalance;
    const totalWealth   = equity + cumulativeCashflow - costs.total;

    return {
      year: yr,
      calendarYear: startYear + yr,
      grossRent,
      opex,
      mortgagePayment,
      netBeforeTax,
      tax,
      netAfterTax,
      propertyValue,
      loanBalance,
      equity,
      cumulativeCashflow,
      totalWealth,
    };
  });
}

// ── Monte Carlo känslighetsanalys ─────────────────────────────────────────────

export interface MonteCarloOptions {
  purchasePrice: number;
  horizonYears:  number;
  useMortgage:   boolean;
  mortgagePct:   number;
  mortgageRate:  number;
  /** Antal simuleringar (default 1000). */
  iterations?:   number;
  /** Distribution för osäkra parametrar (normalfördelning runt medel). */
  adrMean:       number;       // €/natt
  adrStdDev:     number;       // €/natt
  occupancyMean: number;       // nätter/år
  occupancyStdDev: number;     // nätter/år
  growthMean:    number;       // %/år
  growthStdDev:  number;       // %/år
}

export interface MonteCarloResult {
  iterations: number;
  /** Genomsnittlig årlig avkastning (%). */
  meanAnnualizedReturn: number;
  /** Median, 10:e och 90:e percentilen. */
  medianAnnualizedReturn: number;
  p10AnnualizedReturn: number;
  p90AnnualizedReturn: number;
  /** Sannolikhet att avkastning är positiv. */
  probabilityPositive: number;
  /** Sannolikhet att avkastning > 5% / 10% / 15%. */
  probabilityAbove5: number;
  probabilityAbove10: number;
  probabilityAbove15: number;
  /** Histogram-bins för plotting. */
  histogram: { bin: number; count: number }[];
  /** Alla simulerade returns (för anpassad plotting). */
  samples: number[];
}

/** Box-Muller transform för normalfördelning. */
function randNormal(mean: number, stdDev: number): number {
  const u1 = 1 - Math.random();
  const u2 = 1 - Math.random();
  const z  = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[idx];
}

export function runMonteCarlo(opts: MonteCarloOptions): MonteCarloResult {
  const iterations = opts.iterations ?? 1000;
  const samples: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const adr        = Math.max(50, randNormal(opts.adrMean, opts.adrStdDev));
    const occupancy  = Math.max(30, Math.min(330, randNormal(opts.occupancyMean, opts.occupancyStdDev)));
    const growth     = randNormal(opts.growthMean, opts.growthStdDev);

    const scenario: ScenarioConfig = {
      key: 'base',
      label: 'MC',
      nights: occupancy,
      adr,
      annualGrowthPct: growth,
      color: '#000',
    };

    const result = calcInvestment({
      purchasePrice: opts.purchasePrice,
      scenario,
      horizonYears: opts.horizonYears,
      useMortgage:  opts.useMortgage,
      mortgagePct:  opts.mortgagePct,
      mortgageRate: opts.mortgageRate,
    });

    samples.push(result.annualizedReturn);
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const mean   = samples.reduce((s, x) => s + x, 0) / samples.length;

  // Histogram: 20 bins från min till max
  const min  = sorted[0];
  const max  = sorted[sorted.length - 1];
  const binW = (max - min) / 20 || 1;
  const histogram = Array.from({ length: 20 }, (_, i) => ({
    bin: min + i * binW + binW / 2,
    count: 0,
  }));
  for (const s of samples) {
    const idx = Math.min(19, Math.floor((s - min) / binW));
    histogram[idx].count++;
  }

  return {
    iterations,
    meanAnnualizedReturn:   mean,
    medianAnnualizedReturn: percentile(sorted, 0.5),
    p10AnnualizedReturn:    percentile(sorted, 0.1),
    p90AnnualizedReturn:    percentile(sorted, 0.9),
    probabilityPositive:    samples.filter(s => s > 0).length / samples.length,
    probabilityAbove5:      samples.filter(s => s > 5).length / samples.length,
    probabilityAbove10:     samples.filter(s => s > 10).length / samples.length,
    probabilityAbove15:     samples.filter(s => s > 15).length / samples.length,
    histogram,
    samples,
  };
}

// ── UI-färghjälpare för cashflow-rader ────────────────────────────────────────
// Används i både Calculator (kassaflöde + köpkostnader) och PropertyDetail
// — bryt UT istället för att duplicera nästlade ternaries.

export interface CashflowRowMeta {
  isFinal?:  boolean;
  isNet?:    boolean;
  isIncome?: boolean;
  value:     number;
}

/**
 * Hitta färg för en cashflow-rads VÄRDE-cell.
 * - Slutraden (Netto e. skatt): scenarioFinishColor om positivt, röd om negativt.
 * - Övriga: ljust grå för 0/utgift, normal text för intäkter.
 */
export function cashflowValueColor(row: CashflowRowMeta, finalPositiveColor: string): string {
  if (row.isFinal) return row.value > 0 ? finalPositiveColor : 'var(--red)';
  return row.value > 0 ? 'var(--text)' : 'var(--text-mute)';
}

/**
 * Hitta färg för en cashflow-rads LABEL-cell.
 */
export function cashflowLabelColor(row: CashflowRowMeta): string {
  if (row.isFinal)  return 'var(--text)';
  if (row.isIncome) return 'var(--text)';
  return 'var(--text-dim)';
}

export interface BuyingCostRowMeta {
  bold?:      boolean;
  highlight?: boolean;
}

/**
 * Stilattribut för buying cost-rader (köpkostnadstabellen).
 */
export function buyingCostRowStyle(row: BuyingCostRowMeta): { fontWeight: number; color: string } {
  return {
    fontWeight: row.bold ? 600 : 400,
    color:      row.highlight ? 'var(--gold)' : row.bold ? 'var(--text)' : 'var(--text-dim)',
  };
}
