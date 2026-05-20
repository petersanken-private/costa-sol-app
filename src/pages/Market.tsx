import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AreaMarketData } from '../types';
import { Card, SectionHeader, Btn, Modal, FormGroup } from '../components/ui';
import { useMarketRefresh } from '../hooks/useMarketRefresh';
import { fmtMoney } from '../utils/calc';
import '../styles/pages.css';

function newId() { return 'mkt-' + Math.random().toString(36).slice(2, 10); }
function today()  { return new Date().toISOString().split('T')[0]; }

function dbToMarket(r: Record<string, unknown>): AreaMarketData {
  return {
    id:              r.id as string,
    area:            r.area as string,
    pricePerSqm:     r.price_per_sqm as number,
    avgAdr:          r.avg_adr as number,
    occupancyPct:    Number(r.occupancy_pct),
    annualGrowthPct: Number(r.annual_growth_pct),
    source:          r.source as string,
    updatedAt:       r.updated_at as string,
    notes:           r.notes as string | undefined,
  };
}

function marketToDb(m: AreaMarketData): Record<string, unknown> {
  return {
    id:                m.id,
    area:              m.area,
    price_per_sqm:     m.pricePerSqm,
    avg_adr:           m.avgAdr,
    occupancy_pct:     m.occupancyPct,
    annual_growth_pct: m.annualGrowthPct,
    source:            m.source,
    updated_at:        m.updatedAt,
    notes:             m.notes ?? null,
  };
}

const SEED_MARKET: AreaMarketData[] = [
  { id: 'mkt-1', area: 'Cancelada',           pricePerSqm: 4200, avgAdr: 195, occupancyPct: 65, annualGrowthPct: 9,  source: 'Idealista / AirDNA Q1 2025', updatedAt: today(), notes: 'Essence Residences-området. Stark tillväxt.' },
  { id: 'mkt-2', area: 'Estepona Gamla Stan',  pricePerSqm: 3800, avgAdr: 155, occupancyPct: 58, annualGrowthPct: 7,  source: 'Idealista / AirDNA Q1 2025', updatedAt: today(), notes: 'Charmekvarter, begränsat utbud.' },
  { id: 'mkt-3', area: 'Nueva Andalucía',      pricePerSqm: 5100, avgAdr: 240, occupancyPct: 70, annualGrowthPct: 10, source: 'Idealista / AirDNA Q1 2025', updatedAt: today(), notes: 'Golf Valley. Premium-segment.' },
  { id: 'mkt-4', area: 'Puerto Banús',         pricePerSqm: 6800, avgAdr: 310, occupancyPct: 72, annualGrowthPct: 8,  source: 'Idealista / AirDNA Q1 2025', updatedAt: today(), notes: 'Lyxsegment. Hög ADR men högt pris.' },
  { id: 'mkt-5', area: 'Estepona Öst',         pricePerSqm: 3500, avgAdr: 140, occupancyPct: 55, annualGrowthPct: 8,  source: 'Idealista / AirDNA Q1 2025', updatedAt: today(), notes: 'Lägre priser, growing area.' },
];

interface RefreshBannerProps {
  running: boolean;
  last:    ReturnType<typeof useMarketRefresh>['last'];
  onRun:   () => void;
}

function RefreshBanner({ running, last, onRun }: RefreshBannerProps) {
  const updated  = last?.results?.filter(r => r.updated).length ?? 0;
  const failed   = last?.results?.filter(r => !r.updated).length ?? 0;

  return (
    <Card className="card-p" style={{ marginBottom: '20px', background: 'var(--surface-2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 500 }}>↻ Automatisk uppdatering</p>
          <p className="text-mute" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            Hämtar tillväxt-% från INE och ADR/beläggning från Inside Airbnb (kräver CSV i Storage).
          </p>
          {last && (
            <p className="text-mute" style={{ margin: '8px 0 0', fontSize: '12px' }}>
              {last.ok
                ? `Senaste körning: ${updated} områden uppdaterade${failed > 0 ? `, ${failed} felade` : ''}`
                : `Senaste körning failade: ${last.error}`}
            </p>
          )}
        </div>
        <Btn variant="primary" size="sm" onClick={onRun} disabled={running}>
          {running ? 'Hämtar…' : '↻ Uppdatera från källor'}
        </Btn>
      </div>
    </Card>
  );
}

export function Market() {
  const [markets,     setMarkets]     = useState<AreaMarketData[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editItem,    setEditItem]    = useState<AreaMarketData | null>(null);
  const { refresh, running, last }    = useMarketRefresh();

  useEffect(() => { load(); }, []);

  async function handleRefresh() {
    await refresh();
    // Ladda om tabellen efter Edge Function är klar
    await load();
  }

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('area_market_data')
      .select('*')
      .order('area');

    if (error) { setLoading(false); return; }

    const rows = (data ?? []).map(r => dbToMarket(r as Record<string, unknown>));

    if (rows.length === 0) {
      // Seed
      for (const m of SEED_MARKET) {
        await supabase.from('area_market_data').upsert(marketToDb(m));
      }
      setMarkets(SEED_MARKET);
    } else {
      setMarkets(rows);
    }
    setLoading(false);
  }

  async function handleSave(m: AreaMarketData) {
    await supabase.from('area_market_data').upsert(marketToDb(m));
    setMarkets(prev => {
      const exists = prev.find(x => x.id === m.id);
      return exists ? prev.map(x => x.id === m.id ? m : x) : [...prev, m];
    });
    setShowModal(false);
    setEditItem(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Ta bort detta område?')) return;
    await supabase.from('area_market_data').delete().eq('id', id);
    setMarkets(prev => prev.filter(m => m.id !== id));
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

interface MarketModalProps {
  initial:  AreaMarketData | null;
  onClose:  () => void;
  onSave:   (m: AreaMarketData) => void;
}

function MarketModal({ initial, onClose, onSave }: MarketModalProps) {
  const [area,        setArea]        = useState(initial?.area            ?? '');
  const [pricePerSqm, setPricePerSqm] = useState(initial ? String(initial.pricePerSqm)     : '');
  const [avgAdr,      setAvgAdr]      = useState(initial ? String(initial.avgAdr)           : '');
  const [occupancy,   setOccupancy]   = useState(initial ? String(initial.occupancyPct)     : '');
  const [growth,      setGrowth]      = useState(initial ? String(initial.annualGrowthPct)  : '');
  const [source,      setSource]      = useState(initial?.source          ?? 'Idealista / AirDNA');
  const [notes,       setNotes]       = useState(initial?.notes           ?? '');
  const [error,       setError]       = useState('');

  function handleSave() {
    if (!area.trim())    return setError('Område krävs.');
    if (!pricePerSqm)    return setError('€/kvm krävs.');
    if (!avgAdr)         return setError('ADR krävs.');
    if (!occupancy)      return setError('Beläggning krävs.');

    onSave({
      id:              initial?.id     ?? newId(),
      area:            area.trim(),
      pricePerSqm:     parseInt(pricePerSqm)  || 0,
      avgAdr:          parseInt(avgAdr)        || 0,
      occupancyPct:    parseFloat(occupancy)   || 0,
      annualGrowthPct: parseFloat(growth)      || 0,
      source:          source.trim()           || 'Manuell',
      updatedAt:       today(),
      notes:           notes.trim()            || undefined,
    });
  }

  return (
    <Modal
      title={initial ? 'Redigera område' : 'Lägg till område'}
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleSave}>{initial ? 'Spara ändringar' : 'Lägg till'}</Btn>
      </>}
    >
      {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
      <div className="grid-2">
        <FormGroup label="Område / Stadsdel" className="col-span-2">
          <input className="form-input" value={area} onChange={e => setArea(e.target.value)} placeholder="t.ex. Cancelada" />
        </FormGroup>
        <FormGroup label="Pris €/kvm">
          <input className="form-input" type="number" value={pricePerSqm} onChange={e => setPricePerSqm(e.target.value)} placeholder="4200" />
        </FormGroup>
        <FormGroup label="Snitt ADR (€/natt)">
          <input className="form-input" type="number" value={avgAdr} onChange={e => setAvgAdr(e.target.value)} placeholder="180" />
        </FormGroup>
        <FormGroup label="Beläggning (%)">
          <input className="form-input" type="number" value={occupancy} onChange={e => setOccupancy(e.target.value)} placeholder="62" />
        </FormGroup>
        <FormGroup label="Prisutveckling (%/år)">
          <input className="form-input" type="number" value={growth} onChange={e => setGrowth(e.target.value)} placeholder="8" />
        </FormGroup>
        <FormGroup label="Källa" className="col-span-2">
          <input className="form-input" value={source} onChange={e => setSource(e.target.value)} placeholder="Idealista mars 2025" />
        </FormGroup>
        <FormGroup label="Anteckningar" className="col-span-2">
          <textarea className="form-input form-input--textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Kommentar om området..." />
        </FormGroup>
      </div>
    </Modal>
  );
}
