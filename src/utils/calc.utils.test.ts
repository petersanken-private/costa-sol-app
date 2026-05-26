import { describe, it, expect, beforeEach } from 'vitest';
import {
  fmt, fmtEur, fmtPct, fmtSignEur, fmtMoney, fmtSignMoney,
  setDisplayCurrency, setEurToSekRate, getDisplayCurrency,
  calcBuyingCosts,
  calcInvestment,
  calcPortfolioKPIs,
  calcProjection,
} from './calc.utils';
import { BUYING_COSTS, TAX, OPERATING } from '../constants/tax';
import { ScenarioConfig } from '../types';

// ── Helper ────────────────────────────────────────────────────────────────────
const BASE_SCENARIO: ScenarioConfig = {
  key: 'base',
  label: 'Bas',
  nights: 180,
  adr: 150,
  annualGrowthPct: 3,
  color: '#000',
};

// ─────────────────────────────────────────────────────────────────────────────
// Formattering
// ─────────────────────────────────────────────────────────────────────────────
describe('formaterare', () => {
  it('fmt ger sv-SE thousands separator', () => {
    expect(fmt(1234567)).toBe('1 234 567'); // non-breaking space
    expect(fmt(0)).toBe('0');
    expect(fmt(-500)).toBe('−500');
  });

  it('fmtEur prefixar € och tar absolutvärde', () => {
    expect(fmtEur(1500)).toBe('€1 500');
    expect(fmtEur(-1500)).toBe('€1 500');
    expect(fmtEur(0)).toBe('€0');
  });

  it('fmtPct använder decimaler', () => {
    expect(fmtPct(5.234)).toBe('5.2%');
    expect(fmtPct(5.234, 2)).toBe('5.23%');
    expect(fmtPct(0)).toBe('0.0%');
  });

  it('fmtSignEur lägger till + eller −', () => {
    expect(fmtSignEur(100)).toBe('+€100');
    expect(fmtSignEur(-100)).toBe('−€100');
    expect(fmtSignEur(0)).toBe('+€0');   // 0 räknas som positivt
  });
});

describe('display-valuta', () => {
  beforeEach(() => {
    setDisplayCurrency('EUR');
    setEurToSekRate(11.5);
  });

  it('default är EUR', () => {
    expect(getDisplayCurrency()).toBe('EUR');
    expect(fmtMoney(1000)).toBe('€1 000');
  });

  it('SEK-läge multiplicerar med rate', () => {
    setDisplayCurrency('SEK');
    expect(fmtMoney(1000)).toBe('11 500 kr');
  });

  it('fmtSignMoney respekterar tecken oavsett valuta', () => {
    setDisplayCurrency('SEK');
    expect(fmtSignMoney(100)).toBe('+1 150 kr');
    expect(fmtSignMoney(-100)).toBe('−1 150 kr');
  });

  it('setEurToSekRate uppdaterar omvandlingen', () => {
    setDisplayCurrency('SEK');
    setEurToSekRate(12);
    expect(fmtMoney(100)).toBe('1 200 kr');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Köpkostnader (spanska Andalusien)
// ─────────────────────────────────────────────────────────────────────────────
describe('calcBuyingCosts', () => {
  it('beräknar alla komponenter på 500 000 €', () => {
    const r = calcBuyingCosts(500_000);
    expect(r.transferTax).toBe(500_000 * BUYING_COSTS.TRANSFER_TAX_PCT);     // 7% = 35000
    expect(r.notary).toBe(500_000 * BUYING_COSTS.NOTARY_PCT);                 // 0.5% = 2500
    expect(r.landRegistry).toBe(500_000 * BUYING_COSTS.LAND_REGISTRY_PCT);    // 1% = 5000
    expect(r.lawyer).toBe(500_000 * BUYING_COSTS.LAWYER_PCT);                 // 1.5% = 7500
    expect(r.admin).toBe(BUYING_COSTS.ADMIN_FEE_EUR);                         // 500 fast
  });

  it('total summa = ~10% + 500 € fast på 500 000 €', () => {
    const r = calcBuyingCosts(500_000);
    expect(r.total).toBe(35_000 + 2_500 + 5_000 + 7_500 + 500);  // 50 500
  });

  it('skalar linjärt med pris (förutom admin fee)', () => {
    const a = calcBuyingCosts(500_000);
    const b = calcBuyingCosts(1_000_000);
    expect(b.transferTax).toBe(a.transferTax * 2);
    expect(b.admin).toBe(a.admin);   // fast
  });

  it('0 € → bara admin fee', () => {
    expect(calcBuyingCosts(0).total).toBe(BUYING_COSTS.ADMIN_FEE_EUR);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Investeringskalkyl
// ─────────────────────────────────────────────────────────────────────────────
describe('calcInvestment', () => {
  it('utan bolån: equity = pris + köpkostnader', () => {
    const r = calcInvestment({
      purchasePrice: 500_000, scenario: BASE_SCENARIO, horizonYears: 5,
      useMortgage: false, mortgagePct: 0, mortgageRate: 0,
    });
    expect(r.equity).toBe(500_000 + calcBuyingCosts(500_000).total);
  });

  it('med 60% bolån: equity = 40% av pris + köpkostnader', () => {
    const r = calcInvestment({
      purchasePrice: 500_000, scenario: BASE_SCENARIO, horizonYears: 5,
      useMortgage: true, mortgagePct: 60, mortgageRate: 0.045,
    });
    expect(r.equity).toBe(500_000 * 0.4 + calcBuyingCosts(500_000).total);
  });

  it('grossRent = nights × adr', () => {
    const r = calcInvestment({
      purchasePrice: 500_000, scenario: BASE_SCENARIO, horizonYears: 5,
      useMortgage: false, mortgagePct: 0, mortgageRate: 0,
    });
    expect(r.grossRent).toBe(180 * 150);  // 27000
  });

  it('IRNR-skatt 19% på netto före skatt (när positivt)', () => {
    const r = calcInvestment({
      purchasePrice: 500_000, scenario: BASE_SCENARIO, horizonYears: 5,
      useMortgage: false, mortgagePct: 0, mortgageRate: 0,
    });
    if (r.netBeforeTax > 0) {
      expect(r.tax).toBeCloseTo(r.netBeforeTax * TAX.IRNR_EU_PCT, 5);
    }
  });

  it('ingen skatt på negativt netto', () => {
    // Worst case scenario så netto blir negativt
    const r = calcInvestment({
      purchasePrice: 500_000,
      scenario: { ...BASE_SCENARIO, nights: 10, adr: 50 },  // ~500€ rent vs ~5000€ opex
      horizonYears: 5,
      useMortgage: true, mortgagePct: 80, mortgageRate: 0.06,
    });
    expect(r.netBeforeTax).toBeLessThan(0);
    expect(r.tax).toBe(0);
  });

  it('exit-pris växer med scenario.annualGrowthPct', () => {
    const r = calcInvestment({
      purchasePrice: 500_000, scenario: BASE_SCENARIO, horizonYears: 10,
      useMortgage: false, mortgagePct: 0, mortgageRate: 0,
    });
    expect(r.exitPrice).toBeCloseTo(500_000 * Math.pow(1.03, 10), 2);
  });

  it('capital gains-skatt 19% på vinst', () => {
    const r = calcInvestment({
      purchasePrice: 500_000, scenario: BASE_SCENARIO, horizonYears: 10,
      useMortgage: false, mortgagePct: 0, mortgageRate: 0,
    });
    expect(r.capitalGainsTax).toBeCloseTo(r.capitalGain * TAX.CAPITAL_GAINS_PCT, 5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Portfölj-KPI:er
// ─────────────────────────────────────────────────────────────────────────────
describe('calcPortfolioKPIs', () => {
  it('aggregerar invested och currentValue', () => {
    const r = calcPortfolioKPIs([
      { purchasePrice: 300_000, currentValue: 350_000 },
      { purchasePrice: 500_000, currentValue: 600_000 },
    ]);
    expect(r.totalInvested).toBe(800_000);
    expect(r.totalCurrentValue).toBe(950_000);
    expect(r.unrealizedGain).toBe(150_000);
  });

  it('tom portfölj → alla 0', () => {
    const r = calcPortfolioKPIs([]);
    expect(r).toEqual({ totalInvested: 0, totalCurrentValue: 0, unrealizedGain: 0 });
  });

  it('värdeminskning ger negativ unrealizedGain', () => {
    const r = calcPortfolioKPIs([{ purchasePrice: 500_000, currentValue: 400_000 }]);
    expect(r.unrealizedGain).toBe(-100_000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cashflow-projektion
// ─────────────────────────────────────────────────────────────────────────────
describe('calcProjection', () => {
  it('returnerar rätt antal år', () => {
    const r = calcProjection({
      purchasePrice: 500_000, startYear: 2025, horizonYears: 10,
      scenario: BASE_SCENARIO, useMortgage: false,
      mortgagePct: 0, mortgageRate: 0, amortizationPct: 0, inflationPct: 2,
    });
    expect(r).toHaveLength(10);
  });

  it('calendarYear ökar år för år', () => {
    const r = calcProjection({
      purchasePrice: 500_000, startYear: 2025, horizonYears: 3,
      scenario: BASE_SCENARIO, useMortgage: false,
      mortgagePct: 0, mortgageRate: 0, amortizationPct: 0, inflationPct: 2,
    });
    expect(r.map(y => y.calendarYear)).toEqual([2026, 2027, 2028]);
  });

  it('lånesaldo minskar med amortering varje år', () => {
    const r = calcProjection({
      purchasePrice: 500_000, startYear: 2025, horizonYears: 5,
      scenario: BASE_SCENARIO, useMortgage: true,
      mortgagePct: 60, mortgageRate: 0.04, amortizationPct: 2, inflationPct: 2,
    });
    const initialLoan = 500_000 * 0.6;
    const yearlyAmort = initialLoan * 0.02;
    expect(r[0].loanBalance).toBeCloseTo(initialLoan - yearlyAmort, 2);
    expect(r[1].loanBalance).toBeCloseTo(initialLoan - 2 * yearlyAmort, 2);
  });

  it('utan bolån är loanBalance 0 hela vägen', () => {
    const r = calcProjection({
      purchasePrice: 500_000, startYear: 2025, horizonYears: 5,
      scenario: BASE_SCENARIO, useMortgage: false,
      mortgagePct: 0, mortgageRate: 0, amortizationPct: 0, inflationPct: 2,
    });
    for (const y of r) expect(y.loanBalance).toBe(0);
  });

  it('cumulativeCashflow är monotont stigande när netAfterTax > 0', () => {
    const r = calcProjection({
      purchasePrice: 500_000, startYear: 2025, horizonYears: 5,
      scenario: BASE_SCENARIO, useMortgage: false,
      mortgagePct: 0, mortgageRate: 0, amortizationPct: 0, inflationPct: 2,
    });
    // base scenario ska generera positivt netto
    if (r[0].netAfterTax > 0) {
      for (let i = 1; i < r.length; i++) {
        expect(r[i].cumulativeCashflow).toBeGreaterThan(r[i - 1].cumulativeCashflow);
      }
    }
  });

  it('inflation: opex år 5 > opex år 1', () => {
    const r = calcProjection({
      purchasePrice: 500_000, startYear: 2025, horizonYears: 5,
      scenario: BASE_SCENARIO, useMortgage: false,
      mortgagePct: 0, mortgageRate: 0, amortizationPct: 0, inflationPct: 3,
    });
    expect(r[4].opex).toBeGreaterThan(r[0].opex);
  });

  it('rentGrowth är cappad enligt MORTGAGE_DEFAULTS.RENT_GROWTH_CAP_PCT', () => {
    // Ett scenario med 10% tillväxt — hyran ska ändå bara växa med max 5%
    const r = calcProjection({
      purchasePrice: 500_000, startYear: 2025, horizonYears: 3,
      scenario: { ...BASE_SCENARIO, annualGrowthPct: 10 },
      useMortgage: false,
      mortgagePct: 0, mortgageRate: 0, amortizationPct: 0, inflationPct: 0,
    });
    const baseGross = BASE_SCENARIO.nights * BASE_SCENARIO.adr;
    expect(r[0].grossRent).toBeCloseTo(baseGross * 1.0, 2);   // år 1 = i=0, ingen tillväxt än
    expect(r[1].grossRent).toBeCloseTo(baseGross * 1.05, 2);  // år 2 = 5% (cappad)
  });

  // Sanity-check: alla nyckelvärden ska vara siffror, inte NaN
  it('inga NaN-värden returneras', () => {
    const r = calcProjection({
      purchasePrice: 500_000, startYear: 2025, horizonYears: 30,
      scenario: BASE_SCENARIO, useMortgage: true,
      mortgagePct: 70, mortgageRate: 0.045, amortizationPct: 2, inflationPct: 2,
    });
    for (const y of r) {
      for (const k of Object.keys(y) as (keyof typeof y)[]) {
        expect(Number.isFinite(y[k] as number)).toBe(true);
      }
    }
  });
});

// Suppress unused-import warning for OPERATING
void OPERATING;
