import { AreaMarketData } from '../types';

/**
 * Snabbestimerad nettoyield för ett område baserat på antagandena:
 *   - 80 kvm lägenhet
 *   - 60% netto efter OPEX (förvaltning, städ, drift, ränta etc.)
 *   - occupancy × 365 nätter × ADR ger bruttohyra
 */
export function yieldEstimate(m: AreaMarketData): number {
  const estNights  = m.occupancyPct * 3.65;
  const estRevenue = estNights * m.avgAdr;
  const estPrice   = m.pricePerSqm * 80;
  return estPrice > 0 ? (estRevenue * 0.6 / estPrice * 100) : 0;
}
