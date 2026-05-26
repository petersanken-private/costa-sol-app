import { AreaMarketData } from '../../types';
import { Card } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';
import { yieldEstimate } from '../../utils/market.utils';

interface Props {
  markets:  AreaMarketData[];
  onEdit:   (m: AreaMarketData) => void;
  onDelete: (id: string) => void;
}

/** Desktop-tabell över alla områden. Döljs på mobil via CSS. */
export function MarketTable({ markets, onEdit, onDelete }: Props) {
  return (
    <Card className="market-desktop-table">
      <div className="table-header market-cols">
        <span>Område</span>
        <span>€/kvm</span>
        <span>ADR</span>
        <span>Beläggning</span>
        <span>Tillväxt/år</span>
        <span>Yield-est.</span>
        <span>Källa</span>
        <span></span>
      </div>
      {markets.map(m => (
        <div key={m.id} className="table-row market-cols">
          <span style={{ fontWeight: 500 }}>{m.area}</span>
          <span style={{ color: 'var(--gold)' }}>{fmtMoney(m.pricePerSqm)}</span>
          <span>€{m.avgAdr}</span>
          <span>
            <span className="occupancy-pill" style={{
              background: m.occupancyPct >= 65 ? 'var(--green-bg)' : 'var(--bg-subtle)',
              color: m.occupancyPct >= 65 ? 'var(--green)' : 'var(--text-dim)',
            }}>
              {m.occupancyPct}%
            </span>
          </span>
          <span style={{ color: 'var(--green)' }}>+{m.annualGrowthPct}%</span>
          <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{yieldEstimate(m).toFixed(1)}%</span>
          <span className="text-mute" style={{ fontSize: '11px' }}>{m.source}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="edit-btn" style={{ opacity: 1 }} onClick={() => onEdit(m)}>✎</button>
            <button className="delete-btn" onClick={() => onDelete(m.id)}>×</button>
          </div>
        </div>
      ))}
    </Card>
  );
}

