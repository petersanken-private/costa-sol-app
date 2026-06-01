import { describe, it, expect } from 'vitest';
import {
  effectiveOwners, shareOf, listAllOwners, calcOwnerPnL,
  calcAllOwnerPnLs, validateOwners, hasCoOwnership, DEFAULT_OWNER,
} from './owner.utils';
import type { Property, RentalEntry, Expense } from '../types';

const baseProp: Omit<Property, 'id' | 'name' | 'purchasePrice' | 'currentValue' | 'owners'> = {
  development: '', area: 'Estepona',
  type: 'apartment', status: 'owned',
  bedrooms: 2, bathrooms: 2, sizeSqm: 90, terraceSqm: 30,
  rentalStrategy: 'short-term', hasVFTLicense: true,
};

describe('effectiveOwners', () => {
  it('returnerar default-owner för fastighet utan owners', () => {
    const p: Property = { ...baseProp, id: 'p1', name: 'X', purchasePrice: 500_000, currentValue: 500_000 };
    expect(effectiveOwners(p)).toEqual([{ name: DEFAULT_OWNER, sharePct: 100 }]);
  });

  it('returnerar default-owner för tom owners-array', () => {
    const p: Property = { ...baseProp, id: 'p1', name: 'X', purchasePrice: 500_000, currentValue: 500_000, owners: [] };
    expect(effectiveOwners(p)).toEqual([{ name: DEFAULT_OWNER, sharePct: 100 }]);
  });

  it('returnerar explicit owners när de finns', () => {
    const p: Property = {
      ...baseProp, id: 'p1', name: 'X', purchasePrice: 500_000, currentValue: 500_000,
      owners: [{ name: 'A', sharePct: 60 }, { name: 'B', sharePct: 40 }],
    };
    expect(effectiveOwners(p)).toHaveLength(2);
  });
});

describe('shareOf', () => {
  const p: Property = {
    ...baseProp, id: 'p1', name: 'X', purchasePrice: 500_000, currentValue: 500_000,
    owners: [{ name: 'A', sharePct: 90 }, { name: 'B', sharePct: 10 }],
  };

  it('returnerar rätt andel som decimal', () => {
    expect(shareOf(p, 'A')).toBe(0.9);
    expect(shareOf(p, 'B')).toBe(0.1);
  });

  it('returnerar 0 för icke-delägare', () => {
    expect(shareOf(p, 'C')).toBe(0);
  });
});

describe('listAllOwners', () => {
  it('returnerar unika ägare över alla fastigheter, sorterat', () => {
    const props: Property[] = [
      { ...baseProp, id: 'p1', name: 'X', purchasePrice: 1, currentValue: 1, owners: [{ name: 'Peter', sharePct: 100 }] },
      { ...baseProp, id: 'p2', name: 'Y', purchasePrice: 1, currentValue: 1, owners: [{ name: 'Anna', sharePct: 50 }, { name: 'Peter', sharePct: 50 }] },
    ];
    expect(listAllOwners(props)).toEqual(['Anna', 'Peter']);
  });

  it('default-owner används när fastighet saknar owners', () => {
    const props: Property[] = [
      { ...baseProp, id: 'p1', name: 'X', purchasePrice: 1, currentValue: 1 },
    ];
    expect(listAllOwners(props)).toEqual([DEFAULT_OWNER]);
  });
});

describe('calcOwnerPnL', () => {
  it('splittar investerat värde proportionellt', () => {
    const p: Property = {
      ...baseProp, id: 'p1', name: 'X', purchasePrice: 1_000_000, currentValue: 1_200_000,
      owners: [{ name: 'A', sharePct: 70 }, { name: 'B', sharePct: 30 }],
    };
    const a = calcOwnerPnL('A', [p], [], [], 2026);
    const b = calcOwnerPnL('B', [p], [], [], 2026);

    expect(a.totalInvested).toBe(700_000);
    expect(b.totalInvested).toBe(300_000);
    expect(a.totalCurrentValue).toBe(840_000);
    expect(b.totalCurrentValue).toBe(360_000);
    expect(a.unrealizedGain).toBe(140_000);
    expect(b.unrealizedGain).toBe(60_000);
  });

  it('splittar hyresintäkter och avdragsgilla utgifter', () => {
    const p: Property = {
      ...baseProp, id: 'p1', name: 'X', purchasePrice: 1, currentValue: 1,
      owners: [{ name: 'A', sharePct: 50 }, { name: 'B', sharePct: 50 }],
    };
    const rentals: RentalEntry[] = [
      { id: 'r1', propertyId: 'p1', year: 2026, month: 6, nights: 10, revenue: 2000, platform: 'airbnb' },
    ];
    const expenses: Expense[] = [
      { id: 'e1', propertyId: 'p1', date: '2026-06-15', category: 'community', amount: 400, description: 'IBI', deductible: true },
    ];
    const a = calcOwnerPnL('A', [p], rentals, expenses, 2026);
    expect(a.grossRentalIncome).toBe(1000);
    expect(a.deductibleExpenses).toBe(200);
    expect(a.netBeforeTax).toBe(800);
    expect(a.estimatedTax).toBeCloseTo(800 * 0.19, 5);
  });

  it('returnerar noll för ägare som inte äger något', () => {
    const p: Property = {
      ...baseProp, id: 'p1', name: 'X', purchasePrice: 100, currentValue: 100,
      owners: [{ name: 'A', sharePct: 100 }],
    };
    const c = calcOwnerPnL('C', [p], [], [], 2026);
    expect(c.totalInvested).toBe(0);
    expect(c.propertyCount).toBe(0);
  });

  it('räknar propertyCount för delägda fastigheter', () => {
    const props: Property[] = [
      { ...baseProp, id: 'p1', name: 'X', purchasePrice: 100, currentValue: 100, owners: [{ name: 'A', sharePct: 50 }, { name: 'B', sharePct: 50 }] },
      { ...baseProp, id: 'p2', name: 'Y', purchasePrice: 100, currentValue: 100, owners: [{ name: 'A', sharePct: 100 }] },
    ];
    expect(calcOwnerPnL('A', props, [], [], 2026).propertyCount).toBe(2);
    expect(calcOwnerPnL('B', props, [], [], 2026).propertyCount).toBe(1);
  });

  it('filtrerar på rätt år', () => {
    const p: Property = {
      ...baseProp, id: 'p1', name: 'X', purchasePrice: 1, currentValue: 1,
      owners: [{ name: 'A', sharePct: 100 }],
    };
    const rentals: RentalEntry[] = [
      { id: 'r1', propertyId: 'p1', year: 2025, month: 6, nights: 10, revenue: 5000, platform: 'airbnb' },
      { id: 'r2', propertyId: 'p1', year: 2026, month: 6, nights: 10, revenue: 3000, platform: 'airbnb' },
    ];
    expect(calcOwnerPnL('A', [p], rentals, [], 2026).grossRentalIncome).toBe(3000);
    expect(calcOwnerPnL('A', [p], rentals, [], 2025).grossRentalIncome).toBe(5000);
  });
});

describe('calcAllOwnerPnLs', () => {
  it('returnerar PnL för alla unika ägare', () => {
    const props: Property[] = [
      { ...baseProp, id: 'p1', name: 'X', purchasePrice: 100, currentValue: 100, owners: [{ name: 'A', sharePct: 60 }, { name: 'B', sharePct: 40 }] },
    ];
    const all = calcAllOwnerPnLs(props, [], [], 2026);
    expect(all).toHaveLength(2);
    expect(all.find(p => p.ownerName === 'A')?.totalInvested).toBe(60);
    expect(all.find(p => p.ownerName === 'B')?.totalInvested).toBe(40);
  });
});

describe('validateOwners', () => {
  it('tom array är OK (single owner default)', () => {
    expect(validateOwners([])).toBeNull();
  });

  it('summan måste vara 100%', () => {
    expect(validateOwners([{ name: 'A', sharePct: 50 }])).toMatch(/100%/);
    expect(validateOwners([{ name: 'A', sharePct: 60 }, { name: 'B', sharePct: 30 }])).toMatch(/100%/);
    expect(validateOwners([{ name: 'A', sharePct: 90 }, { name: 'B', sharePct: 10 }])).toBeNull();
  });

  it('kräver unika namn', () => {
    expect(validateOwners([{ name: 'A', sharePct: 50 }, { name: 'A', sharePct: 50 }])).toMatch(/unik/);
  });

  it('kräver icke-tomma namn', () => {
    expect(validateOwners([{ name: '', sharePct: 50 }, { name: 'B', sharePct: 50 }])).toMatch(/namn/);
  });

  it('andelar måste vara > 0 och <= 100', () => {
    expect(validateOwners([{ name: 'A', sharePct: 0 }, { name: 'B', sharePct: 100 }])).toMatch(/mellan/);
    expect(validateOwners([{ name: 'A', sharePct: -10 }, { name: 'B', sharePct: 110 }])).toMatch(/mellan|100%/);
  });
});

describe('hasCoOwnership', () => {
  it('false för portfölj med bara single-owner-fastigheter', () => {
    const props: Property[] = [
      { ...baseProp, id: 'p1', name: 'X', purchasePrice: 1, currentValue: 1 },
      { ...baseProp, id: 'p2', name: 'Y', purchasePrice: 1, currentValue: 1, owners: [{ name: 'A', sharePct: 100 }] },
    ];
    expect(hasCoOwnership(props)).toBe(false);
  });

  it('true om någon fastighet har 2+ ägare', () => {
    const props: Property[] = [
      { ...baseProp, id: 'p1', name: 'X', purchasePrice: 1, currentValue: 1 },
      { ...baseProp, id: 'p2', name: 'Y', purchasePrice: 1, currentValue: 1, owners: [{ name: 'A', sharePct: 50 }, { name: 'B', sharePct: 50 }] },
    ];
    expect(hasCoOwnership(props)).toBe(true);
  });
});
