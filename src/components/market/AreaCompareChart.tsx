import { AreaMarketData } from '../../types';
import { fmtMoney } from '../../utils/calc.utils';

interface Props { markets: AreaMarketData[]; }

/**
 * Bar-chart med €/kvm + ADR per område. Renderas inuti MarketCharts-Card,
 * så ingen egen Card-wrapper här.
 */
export function AreaCompareChart({ markets }: Props) {
  if (markets.length === 0) {
    return <p className="text-mute" style={{ fontSize: '13px' }}>Inga områden att jämföra.</p>;
  }

  const maxPricePerSqm = Math.max(...markets.map(m => m.pricePerSqm), 1);
  const maxAdr         = Math.max(...markets.map(m => m.avgAdr), 1);

  return (
    <div className="flex flex-col gap-3">
      {markets.map(m => (
        <div key={m.id} className="grid grid-cols-[180px_1fr] items-center gap-4">
          <span className="text-[13px] font-medium text-text-dim">{m.area}</span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 h-4" title={`€/kvm: ${fmtMoney(m.pricePerSqm)}`}>
              <div
                className="h-2 rounded-[4px] min-w-[4px] bg-gold opacity-70 transition-[width] duration-[400ms] ease-in-out"
                style={{ width: `${(m.pricePerSqm / maxPricePerSqm) * 100}%` }}
              />
              <span className="text-[11px] text-text-mute whitespace-nowrap">{fmtMoney(m.pricePerSqm)}/kvm</span>
            </div>
            <div className="flex items-center gap-2 h-4" title={`ADR: €${m.avgAdr}/natt`}>
              <div
                className="h-2 rounded-[4px] min-w-[4px] bg-green opacity-50 transition-[width] duration-[400ms] ease-in-out"
                style={{ width: `${(m.avgAdr / maxAdr) * 100}%` }}
              />
              <span className="text-[11px] text-text-mute whitespace-nowrap">€{m.avgAdr}/natt</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
