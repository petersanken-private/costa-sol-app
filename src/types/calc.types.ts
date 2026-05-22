// ─────────────────────────────────────────────────────────────────────────────
// Investeringskalkyl — scenarier, resultat och unit-presets.
// ─────────────────────────────────────────────────────────────────────────────

export type ScenarioKey = 'conservative' | 'base' | 'optimistic';

export interface ScenarioConfig {
  key:              ScenarioKey;
  label:            string;
  nights:           number;
  adr:              number;
  annualGrowthPct:  number;
  color:            string;
}

export interface CalcResult {
  grossRent:        number;
  managementFee:    number;
  cleaningCost:     number;
  fixedCosts:       number;
  mortgageCost:     number;
  totalOpex:        number;
  netBeforeTax:     number;
  tax:              number;
  netAfterTax:      number;
  grossYield:       number;
  netYield:         number;
  equity:           number;
  exitPrice:        number;
  capitalGain:      number;
  capitalGainsTax:  number;
  saleProfit:       number;
  cumulativeRent:   number;
  totalReturn:      number;
  annualizedReturn: number;
}

export interface UnitPreset {
  id:           string;
  label:        string;
  bedrooms:     number;
  sizeSqm:      number;
  terraceSqm:   number;
  purchasePrice: number;
}
