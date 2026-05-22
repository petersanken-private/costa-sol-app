// ─────────────────────────────────────────────────────────────────────────────
// Marknadsdata per område + prospekt under övervägande.
// ─────────────────────────────────────────────────────────────────────────────

import type { PropertyType } from './database.types';

export interface AreaMarketData {
  id:              string;
  area:            string;        // t.ex. "Cancelada", "Estepona Gamla Stan"
  pricePerSqm:     number;        // €/kvm
  avgAdr:          number;        // Snitt-ADR €/natt
  occupancyPct:    number;        // Beläggning % (0-100)
  annualGrowthPct: number;        // Historisk prisutveckling %/år
  source:          string;        // "Idealista mars 2025"
  updatedAt:       string;        // ISO date
  notes?:          string;
}

export interface ProspectProperty {
  id:            string;
  name:          string;
  area:          string;
  type:          PropertyType;
  bedrooms:      number;
  sizeSqm:       number;
  terraceSqm:    number;
  purchasePrice: number;
  floor?:        string;
  development?:  string;
  link?:         string;          // Idealista-länk
  notes?:        string;
}
