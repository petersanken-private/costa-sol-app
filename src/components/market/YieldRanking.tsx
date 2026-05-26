import { useMemo } from 'react';
import { AreaMarketData } from '../../types';
import { yieldEstimate } from '../../utils/market.utils';
import { fmtMoney } from '../../utils/calc.utils';

interface Props { markets: AreaMarketData[]; }

/**
 * Horisontell bar-chart: områden rangordnade efter beräknad nettoyield.
 * Bästa området högst upp, gold-färgad. Övriga grå.
 */
export function YieldRanking({ markets }: Props) {
  const ranked = useMemo(
    () => markets
      .map(m => ({ m, y: yieldEstimate(m) }))
      .sort((a, b) => b.y - a.y),
    [markets],
  );

  if (ranked.length === 0) {
    return <p className="text-mute" style={{ fontSize: '13px' }}>Inga områden att rangordna.</p>;
  }

  const maxY = Math.max(...ranked.map(r => r.y), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {ranked.map(({ m, y }, i) => {
        const isBest = i === 0;
        const widthPct = (y / maxY) * 100;
        return (
          <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '13px',
              fontWeight: isBest ? 600 : 400,
              color: isBest ? 'var(--gold)' : 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              {isBest && <span style={{ fontSize: '11px' }}>★</span>}
              {m.area}
            </span>
            <div style={{ height: '14px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                width: `${widthPct}%`,
                height: '100%',
                background: isBest ? 'var(--gold)' : 'var(--border-hi)',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{
              fontSize: '12px',
              fontVariantNumeric: 'tabular-nums',
              textAlign: 'right',
              color: isBest ? 'var(--gold)' : 'var(--text-dim)',
              fontWeight: isBest ? 600 : 500,
            }}>
              {y.toFixed(1)}%
            </span>
          </div>
        );
      })}
      <p className="text-mute" style={{ fontSize: '11px', marginTop: '8px' }}>
        Nettoyield-estimat: 80 kvm × {fmtMoney(ranked[0].m.pricePerSqm)}/kvm, 60% efter OPEX, beläggning × ADR.
      </p>
    </div>
  );
}
