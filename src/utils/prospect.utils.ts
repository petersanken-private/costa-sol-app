import { ProspectProperty, AreaMarketData, ScenarioConfig, CalcResult } from '../types';
import {
  calcInvestment, calcProjection, calcBuyingCosts,
  ProjectionYear, BuyingCostBreakdown,
} from './calc.utils';

// ── Default-antaganden för prospekt-utvärdering ──────────────────────────────
// Prospekt har inga sparade bolån eller egna scenarier — använd dessa.
const DEFAULT_MORTGAGE_PCT  = 60;
const DEFAULT_MORTGAGE_RATE = 0.045;
const DEFAULT_AMORT_PCT     = 2;
const DEFAULT_INFLATION_PCT = 2;

export interface ProspectEvaluation {
  p:               ProspectProperty;
  result:          CalcResult;
  projection:      ProjectionYear[];
  costs:           BuyingCostBreakdown;
  pricePerSqmObj:  number;
  /** Procent vs marknadens snitt €/kvm. Null om marknadsdata saknas. */
  vsMarket:        number | null;
  /** Marknadsdata-rad som matchade — undefined om scenariots default användes. */
  mkt:             AreaMarketData | undefined;
  /** True om marknadsdata användes (annars föll vi tillbaka på scenariots default). */
  usedMarket:      boolean;
}

/**
 * Hitta den marknadsdata-rad som matchar ett prospekt baserat på områdesnamn.
 * Matchningen är "ena innehåller andra" (case-insensitive) för att tåla
 * små variationer som "Estepona Gamla Stan" vs "Estepona".
 */
function findMatchingMarket(p: ProspectProperty, markets: AreaMarketData[]): AreaMarketData | undefined {
  return markets.find(m =>
    m.area.toLowerCase().includes(p.area.toLowerCase()) ||
    p.area.toLowerCase().includes(m.area.toLowerCase())
  );
}

/**
 * Bygg ett scenario som baseras på marknadens egna siffror för området
 * om de finns — annars faller vi tillbaka på base-scenariots default.
 */
function scenarioForProspect(base: ScenarioConfig, mkt: AreaMarketData | undefined): ScenarioConfig {
  if (!mkt) return base;
  return {
    ...base,
    nights:          Math.round(mkt.occupancyPct * 3.65),  // occ% × 365/100
    adr:             mkt.avgAdr,
    annualGrowthPct: mkt.annualGrowthPct,
  };
}

/**
 * Utvärdera ett prospekt mot marknadsdata + scenario + tidshorisont.
 *
 * Pure function — får alla beroenden som parametrar för att vara enkel att testa
 * och tillåta cacheable useMemo i Compare-sidan.
 */
export function evaluateProspect(
  p:        ProspectProperty,
  markets:  AreaMarketData[],
  baseScenario: ScenarioConfig,
  horizonYears: number,
): ProspectEvaluation {
  const mkt = findMatchingMarket(p, markets);
  const scenario = scenarioForProspect(baseScenario, mkt);

  const result = calcInvestment({
    purchasePrice: p.purchasePrice,
    scenario,
    horizonYears,
    useMortgage:   false,
    mortgagePct:   DEFAULT_MORTGAGE_PCT,
    mortgageRate:  DEFAULT_MORTGAGE_RATE,
  });

  const projection = calcProjection({
    purchasePrice:   p.purchasePrice,
    startYear:       new Date().getFullYear() + 1,
    horizonYears,
    scenario,
    useMortgage:     false,
    mortgagePct:     DEFAULT_MORTGAGE_PCT,
    mortgageRate:    DEFAULT_MORTGAGE_RATE,
    amortizationPct: DEFAULT_AMORT_PCT,
    inflationPct:    DEFAULT_INFLATION_PCT,
  });

  const costs          = calcBuyingCosts(p.purchasePrice);
  const pricePerSqmObj = p.sizeSqm > 0 ? p.purchasePrice / p.sizeSqm : 0;
  const mktPricePerSqm = mkt?.pricePerSqm ?? 0;
  const vsMarket       = mktPricePerSqm > 0
    ? ((pricePerSqmObj - mktPricePerSqm) / mktPricePerSqm) * 100
    : null;

  return {
    p,
    result,
    projection,
    costs,
    pricePerSqmObj,
    vsMarket,
    mkt,
    usedMarket: !!mkt,
  };
}

/**
 * Rangordna prospekt-utvärderingar efter nettoyield (högst först).
 * Den första returnerade är "vinnaren".
 */
export function rankByNetYield(evaluations: ProspectEvaluation[]): ProspectEvaluation[] {
  return [...evaluations].sort((a, b) => b.result.netYield - a.result.netYield);
}
