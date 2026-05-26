import { useMemo } from 'react';
import { AreaMarketData } from '../../types';
import { fmtMoney } from '../../utils/calc.utils';

interface Props { markets: AreaMarketData[]; }

const W = 560;        // SVG viewBox width
const H = 320;        // SVG viewBox height
const PAD = { top: 20, right: 20, bottom: 50, left: 70 } as const;

/**
 * 2D-scatter: €/kvm på X, ADR (€/natt) på Y. Median-linjer skär grafen
 * i 4 kvadranter:
 *   ◤ värde:    lågt pris, hög hyra (bäst)
 *   ◥ premium:  högt pris, hög hyra
 *   ◣ svagt:    lågt pris, låg hyra
 *   ◢ dyrt:     högt pris, låg hyra (sämst)
 */
export function PriceRentScatter({ markets }: Props) {
  const layout = useMemo(() => {
    if (markets.length === 0) return null;

    const prices = markets.map(m => m.pricePerSqm).sort((a, b) => a - b);
    const adrs   = markets.map(m => m.avgAdr).sort((a, b) => a - b);
    const minPrice = Math.min(...prices) * 0.9;
    const maxPrice = Math.max(...prices) * 1.05;
    const minAdr   = Math.min(...adrs)   * 0.9;
    const maxAdr   = Math.max(...adrs)   * 1.1;

    function median(sorted: number[]): number {
      const n = sorted.length;
      if (n === 0) return 0;
      const mid = Math.floor(n / 2);
      return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }
    const medPrice = median(prices);
    const medAdr   = median(adrs);

    function xOf(price: number): number {
      const t = (price - minPrice) / (maxPrice - minPrice);
      return PAD.left + t * (W - PAD.left - PAD.right);
    }
    function yOf(adr: number): number {
      const t = (adr - minAdr) / (maxAdr - minAdr);
      return (H - PAD.bottom) - t * (H - PAD.top - PAD.bottom);
    }

    return { xOf, yOf, medPrice, medAdr, minPrice, maxPrice, minAdr, maxAdr };
  }, [markets]);

  if (!layout || markets.length === 0) {
    return <p className="text-mute" style={{ fontSize: '13px' }}>Inga områden att jämföra.</p>;
  }

  const { xOf, yOf, medPrice, medAdr, minPrice, maxPrice, minAdr, maxAdr } = layout;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '400px' }}
      >
        {/* Background quadrants — subtle hint for the best quadrant (upper-left) */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={xOf(medPrice) - PAD.left}
          height={yOf(medAdr) - PAD.top}
          fill="rgba(22, 101, 52, 0.06)"
        />

        {/* Axis lines */}
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="var(--border)" strokeWidth="1" />
        <line x1={PAD.left} y1={PAD.top}        x2={PAD.left}        y2={H - PAD.bottom} stroke="var(--border)" strokeWidth="1" />

        {/* Median crosshair */}
        <line x1={xOf(medPrice)} y1={PAD.top} x2={xOf(medPrice)} y2={H - PAD.bottom} stroke="var(--border-hi)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={PAD.left} y1={yOf(medAdr)} x2={W - PAD.right} y2={yOf(medAdr)} stroke="var(--border-hi)" strokeWidth="1" strokeDasharray="3 3" />

        {/* Median labels */}
        <text x={xOf(medPrice) + 4} y={PAD.top + 10} fontSize="10" fill="var(--text-mute)">
          median {fmtMoney(medPrice)}
        </text>
        <text x={W - PAD.right - 4} y={yOf(medAdr) - 4} fontSize="10" fill="var(--text-mute)" textAnchor="end">
          median €{Math.round(medAdr)}/natt
        </text>

        {/* X-axis ticks (min/max) */}
        <text x={PAD.left}        y={H - PAD.bottom + 16} fontSize="10" fill="var(--text-mute)">{fmtMoney(minPrice)}</text>
        <text x={W - PAD.right}   y={H - PAD.bottom + 16} fontSize="10" fill="var(--text-mute)" textAnchor="end">{fmtMoney(maxPrice)}</text>
        <text x={(PAD.left + W - PAD.right) / 2} y={H - PAD.bottom + 36} fontSize="11" fill="var(--text-dim)" textAnchor="middle">
          €/kvm →
        </text>

        {/* Y-axis ticks */}
        <text x={PAD.left - 8} y={H - PAD.bottom} fontSize="10" fill="var(--text-mute)" textAnchor="end">€{Math.round(minAdr)}</text>
        <text x={PAD.left - 8} y={PAD.top + 6}    fontSize="10" fill="var(--text-mute)" textAnchor="end">€{Math.round(maxAdr)}</text>
        <text
          x={PAD.left - 50}
          y={(PAD.top + H - PAD.bottom) / 2}
          fontSize="11"
          fill="var(--text-dim)"
          textAnchor="middle"
          transform={`rotate(-90 ${PAD.left - 50} ${(PAD.top + H - PAD.bottom) / 2})`}
        >
          ADR €/natt ↑
        </text>

        {/* Points */}
        {markets.map(m => {
          const cx = xOf(m.pricePerSqm);
          const cy = yOf(m.avgAdr);
          const isValueQuadrant = m.pricePerSqm < medPrice && m.avgAdr > medAdr;
          const color = isValueQuadrant ? 'var(--green)' : 'var(--gold)';
          return (
            <g key={m.id}>
              <circle cx={cx} cy={cy} r="6" fill={color} stroke="white" strokeWidth="2">
                <title>{`${m.area}: ${fmtMoney(m.pricePerSqm)}/kvm, €${m.avgAdr}/natt`}</title>
              </circle>
              <text
                x={cx + 10}
                y={cy + 4}
                fontSize="11"
                fill="var(--text)"
                fontWeight={isValueQuadrant ? 600 : 400}
              >
                {m.area}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--text-mute)', marginTop: '8px', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', marginRight: 4 }} />Värde-kvadrant (lågt pris + hög hyra)</span>
        <span>Skuggad zon = bästa kvadranten</span>
        <span>Streckade linjer = medianvärden</span>
      </div>
    </div>
  );
}
