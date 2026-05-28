import { Card, SectionHeader } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';

const MARKET_STATS = [
  { label: 'Snitt/kvm Estepona',  value: fmtMoney(4017),  delta: '+8–10%/år',        positive: true },
  { label: 'Airbnb beläggning',   value: '62%',           delta: '≈226 nätter/år',   positive: true },
  { label: 'Snittdygn (ADR)',     value: fmtMoney(146),   delta: 'Estepona 2024/25', positive: true },
  { label: 'Prisutveckling 2y',   value: '+20%',          delta: 'Cancelada area',   positive: true },
] as const;

export function MarketSnapshot() {
  return (
    <Card className="card-p" style={{ marginTop: '20px' }}>
      <SectionHeader
        title="Marknadsöversikt · Costa del Sol"
        action={<span className="text-[11px] text-text-mute">Källa: Idealista / AirDNA 2025</span>}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {MARKET_STATS.map((m, i) => (
          <div key={i} className="p-4 bg-bg-subtle rounded-[10px] border border-border">
            <p className="text-[10px] tracking-[1.5px] uppercase text-text-mute mb-1.5">{m.label}</p>
            <p className="font-display text-[26px] font-normal text-text leading-[1] mb-1">{m.value}</p>
            <p className={`text-[12px] ${m.positive ? 'text-green' : 'text-red'}`}>{m.delta}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
