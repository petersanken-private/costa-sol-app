import { describe, it, expect } from 'vitest';
import {
  rateForDate,
  buildAmortizationSchedule,
  summarizeByYear,
  currentBalance,
  totalInterestPaid,
  amortizationLabel,
} from './mortgage.utils';
import { Mortgage, MortgageRatePeriod } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────
function mkMortgage(overrides: Partial<Mortgage> = {}): Mortgage {
  return {
    id:               'm-1',
    propertyId:       'p-1',
    bankName:         'Banco Test',
    originalAmount:   300_000,
    startDate:        '2025-01-01',
    termYears:        25,
    amortizationType: 'annuity',
    ...overrides,
  };
}

function mkPeriod(start: string, rate: number, end?: string): MortgageRatePeriod {
  return {
    id:         `per-${start}`,
    mortgageId: 'm-1',
    startDate:  start,
    endDate:    end,
    ratePct:    rate,
    rateType:   'fixed',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// rateForDate
// ─────────────────────────────────────────────────────────────────────────────
describe('rateForDate', () => {
  it('fallbackar till 4.5% när inga perioder finns', () => {
    expect(rateForDate([], '2025-06-01')).toBe(4.5);
  });

  it('plockar enda matchande perioden', () => {
    const periods = [mkPeriod('2025-01-01', 3.5)];
    expect(rateForDate(periods, '2025-06-01')).toBe(3.5);
  });

  it('plockar senaste gällande perioden vid flera', () => {
    const periods = [
      mkPeriod('2025-01-01', 3.5, '2025-06-30'),
      mkPeriod('2025-07-01', 4.2),
    ];
    expect(rateForDate(periods, '2025-08-01')).toBe(4.2);
    expect(rateForDate(periods, '2025-03-01')).toBe(3.5);
  });

  it('hanterar oordnade input-perioder', () => {
    const periods = [
      mkPeriod('2025-07-01', 4.2),
      mkPeriod('2025-01-01', 3.5, '2025-06-30'),
    ];
    expect(rateForDate(periods, '2025-08-01')).toBe(4.2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildAmortizationSchedule
// ─────────────────────────────────────────────────────────────────────────────
describe('buildAmortizationSchedule', () => {
  const periods = [mkPeriod('2025-01-01', 4.5)];

  it('annuitet: konstant betalning, balansen går till 0', () => {
    const schedule = buildAmortizationSchedule(mkMortgage({ termYears: 5 }), periods);
    expect(schedule).toHaveLength(60);  // 5 år × 12 mån
    const payments = schedule.map(r => r.payment);
    // Alla betalningar bör vara ungefär lika (annuitet)
    const first = payments[0];
    const middle = payments[30];
    expect(middle).toBeCloseTo(first, 0);  // €-precision
    // Slutsaldot ska vara 0 (eller mycket nära)
    expect(schedule[schedule.length - 1].closingBalance).toBeLessThan(1);
  });

  it('linjär: amortering konstant, betalning minskar över tid', () => {
    const schedule = buildAmortizationSchedule(
      mkMortgage({ termYears: 5, amortizationType: 'linear' }),
      periods,
    );
    const linearAmort = 300_000 / 60;
    // Första 50 amortering konstant
    for (let i = 0; i < 50; i++) {
      expect(schedule[i].amortization).toBeCloseTo(linearAmort, 2);
    }
    // Total betalning ska minska monotont (ränta minskar när balansen sjunker)
    expect(schedule[0].payment).toBeGreaterThan(schedule[30].payment);
    expect(schedule[30].payment).toBeGreaterThan(schedule[55].payment);
  });

  it('interest_only: ingen amortering, saldot oförändrat', () => {
    const schedule = buildAmortizationSchedule(
      mkMortgage({ termYears: 5, amortizationType: 'interest_only' }),
      periods,
    );
    for (const row of schedule) {
      expect(row.amortization).toBe(0);
      expect(row.closingBalance).toBe(300_000);
      expect(row.payment).toBeCloseTo(row.interest, 5);
    }
  });

  it('räntebyte mitt i schemat ger ny ratePct', () => {
    const periods2 = [
      mkPeriod('2025-01-01', 3.0, '2025-12-31'),
      mkPeriod('2026-01-01', 5.0),
    ];
    const schedule = buildAmortizationSchedule(mkMortgage({ termYears: 5 }), periods2);
    expect(schedule[0].ratePct).toBe(3.0);    // jan 2025
    expect(schedule[11].ratePct).toBe(3.0);   // dec 2025
    expect(schedule[12].ratePct).toBe(5.0);   // jan 2026
  });

  it('0% ränta: månadsbetalning = principal/months (annuitet)', () => {
    const schedule = buildAmortizationSchedule(
      mkMortgage({ termYears: 5 }),
      [mkPeriod('2025-01-01', 0)],
    );
    expect(schedule[0].payment).toBeCloseTo(300_000 / 60, 2);
    expect(schedule[0].interest).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// summarizeByYear
// ─────────────────────────────────────────────────────────────────────────────
describe('summarizeByYear', () => {
  it('grupperar 12 månader per år', () => {
    const periods = [mkPeriod('2025-01-01', 4.5)];
    const schedule = buildAmortizationSchedule(mkMortgage({ termYears: 3 }), periods);
    const yearly = summarizeByYear(schedule);
    expect(yearly).toHaveLength(3);
    // Summa ränta per år ska matcha summan av månadernas ränta
    for (const y of yearly) {
      const monthsInYear = schedule.filter(r => r.date.startsWith(String(y.year)));
      const sumInterest = monthsInYear.reduce((s, r) => s + r.interest, 0);
      expect(y.totalInterest).toBeCloseTo(sumInterest, 2);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// currentBalance
// ─────────────────────────────────────────────────────────────────────────────
describe('currentBalance', () => {
  const periods = [mkPeriod('2025-01-01', 4.5)];

  it('returnerar openingBalance (≈original) för datum före startDate', () => {
    const schedule = buildAmortizationSchedule(mkMortgage(), periods);
    expect(currentBalance(schedule, '2024-12-01')).toBe(300_000);
  });

  it('returnerar 0 (eller nära 0) efter sista månaden', () => {
    const schedule = buildAmortizationSchedule(mkMortgage({ termYears: 5 }), periods);
    const bal = currentBalance(schedule, '2030-12-01');
    expect(bal).toBeLessThan(1);
  });

  it('returnerar mellansaldo mitt i löptiden', () => {
    const schedule = buildAmortizationSchedule(mkMortgage({ termYears: 10 }), periods);
    const bal = currentBalance(schedule, '2030-01'); // halvvägs (YYYY-MM)
    expect(bal).toBeGreaterThan(0);
    expect(bal).toBeLessThan(300_000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// totalInterestPaid
// ─────────────────────────────────────────────────────────────────────────────
describe('totalInterestPaid', () => {
  it('summerar all betald ränta', () => {
    const periods = [mkPeriod('2025-01-01', 5)];
    const schedule = buildAmortizationSchedule(mkMortgage({ termYears: 25 }), periods);
    const total = totalInterestPaid(schedule);
    // På 25 år med 5% ränta + annuitet ska total ränta vara betydande
    expect(total).toBeGreaterThan(100_000);
    expect(total).toBeLessThan(300_000);  // mindre än kapitalbeloppet
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// amortizationLabel
// ─────────────────────────────────────────────────────────────────────────────
describe('amortizationLabel', () => {
  it('översätter alla typer till svenska', () => {
    expect(amortizationLabel('annuity')).toMatch(/annuitet/i);
    expect(amortizationLabel('linear')).toMatch(/linjär|rak/i);
    expect(amortizationLabel('interest_only')).toMatch(/endast ränta|interest|ränt/i);
  });
});
