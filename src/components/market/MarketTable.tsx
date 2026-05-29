import { AreaMarketData } from '../../types';
import { Card, IconBtn } from '../ui';
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
    <Card className="max-md:hidden">
      <div className="table-header grid-cols-[1fr_90px_70px_100px_90px_80px_130px_60px]">
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
        <div key={m.id} className="table-row grid-cols-[1fr_90px_70px_100px_90px_80px_130px_60px]">
          <span style={{ fontWeight: 500 }}>{m.area}</span>
          <span style={{ color: 'var(--gold)' }}>{fmtMoney(m.pricePerSqm)}</span>
          <span>€{m.avgAdr}</span>
          <span>
            <span className="inline-block px-2 py-0.5 rounded-[12px] text-[12px] font-medium" style={{
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
            <IconBtn variant="edit"   onClick={() => onEdit(m)}      alwaysVisible />
            <IconBtn variant="delete" onClick={() => onDelete(m.id)} alwaysVisible />
          </div>
        </div>
      ))}
    </Card>
  );
}

