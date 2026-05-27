// ── Hjälpfunktioner för Property-formulär ────────────────────────────────────
//
// Konvertering mellan Property-typen och formulärstate i PropertyModal.
// Extraherade rena funktioner gör dem enkla att enhetstesta.

import type { Property } from '../types';

export interface PropertyFormState {
  name:           string;
  development:    string;
  area:           string;
  type:           Property['type'];
  status:         Property['status'];
  bedrooms:       string;
  bathrooms:      string;
  sizeSqm:        string;
  terraceSqm:     string;
  purchasePrice:  string;
  currentValue:   string;
  completionDate: string;
  rentalStrategy: Property['rentalStrategy'];
  hasVFTLicense:  boolean;
  notes:          string;
}

export function propertyToFormState(p?: Property): PropertyFormState {
  if (!p) {
    return {
      name: '', development: '', area: 'Cancelada',
      type: 'apartment', status: 'watchlist',
      bedrooms: '2', bathrooms: '2',
      sizeSqm: '90', terraceSqm: '30',
      purchasePrice: '', currentValue: '',
      completionDate: '',
      rentalStrategy: 'short-term',
      hasVFTLicense: false, notes: '',
    };
  }
  return {
    name:           p.name,
    development:    p.development,
    area:           p.area,
    type:           p.type,
    status:         p.status,
    bedrooms:       String(p.bedrooms),
    bathrooms:      String(p.bathrooms),
    sizeSqm:        String(p.sizeSqm),
    terraceSqm:     String(p.terraceSqm),
    purchasePrice:  String(p.purchasePrice),
    currentValue:   String(p.currentValue),
    completionDate: p.completionDate ?? '',
    rentalStrategy: p.rentalStrategy,
    hasVFTLicense:  p.hasVFTLicense,
    notes:          p.notes ?? '',
  };
}

export function formStateToProperty(f: PropertyFormState, existing?: Property): Property {
  const purchasePrice = parseInt(f.purchasePrice.replace(/\D/g, ''), 10);
  const currentValue  = f.currentValue
    ? parseInt(f.currentValue.replace(/\D/g, ''), 10)
    : purchasePrice;

  return {
    id:             existing?.id ?? `prop-${Date.now()}`,
    name:           f.name.trim(),
    development:    f.development.trim(),
    area:           f.area.trim(),
    type:           f.type,
    status:         f.status,
    bedrooms:       parseInt(f.bedrooms, 10),
    bathrooms:      parseInt(f.bathrooms, 10),
    sizeSqm:        parseInt(f.sizeSqm, 10),
    terraceSqm:     parseInt(f.terraceSqm, 10),
    purchasePrice,
    currentValue,
    completionDate: f.completionDate || undefined,
    rentalStrategy: f.rentalStrategy,
    hasVFTLicense:  f.hasVFTLicense,
    notes:          f.notes.trim() || undefined,
  };
}
