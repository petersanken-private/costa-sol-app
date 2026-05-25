import { useState } from 'react';
import { AreaMarketData } from '../../types';
import { Card, SectionHeader, Btn } from '../ui';
import { useMarketRefresh } from '../../hooks/useMarketRefresh';
import { useMarketData } from '../../hooks/useMarketData';
import { MarketModal, RefreshBanner } from '.';
import { fmtMoney } from '../../utils/calc.utils';
import '../../styles/pages.css';

export function Market() {
  const { markets, loading, upsert, remove, reload } = useMarketData();
  const [showModal, setShowModal] = useState(false);
  const [editItem,  setEditItem]  = useState<AreaMarketData | null>(null);
  const { refresh, running, last } = useMarketRefresh();

  async function handleRefresh() {
    await refresh();
    await reload();
  }

  async function handleSave(m: AreaMarketData) {
    await upsert(m);
    setShowModal(false);
    setEditItem(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Ta bort detta område?')) return;
    await remove(id);
  }

  const maxPricePerSqm = Math.max(...markets.map(m => m.pricePerSqm), 1);
  const maxAdr         = Math.max(...markets.map(m => m.avgAdr), 1);

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-eyebrow">Costa del Sol</p>
        <div className="dashboard-top-bar">
          <h1 className="page-title">Marknadsdata</h1>
          <Btn variant="primary" size="sm" onClick={() => { setEditItem(null); setShowModal(true); }}>
            + Lägg till område
          </Btn>
        </div>
      </div>

      <RefreshBanner running={running} last={last} onRun={handleRefresh} />

      {loading ? (
        <p className="text-mute">Laddar…</p>
      ) : (
        <>
          {/* Overview cards */}
          <div className="grid-3" style={{ marginBottom: '28px' }}>
            <Card className="card-p-md">
              <p className="stat-label">Snitt €/kvm (portfölj)</p>
              <p className="stat-value" style={{ color: 'var(--gold)' }}>
                {markets.length > 0
                  ? fmtMoney(Math.round(markets.reduce((s, m) => s + m.pricePerSqm, 0) / markets.length))
                  : '—'}
              </p>
              <p className="stat-sub">{markets.length} områden spårade</p>
            </Card>
            <Card className="card-p-md">
              <p className="stat-label">Snitt ADR</p>
              <p className="stat-value" style={{ color: 'var(--gold)' }}>
                {markets.length > 0
                  ? fmtMoney(Math.round(markets.reduce((s, m) => s + m.avgAdr, 0) / markets.length))
                  : '—'}
              </p>
              <p className="stat-sub">Per natt, alla områden</p>
            </Card>
            <Card className="card-p-md">
              <p className="stat-label">Snitt beläggning</p>
              <p className="stat-value" style={{ color: 'var(--green)' }}>
                {markets.length > 0
                  ? `${(markets.reduce((s, m) => s + m.occupancyPct, 0) / markets.length).toFixed(1)}%`
                  : '—'}
              </p>
              <p className="stat-sub">
                ≈ {markets.length > 0
                  ? Math.round(markets.reduce((s, m) => s + m.occupancyPct, 0) / markets.length * 3.65)
                  : 0} nätter/år
              </p>
            </Card>
          </div>

          {/* Area comparison chart */}
          <Card className="card-p" style={{ marginBottom: '20px' }}>
            <SectionHeader title="Prisjämförelse per område" />
            <div className="market-compare-chart">
              {markets.map(m => (
                <div key={m.id} className="market-compare-row">
                  <span className="market-compare-area">{m.area}</span>
                  <div className="market-compare-bars">
                    <div className="market-compare-bar-wrap" title={`€/kvm: ${fmtMoney(m.pricePerSqm)}`}>
                      <div
                        className="market-compare-bar market-compare-bar--price"
                        style={{ width: `${(m.pricePerSqm / maxPricePerSqm) * 100}%` }}
                      />
                      <span className="market-compare-val">{fmtMoney(m.pricePerSqm)}/kvm</span>
                    </div>
                    <div className="market-compare-bar-wrap" title={`ADR: €${m.avgAdr}/natt`}>
                      <div
                        className="market-compare-bar market-compare-bar--adr"
                        style={{ width: `${(m.avgAdr / maxAdr) * 100}%` }}
                      />
                      <span className="market-compare-val">€{m.avgAdr}/natt</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Desktop table */}
          <Card className="market-desktop-table">
            <div className="table-header market-cols">
              <span>Område</span>
              <span>€/kvm</span>
              <span>ADR</span>
              <span>Beläggning</span>
              <span>Tillväxt/år</span>
              <span>Yield-est.</span>
              <span>Källa</span>
              <span></span>
            </div>
            {markets.map(m => {
              const estNights  = m.occupancyPct * 3.65;
              const estRevenue = estNights * m.avgAdr;
              const estPrice   = m.pricePerSqm * 80;
              const yieldEst   = estPrice > 0 ? (estRevenue * 0.6 / estPrice * 100) : 0;
              return (
                <div key={m.id} className="table-row market-cols">
                  <span style={{ fontWeight: 500 }}>{m.area}</span>
                  <span style={{ color: 'var(--gold)' }}>{fmtMoney(m.pricePerSqm)}</span>
                  <span>€{m.avgAdr}</span>
                  <span>
                    <span className="occupancy-pill" style={{
                      background: m.occupancyPct >= 65 ? 'var(--green-bg)' : 'var(--bg-subtle)',
                      color: m.occupancyPct >= 65 ? 'var(--green)' : 'var(--text-dim)',
                    }}>
                      {m.occupancyPct}%
                    </span>
                  </span>
                  <span style={{ color: 'var(--green)' }}>+{m.annualGrowthPct}%</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{yieldEst.toFixed(1)}%</span>
                  <span className="text-mute" style={{ fontSize: '11px' }}>{m.source}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="edit-btn" style={{ opacity: 1 }} onClick={() => { setEditItem(m); setShowModal(true); }}>✎</button>
                    <button className="delete-btn" onClick={() => handleDelete(m.id)}>×</button>
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Mobile cards */}
          <div className="market-mobile-cards">
            {markets.map(m => {
              const yieldEst = m.pricePerSqm > 0
                ? (m.occupancyPct * 3.65 * m.avgAdr * 0.6) / (m.pricePerSqm * 80) * 100
                : 0;
              return (
                <Card key={m.id} className="card-p-md market-mobile-card">
                  <div className="market-mobile-card__top">
                    <p className="market-mobile-card__area">{m.area}</p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="row-action-btn row-action-btn--edit" onClick={() => { setEditItem(m); setShowModal(true); }}>✎</button>
                      <button className="row-action-btn row-action-btn--delete" onClick={() => handleDelete(m.id)}>×</button>
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
                      <span className="market-mobile-card__val" style={{ color: 'var(--gold)', fontWeight: 600 }}>{yieldEst.toFixed(1)}%</span>
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
              );
            })}
          </div>

          <p style={{ fontSize: '11px', color: 'var(--text-mute)', marginTop: '12px' }}>
            Yield-estimat baserat på 80kvm, 60% netto efter OPEX. Uppdatera siffrorna manuellt från Idealista och AirDNA.
          </p>
        </>
      )}

      {showModal && (
        <MarketModal
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
