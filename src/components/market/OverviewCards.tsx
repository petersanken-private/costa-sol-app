import { AreaMarketData } from '../../types';
import { Card } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';

interface Props { markets: AreaMarketData[]; }

/** De 3 KPI-korten högst upp på Market-sidan. */
export function OverviewCards({ markets }: Props) {
  const avgPricePerSqm = markets.length > 0
    ? Math.round(markets.reduce((s, m) => s + m.pricePerSqm, 0) / markets.length)
    : null;
  const avgAdr = markets.length > 0
    ? Math.round(markets.reduce((s, m) => s + m.avgAdr, 0) / markets.length)
    : null;
  const avgOcc = markets.length > 0
    ? markets.reduce((s, m) => s + m.occupancyPct, 0) / markets.length
    : null;

  return (
    <div className="grid-3" style={{ marginBottom: '28px' }}>
      <Card className="card-p-md">
        <p className="stat-label">Snitt €/kvm (portfölj)</p>
        <p className="stat-value" style={{ color: 'var(--gold)' }}>
          {avgPricePerSqm !== null ? fmtMoney(avgPricePerSqm) : '—'}
        </p>
        <p className="stat-sub">{markets.length} områden spårade</p>
      </Card>
      <Card className="card-p-md">
        <p className="stat-label">Snitt ADR</p>
        <p className="stat-value" style={{ color: 'var(--gold)' }}>
          {avgAdr !== null ? fmtMoney(avgAdr) : '—'}
        </p>
        <p className="stat-sub">Per natt, alla områden</p>
      </Card>
      <Card className="card-p-md">
        <p className="stat-label">Snitt beläggning</p>
        <p className="stat-value" style={{ color: 'var(--green)' }}>
          {avgOcc !== null ? `${avgOcc.toFixed(1)}%` : '—'}
        </p>
        <p className="stat-sub">
          ≈ {avgOcc !== null ? Math.round(avgOcc * 3.65) : 0} nätter/år
        </p>
      </Card>
    </div>
  );
}
