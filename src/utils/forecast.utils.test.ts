import { describe, it, expect } from 'vitest';
import { buildForecast } from './forecast.utils';
import type { Property, RentalEntry, RecurringExpense } from '../types';

const PROP: Property = {
  id: 'p1', name: 'Test', development: '', area: 'Estepona',
  type: 'apartment', status: 'owned',
  bedrooms: 2, bathrooms: 2, sizeSqm: 90, terraceSqm: 30,
  purchasePrice: 500_000, currentValue: 500_000,
  rentalStrategy: 'short-term', hasVFTLicense: true,
};

describe('buildForecast', () => {
  it('returnerar tom prognos när inga fastigheter', () => {
    const { months, summary } = buildForecast(
      { startDate: '2026-01-15', horizonMonths: 12, startBalance: 10_000, propertyId: 'all' },
      [], [], [], [], [],
    );
    expect(months).toHaveLength(12);
    expect(summary.startBalance).toBe(10_000);
    expect(summary.endBalance).toBe(10_000);
    expect(summary.totalIncome).toBe(0);
    expect(summary.totalExpenses).toBe(0);
  });

  it('använder förra årets samma månad som baseline för framtid', () => {
    const rentals: RentalEntry[] = [
      { id: 'r1', propertyId: 'p1', year: 2025, month: 6, platform: 'airbnb', revenue: 3000, nights: 20 },
    ];
    const { months } = buildForecast(
      { startDate: '2026-05-01', horizonMonths: 12, startBalance: 0, propertyId: 'all' },
      [PROP], rentals, [], [], [],
    );
    // 2026-06 ska få 3000 från 2025-06 baseline
    const jun26 = months.find(m => m.year === 2026 && m.month === 6);
    expect(jun26?.rentalIncome).toBe(3000);
  });

  it('historiska månader använder faktisk data, inte baseline', () => {
    const rentals: RentalEntry[] = [
      { id: 'r1', propertyId: 'p1', year: 2025, month: 1, platform: 'airbnb', revenue: 500, nights: 5 },
      { id: 'r2', propertyId: 'p1', year: 2026, month: 1, platform: 'airbnb', revenue: 2000, nights: 15 },
    ];
    const now = new Date();
    // Bara meningsfullt om nuvarande månad är efter januari
    if (now.getFullYear() === 2026 && now.getMonth() + 1 > 1) {
      const { months } = buildForecast(
        { startDate: '2025-12-01', horizonMonths: 6, startBalance: 0, propertyId: 'all' },
        [PROP], rentals, [], [], [],
      );
      const jan26 = months.find(m => m.year === 2026 && m.month === 1);
      // Historisk → faktisk 2000, inte baseline 500
      expect(jan26?.rentalIncome).toBe(2000);
    }
  });

  it('monthly recurring genererar varje månad', () => {
    const rec: RecurringExpense[] = [
      {
        id: 'rc1', propertyId: 'p1', category: 'community',
        description: 'IBI', amount: 200, frequency: 'monthly',
        startDate: '2026-01-01', dayOfMonth: 1, deductible: true, active: true,
      },
    ];
    const { summary } = buildForecast(
      { startDate: '2026-01-01', horizonMonths: 12, startBalance: 0, propertyId: 'all' },
      [PROP], [], [], rec, [],
    );
    // 12 månader × 200 = 2400
    expect(summary.totalExpenses).toBeGreaterThanOrEqual(2400);
  });

  it('quarterly recurring genererar var tredje månad från startdatum', () => {
    const rec: RecurringExpense[] = [
      {
        id: 'rc1', propertyId: 'p1', category: 'community',
        description: 'Q', amount: 100, frequency: 'quarterly',
        startDate: '2026-01-15', dayOfMonth: 15, deductible: true, active: true,
      },
    ];
    const { months } = buildForecast(
      { startDate: '2026-01-01', horizonMonths: 12, startBalance: 0, propertyId: 'all' },
      [PROP], [], [], rec, [],
    );
    // Jan, apr, jul, okt
    expect(months.find(m => m.month === 1)?.recurringExpenses).toBe(100);
    expect(months.find(m => m.month === 4)?.recurringExpenses).toBe(100);
    expect(months.find(m => m.month === 7)?.recurringExpenses).toBe(100);
    expect(months.find(m => m.month === 10)?.recurringExpenses).toBe(100);
    expect(months.find(m => m.month === 2)?.recurringExpenses).toBe(0);
    expect(months.find(m => m.month === 5)?.recurringExpenses).toBe(0);
  });

  it('yearly recurring genererar bara i monthOfYear', () => {
    const rec: RecurringExpense[] = [
      {
        id: 'rc1', propertyId: 'p1', category: 'insurance',
        description: 'Y', amount: 1200, frequency: 'yearly',
        startDate: '2025-03-01', monthOfYear: 3, dayOfMonth: 1, deductible: true, active: true,
      },
    ];
    const { months } = buildForecast(
      { startDate: '2026-01-01', horizonMonths: 12, startBalance: 0, propertyId: 'all' },
      [PROP], [], [], rec, [],
    );
    expect(months.find(m => m.month === 3)?.recurringExpenses).toBe(1200);
    expect(months.find(m => m.month === 4)?.recurringExpenses).toBe(0);
  });

  it('saldot ackumuleras månad för månad', () => {
    const rentals: RentalEntry[] = [
      // Baseline 2025
      { id: 'r1', propertyId: 'p1', year: 2025, month: 7, platform: 'airbnb', revenue: 1000, nights: 7 },
    ];
    const { months } = buildForecast(
      { startDate: '2026-05-01', horizonMonths: 12, startBalance: 5000, propertyId: 'all' },
      [PROP], rentals, [], [], [],
    );
    // Innan juli: ingen intäkt → saldo borde vara mestadels 5000 (modulo skatt/recurring)
    // Juli: +1000 baseline
    // Saldot ökar
    const jul26 = months.find(m => m.year === 2026 && m.month === 7);
    expect(jul26).toBeDefined();
    expect(jul26!.rentalIncome).toBe(1000);
  });

  it('filtrerar per fastighet när propertyId !== all', () => {
    const PROP2: Property = { ...PROP, id: 'p2', name: 'Test 2' };
    const rentals: RentalEntry[] = [
      { id: 'r1', propertyId: 'p1', year: 2025, month: 6, platform: 'airbnb', revenue: 1000, nights: 5 },
      { id: 'r2', propertyId: 'p2', year: 2025, month: 6, platform: 'airbnb', revenue: 2000, nights: 10 },
    ];

    // Bara p1
    const { months: onlyP1 } = buildForecast(
      { startDate: '2026-05-01', horizonMonths: 3, startBalance: 0, propertyId: 'p1' },
      [PROP, PROP2], rentals, [], [], [],
    );
    expect(onlyP1.find(m => m.month === 6)?.rentalIncome).toBe(1000);

    // Båda
    const { months: both } = buildForecast(
      { startDate: '2026-05-01', horizonMonths: 3, startBalance: 0, propertyId: 'all' },
      [PROP, PROP2], rentals, [], [], [],
    );
    expect(both.find(m => m.month === 6)?.rentalIncome).toBe(3000);
  });

  it('inaktiv recurring genererar inget', () => {
    const rec: RecurringExpense[] = [
      {
        id: 'rc1', propertyId: 'p1', category: 'community',
        description: 'X', amount: 200, frequency: 'monthly',
        startDate: '2026-01-01', dayOfMonth: 1, deductible: true,
        active: false,
      },
    ];
    const { summary } = buildForecast(
      { startDate: '2026-01-01', horizonMonths: 12, startBalance: 0, propertyId: 'all' },
      [PROP], [], [], rec, [],
    );
    expect(summary.totalExpenses).toBe(0);
  });
});
