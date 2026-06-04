import { describe, it, expect } from 'vitest';
import { actualUsage, trailing12mRentals, deriveActualScenario } from './portfolio-calc.utils';
import type { Property, RentalEntry } from '../types/database.types';
import type { ScenarioConfig } from '../types';

const baseScenario: ScenarioConfig = {
  key: 'base', label: 'Realistisk', nights: 220, adr: 210, annualGrowthPct: 7, color: '#D4AA50',
};

const property = { id: 'p1', name: 'Villa' } as Property;

const rental = (over: Partial<RentalEntry>): RentalEntry => ({
  id: Math.random().toString(), propertyId: 'p1', year: 2025, month: 1,
  nights: 0, revenue: 0, platform: 'airbnb', ...over,
});

describe('actualUsage', () => {
  it('summerar nätter och intäkt och härleder ADR', () => {
    const rentals = [
      rental({ year: 2025, month: 1, nights: 10, revenue: 2000 }),
      rental({ year: 2025, month: 2, nights: 5,  revenue: 1500 }),
    ];
    const u = actualUsage(rentals, 'p1');
    expect(u.nights).toBe(15);
    expect(u.revenue).toBe(3500);
    expect(u.adr).toBeCloseTo(3500 / 15);
    expect(u.months).toBe(2);
  });

  it('ger 0 ADR utan nätter (undviker division med noll)', () => {
    expect(actualUsage([rental({ nights: 0, revenue: 0 })], 'p1').adr).toBe(0);
  });

  it('ignorerar andra objekts uthyrningar', () => {
    const rentals = [
      rental({ propertyId: 'p1', nights: 10, revenue: 1000 }),
      rental({ propertyId: 'p2', nights: 99, revenue: 9999 }),
    ];
    expect(actualUsage(rentals, 'p1').nights).toBe(10);
  });
});

describe('trailing12mRentals', () => {
  it('tar bara med de senaste 12 månaderna räknat från senaste datapunkt', () => {
    const rentals = [
      rental({ year: 2023, month: 6, nights: 5 }),  // > 12 mån före senaste → exkluderas
      rental({ year: 2024, month: 7, nights: 5 }),  // exakt 12 mån (inkl) → tas med
      rental({ year: 2025, month: 6, nights: 5 }),  // senaste
    ];
    const w = trailing12mRentals(rentals, 'p1');
    expect(w).toHaveLength(2);
    expect(w.every(r => r.year >= 2024)).toBe(true);
  });
});

describe('deriveActualScenario', () => {
  it('bygger Faktisk-scenario med verkliga nätter men ärvd tillväxt', () => {
    const rentals = [rental({ nights: 200, revenue: 50000 })];
    const res = deriveActualScenario(property, rentals, baseScenario)!;
    expect(res.scenario.label).toBe('Faktisk');
    expect(res.scenario.nights).toBe(200);
    expect(res.scenario.adr).toBeCloseTo(250);
    expect(res.scenario.annualGrowthPct).toBe(7);   // ärvd från base
    expect(res.scenario.nights * res.scenario.adr).toBeCloseTo(50000); // grossRent = faktisk intäkt
  });

  it('returnerar null när objektet saknar uthyrda nätter', () => {
    expect(deriveActualScenario(property, [], baseScenario)).toBeNull();
    expect(deriveActualScenario(property, [rental({ nights: 0 })], baseScenario)).toBeNull();
  });
});
