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
    <div className="market-compare-chart">
      {markets.map(m => (
        <div key={m.id} className="market-compare-row">
          <span className="market-compare-area">{m.area}</span>
          <div className="market-compare-bars">
            <div className="market-compare-bar-wrap" title={`€/kvm: ${fmtMoney(m.pricePerSqm)}`}>
              <div
                className="market-compare-bar market-compare-bar--price"
                style={{ width: `${(m.pricePerSqm / maxPricePerSqm) * 100}%` }}
              />
              <span className="market-compare-val">{fmtMoney(m.pricePerSqm)}/kvm</span>
            </div>
            <div className="market-compare-bar-wrap" title={`ADR: €${m.avgAdr}/natt`}>
              <div
                className="market-compare-bar market-compare-bar--adr"
                style={{ width: `${(m.avgAdr / maxAdr) * 100}%` }}
              />
              <span className="market-compare-val">€{m.avgAdr}/natt</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
