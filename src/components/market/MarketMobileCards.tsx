import { AreaMarketData } from '../../types';
import { Card } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';
import { yieldEstimate } from '../../utils/market.utils';

interface Props {
  markets:  AreaMarketData[];
  onEdit:   (m: AreaMarketData) => void;
  onDelete: (id: string) => void;
}

/** Mobile-stacked card grid (CSS-toggles mellan tabell/cards baserat på viewport). */
export function MarketMobileCards({ markets, onEdit, onDelete }: Props) {
  return (
    <div className="market-mobile-cards">
      {markets.map(m => (
        <Card key={m.id} className="card-p-md market-mobile-card">
          <div className="market-mobile-card__top">
            <p className="market-mobile-card__area">{m.area}</p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="row-action-btn row-action-btn--edit"   onClick={() => onEdit(m)}>✎</button>
              <button className="row-action-btn row-action-btn--delete" onClick={() => onDelete(m.id)}>×</button>
            </div>
          </div>
          <div className="market-mobile-card__kpis">
            <div className="market-mobile-card__kpi">
              <span className="market-mobile-card__label">€/kvm</span>
              <span className="market-mobile-card__val" style={{ color: 'var(--gold)' }}>{fmtMoney(m.pricePerSqm)}</span>
            </div>
            <div className="market-mobile-card__kpi">
              <span className="market-mobile-card__label">ADR</span>
              <span className="market-mobile-card__val">€{m.avgAdr}</span>
            </div>
            <div className="market-mobile-card__kpi">
              <span className="market-mobile-card__label">Beläggning</span>
              <span className="market-mobile-card__val" style={{ color: m.occupancyPct >= 65 ? 'var(--green)' : 'var(--text-dim)' }}>{m.occupancyPct}%</span>
            </div>
            <div className="market-mobile-card__kpi">
              <span className="market-mobile-card__label">Yield-est.</span>
              <span className="market-mobile-card__val" style={{ color: 'var(--gold)', fontWeight: 600 }}>{yieldEstimate(m).toFixed(1)}%</span>
            </div>
            <div className="market-mobile-card__kpi">
              <span className="market-mobile-card__label">Tillväxt/år</span>
              <span className="market-mobile-card__val" style={{ color: 'var(--green)' }}>+{m.annualGrowthPct}%</span>
            </div>
            <div className="market-mobile-card__kpi">
              <span className="market-mobile-card__label">Källa</span>
              <span style={{ fontSize: '10px', color: 'var(--text-mute)' }}>{m.source}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
