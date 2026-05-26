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
    <div className="currency-widget">
      <div className="currency-widget__header">
        <div>
          <p className="currency-widget__label">EUR / SEK</p>
          {fx.loading ? (
            <p className="currency-widget__rate">Laddar…</p>
          ) : fx.error ? (
            <p className="currency-widget__rate currency-widget__rate--error">{fx.error}</p>
          ) : (
            <p className="currency-widget__rate">
              {fx.rate.toFixed(4)}
              <span
                className="currency-widget__change"
                style={{ color: positive ? 'var(--green)' : 'var(--red)' }}
              >
                {positive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
              </span>
            </p>
          )}
        </div>

        <div className="currency-widget__toggle">
          {(['30d', '1y'] as const).map(v => (
            <button
              key={v}
              className={`currency-view-btn ${view === v ? 'currency-view-btn--active' : ''}`}
              onClick={() => setView(v)}
            >{v}</button>
          ))}
        </div>
      </div>

      {/* Sparkline */}
      {!fx.loading && !fx.error && path && (
        <div className="currency-widget__chart">
          <svg viewBox={`0 0 280 48`} className="sparkline">
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
              stroke={positive ? 'var(--green)' : 'var(--red)'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Footer stats */}
      {!fx.loading && !fx.error && (
        <div className="currency-widget__footer">
          <div className="currency-widget__stat">
            <span className="currency-widget__stat-label">1 dag</span>
            <span style={{ color: fx.change1d >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '12px' }}>
              {fx.change1d >= 0 ? '+' : ''}{fx.change1d.toFixed(2)}%
            </span>
          </div>
          <div className="currency-widget__stat">
            <span className="currency-widget__stat-label">30 dagar</span>
            <span style={{ color: fx.change30d >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '12px' }}>
              {fx.change30d >= 0 ? '+' : ''}{fx.change30d.toFixed(2)}%
            </span>
          </div>
          <div className="currency-widget__stat">
            <span className="currency-widget__stat-label">12 månader</span>
            <span style={{ color: fx.change1y >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '12px' }}>
              {fx.change1y >= 0 ? '+' : ''}{fx.change1y.toFixed(2)}%
            </span>
          </div>
          <div className="currency-widget__stat">
            <span className="currency-widget__stat-label">€100k =</span>
            <span style={{ color: 'var(--gold)', fontSize: '12px', fontWeight: 500 }}>
              {(sek100k / 1_000_000).toFixed(2)}M kr
            </span>
          </div>
        </div>
      )}

      {fx.updatedAt && (
        <p className="currency-widget__updated">Uppdaterad {fx.updatedAt} · frankfurter.app</p>
      )}
    </div>
  );
}
