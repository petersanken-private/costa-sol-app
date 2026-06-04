import { describe, it, expect } from 'vitest';
import { prospectToProperty } from './prospect.utils';
import type { ProspectProperty } from '../types';

const prospect: ProspectProperty = {
  id: 'pro-1',
  name: 'Apt 4B Cancelada',
  area: 'Cancelada',
  type: 'apartment',
  bedrooms: 2,
  sizeSqm: 93,
  terraceSqm: 35,
  purchasePrice: 780000,
  development: 'Essence Residences',
  notes: 'Söderläge',
};

describe('prospectToProperty', () => {
  it('mappar överlappande fält rakt av', () => {
    const prop = prospectToProperty(prospect, { id: 'prop-1', status: 'owned' });
    expect(prop.id).toBe('prop-1');
    expect(prop.name).toBe('Apt 4B Cancelada');
    expect(prop.area).toBe('Cancelada');
    expect(prop.type).toBe('apartment');
    expect(prop.bedrooms).toBe(2);
    expect(prop.sizeSqm).toBe(93);
    expect(prop.terraceSqm).toBe(35);
    expect(prop.purchasePrice).toBe(780000);
    expect(prop.development).toBe('Essence Residences');
    expect(prop.notes).toBe('Söderläge');
  });

  it('sätter rimliga defaults för fält prospekt saknar', () => {
    const prop = prospectToProperty(prospect, { id: 'prop-1', status: 'under-contract' });
    expect(prop.status).toBe('under-contract');
    expect(prop.currentValue).toBe(prospect.purchasePrice); // = köpeskilling
    expect(prop.bathrooms).toBe(0);
    expect(prop.rentalStrategy).toBe('short-term');
    expect(prop.hasVFTLicense).toBe(false);
  });

  it('tar med tillträdesdatum när det anges', () => {
    const prop = prospectToProperty(prospect, { id: 'p', status: 'owned', purchaseDate: '2026-09-01' });
    expect(prop.purchaseDate).toBe('2026-09-01');
  });

  it('hanterar prospekt utan development utan att lämna undefined', () => {
    const bare = { ...prospect, development: undefined };
    expect(prospectToProperty(bare, { id: 'p', status: 'owned' }).development).toBe('');
  });
});
