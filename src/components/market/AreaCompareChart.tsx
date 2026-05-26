import { AreaMarketData } from '../../types';
import { Card, SectionHeader } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';

interface Props { markets: AreaMarketData[]; }

/** Bar-chart med €/kvm + ADR per område. */
export function AreaCompareChart({ markets }: Props) {
  const maxPricePerSqm = Math.max(...markets.map(m => m.pricePerSqm), 1);
  const maxAdr         = Math.max(...markets.map(m => m.avgAdr), 1);

  return (
    <Card className="card-p" style={{ marginBottom: '20px' }}>
      <SectionHeader title="Prisjämförelse per område" />
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
    </Card>
  );
}
