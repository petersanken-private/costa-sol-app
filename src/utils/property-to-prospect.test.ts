import { describe, it, expect } from 'vitest';
import { propertyToProspect } from './prospect.utils';
import type { Property } from '../types';

const property: Property = {
  id: 'prop-1',
  name: 'Villa Bevakad',
  development: 'Los Flamingos',
  area: 'Benahavís',
  type: 'villa',
  status: 'watchlist',
  bedrooms: 4,
  bathrooms: 3,
  sizeSqm: 220,
  terraceSqm: 80,
  purchasePrice: 1450000,
  currentValue: 1500000,
  rentalStrategy: 'short-term',
  hasVFTLicense: true,
  notes: 'Drömläge',
};

describe('propertyToProspect', () => {
  it('mappar gemensamma fält till prospekt-form', () => {
    const pr = propertyToProspect(property);
    expect(pr.id).toBe('prop-1');
    expect(pr.name).toBe('Villa Bevakad');
    expect(pr.area).toBe('Benahavís');
    expect(pr.type).toBe('villa');
    expect(pr.bedrooms).toBe(4);
    expect(pr.sizeSqm).toBe(220);
    expect(pr.terraceSqm).toBe(80);
    expect(pr.purchasePrice).toBe(1450000);
    expect(pr.development).toBe('Los Flamingos');
    expect(pr.notes).toBe('Drömläge');
  });

  it('gör tom development till undefined (prospekt-fältet är valfritt)', () => {
    expect(propertyToProspect({ ...property, development: '' }).development).toBeUndefined();
  });

  it('behåller objektets id så källan kan spåras', () => {
    expect(propertyToProspect(property).id).toBe(property.id);
  });
});
