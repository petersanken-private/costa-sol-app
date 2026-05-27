import { Card } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';

const MARKET_STATS = [
  { label: 'Snitt/kvm Estepona',  value: fmtMoney(4017),  delta: '+8–10%/år',       positive: true },
  { label: 'Airbnb beläggning',   value: '62%',           delta: '≈226 nätter/år',  positive: true },
  { label: 'Snittdygn (ADR)',     value: fmtMoney(146),   delta: 'Estepona 2024/25', positive: true },
  { label: 'Prisutveckling 2y',   value: '+20%',          delta: 'Cancelada area',   positive: true },
] as const;

export function MarketSnapshot() {
  return (
    <Card className="card-p" style={{ marginTop: '20px' }}>
      <div className="section-header">
        <p className="section-title">Marknadsöversikt · Costa del Sol</p>
        <span className="market-updated">Källa: Idealista / AirDNA 2025</span>
      </div>
      <div className="market-grid">
        {MARKET_STATS.map((m, i) => (
          <div key={i} className="market-stat-item">
            <p className="market-stat-label">{m.label}</p>
            <p className="market-stat-value">{m.value}</p>
            <p className={`market-stat-delta ${m.positive ? 'text-green' : 'text-red'}`}>{m.delta}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
