import { AreaMarketData } from '../../types';
import { Card, RowActionBtn } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';
import { yieldEstimate } from '../../utils/market.utils';

interface Props {
  markets:  AreaMarketData[];
  onEdit:   (m: AreaMarketData) => void;
  onDelete: (id: string) => void;
}

/** Mobile-stacked card grid (renderas alltid; CSS-toggle med md: hides on desktop). */
export function MarketMobileCards({ markets, onEdit, onDelete }: Props) {
  return (
    <div className="md:hidden flex flex-col gap-2.5">
      {markets.map(m => (
        <Card key={m.id} className="card-p-md">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[14px] font-medium text-text">{m.area}</p>
            <div className="flex gap-1.5">
              <RowActionBtn variant="edit"   onClick={() => onEdit(m)} />
              <RowActionBtn variant="delete" onClick={() => onDelete(m.id)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <MobileKpi label="€/kvm"       value={fmtMoney(m.pricePerSqm)} color="var(--gold)" />
            <MobileKpi label="ADR"         value={`€${m.avgAdr}`} />
            <MobileKpi label="Beläggning"  value={`${m.occupancyPct}%`} color={m.occupancyPct >= 65 ? 'var(--green)' : 'var(--text-dim)'} />
            <MobileKpi label="Yield-est."  value={`${yieldEstimate(m).toFixed(1)}%`} color="var(--gold)" bold />
            <MobileKpi label="Tillväxt/år" value={`+${m.annualGrowthPct}%`} color="var(--green)" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-text-mute uppercase tracking-[0.5px]">Källa</span>
              <span className="text-[10px] text-text-mute">{m.source}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MobileKpi({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-text-mute uppercase tracking-[0.5px]">{label}</span>
      <span className="font-display text-[15px]" style={{ color, fontWeight: bold ? 600 : undefined }}>{value}</span>
    </div>
  );
}
