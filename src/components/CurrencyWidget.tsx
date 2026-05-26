import { useState } from 'react';
import { useCurrency } from '../hooks/useCurrency';

function sparkPath(data: { rate: number }[], width: number, height: number): string {
  if (data.length < 2) return '';
  const rates = data.map(d => d.rate);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.rate - min) / range) * height;
    return `${x},${y}`;
  });
  return `M${pts.join('L')}`;
}

export function CurrencyWidget() {
  const fx = useCurrency();
  const [view, setView] = useState<'30d' | '1y'>('30d');

  const history  = view === '30d' ? fx.history30d : fx.history1y;
  const change   = view === '30d' ? fx.change30d  : fx.change1y;
  const path     = sparkPath(history, 280, 48);
  const positive = change >= 0;

  // How much a €100k investment is worth in SEK
  const sek100k = fx.rate * 100_000;

  return (
    <div className="bg-bg-card border border-border rounded-xl shadow-sm p-5 mt-3">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-[10px] tracking-[2px] uppercase text-text-mute mb-1">EUR / SEK</p>
          {fx.loading ? (
            <p className="font-display text-[24px] font-normal text-text">Laddar…</p>
          ) : fx.error ? (
            <p className="text-[13px] text-red">{fx.error}</p>
          ) : (
            <p className="font-display text-[24px] font-normal text-text max-md:text-[22px] flex items-baseline gap-2">
              {fx.rate.toFixed(4)}
              <span className={`text-[12px] font-medium ${positive ? 'text-green' : 'text-red'}`}>
                {positive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
              </span>
            </p>
          )}
        </div>

        <div className="flex gap-1">
          {(['30d', '1y'] as const).map(v => {
            const active = view === v;
            const base = 'px-2.5 py-1 rounded-[20px] border text-[11px] transition-all duration-150';
            const variant = active
              ? 'border-gold bg-gold-faint text-gold'
              : 'border-border bg-transparent text-text-mute hover:border-border-hi hover:text-text-dim';
            return (
              <button
                key={v}
                className={`${base} ${variant}`}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sparkline */}
      {!fx.loading && !fx.error && path && (
        <div className="mb-3">
          <svg viewBox={`0 0 280 48`} className="w-full h-12 block">
            <defs>
              <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={positive ? '#166534' : '#991b1b'} stopOpacity="0.15"/>
                <stop offset="100%" stopColor={positive ? '#166534' : '#991b1b'} stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path
              d={`${path}L280,48L0,48Z`}
              fill="url(#spark-grad)"
            />
            <path
              d={path}
              fill="none"
              stroke={positive ? 'var(--color-green)' : 'var(--color-red)'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Footer stats */}
      {!fx.loading && !fx.error && (
        <div className="grid grid-cols-4 max-md:grid-cols-2 gap-2 pt-3 border-t border-border">
          <FxStat label="1 dag"      change={fx.change1d} />
          <FxStat label="30 dagar"   change={fx.change30d} />
          <FxStat label="12 månader" change={fx.change1y} />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-text-mute tracking-[0.5px]">€100k =</span>
            <span className="text-[12px] font-medium text-gold">
              {(sek100k / 1_000_000).toFixed(2)}M kr
            </span>
          </div>
        </div>
      )}

      {fx.updatedAt && (
        <p className="text-[10px] text-text-mute mt-2.5 text-right">Uppdaterad {fx.updatedAt} · frankfurter.app</p>
      )}
    </div>
  );
}

function FxStat({ label, change }: { label: string; change: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-text-mute tracking-[0.5px]">{label}</span>
      <span className={`text-[12px] ${change >= 0 ? 'text-green' : 'text-red'}`}>
        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
      </span>
    </div>
  );
}
