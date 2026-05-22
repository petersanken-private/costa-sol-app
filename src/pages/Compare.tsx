import { useState, useMemo } from 'react';
import { ProspectProperty, ScenarioKey } from '../types';
import { Card, Btn, Modal, FormGroup } from '../components/ui';
import { SCENARIOS } from '../data';
import { fmtMoney, fmtPct } from '../utils/calc';
import { evaluateProspect, rankByNetYield } from '../utils/prospect.utils';
import { exportBankPdf } from '../utils/export';
import { AIPanel } from '../components/AIPanel';
import { useProspects } from '../hooks/useProspects';
import { useMarketData } from '../hooks/useMarketData';
import '../styles/pages.css';

function newId() { return 'pro-' + Math.random().toString(36).slice(2, 10); }

export function Compare() {
  const { prospects, loading: prospectsLoading, upsert: upsertProspect, remove: removeProspect } = useProspects();
  const { markets,   loading: marketsLoading }   = useMarketData();
  const [showModal, setShowModal] = useState(false);
  const [editItem,  setEditItem]  = useState<ProspectProperty | null>(null);
  const [scenario,  setScenario]  = useState<ScenarioKey>('base');
  const [horizon,   setHorizon]   = useState(10);

  const loading = prospectsLoading || marketsLoading;

  async function handleSave(p: ProspectProperty) {
    await upsertProspect(p);
    setShowModal(false);
    setEditItem(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Ta bort detta prospekt?')) return;
    await removeProspect(id);
  }

  const sc = SCENARIOS.find(s => s.key === scenario)!;

  // Bygg utvärdering för varje prospekt (med marknadsdata om tillgänglig).
  const calcResults = useMemo(
    () => prospects.map(p => evaluateProspect(p, markets, sc, horizon)),
    [prospects, markets, sc, horizon],
  );

  const ranked = rankByNetYield(calcResults);
  const winner = ranked[0]?.p.id;

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-eyebrow">Investeringsanalys</p>
        <div className="dashboard-top-bar">
          <h1 className="page-title">Objektjämförelse</h1>
          <Btn variant="primary" size="sm" onClick={() => { setEditItem(null); setShowModal(true); }}>
            + Lägg till objekt
          </Btn>
        </div>
      </div>

      {/* Scenario + horizon controls */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {SCENARIOS.map(s => (
            <button
              key={s.key}
              className={`filter-pill ${scenario === s.key ? 'filter-pill--active' : ''}`}
              style={{ borderColor: scenario === s.key ? s.color : undefined, color: scenario === s.key ? s.color : undefined }}
              onClick={() => setScenario(s.key)}
            >{s.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[5, 10].map(y => (
            <button key={y} className={`year-btn ${horizon === y ? 'year-btn--active' : ''}`} onClick={() => setHorizon(y)}>
              {y} år
            </button>
          ))}
        </div>
        <p className="text-mute" style={{ fontSize: '12px' }}>
          {calcResults.filter(r => r.usedMarket).length} av {prospects.length} objekt använder lokal marknadsdata
        </p>
      </div>

      {loading ? (
        <p className="text-mute">Laddar…</p>
      ) : prospects.length === 0 ? (
        <Card className="card-p">
          <div className="empty-state">
            <p className="empty-state__icon">🏠</p>
            <p className="empty-state__title">Inga prospekt ännu</p>
            <p className="empty-state__sub">Lägg till objekt du hittat på Idealista för att jämföra dem.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Side-by-side comparison cards */}
          <div className="compare-grid" style={{ gridTemplateColumns: `repeat(${Math.min(prospects.length, 3)}, 1fr)` }}>
            {ranked.map(({ p, result, projection, costs, pricePerSqmObj, vsMarket, mkt, usedMarket }) => {
              const isWinner = p.id === winner && prospects.length > 1;
              const lastYear = projection[projection.length - 1];

              return (
                <Card key={p.id} className={`card-p compare-card ${isWinner ? 'compare-card--winner' : ''}`}>
                  {isWinner && (
                    <div className="compare-winner-badge">★ Bäst yield</div>
                  )}

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <p className="compare-card__name">{p.name}</p>
                      <p className="compare-card__meta">{p.area} · {p.bedrooms} sov · {p.sizeSqm}m²</p>
                      {p.development && <p className="text-mute" style={{ fontSize: '11px' }}>{p.development}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="edit-btn" style={{ opacity: 1 }} onClick={() => { setEditItem(p); setShowModal(true); }}>✎</button>
                      <button className="delete-btn" onClick={() => handleDelete(p.id)}>×</button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="compare-price-row">
                    <span className="compare-price">{fmtMoney(p.purchasePrice)}</span>
                    <span className="compare-price-sqm">{fmtMoney(pricePerSqmObj)}/kvm</span>
                  </div>

                  {/* Vs market */}
                  {vsMarket !== null && (
                    <p className="compare-vs-market" style={{ color: vsMarket <= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {vsMarket <= 0 ? '▼' : '▲'} {Math.abs(vsMarket).toFixed(1)}% vs marknadssnitt
                      {usedMarket && <span className="text-mute"> · {mkt?.area}</span>}
                    </p>
                  )}

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />

                  {/* KPIs */}
                  <div className="compare-kpis">
                    <div className="compare-kpi">
                      <span className="compare-kpi__label">Netto/år</span>
                      <span className="compare-kpi__value" style={{ color: result.netAfterTax > 0 ? 'var(--green)' : 'var(--red)' }}>
                        {fmtMoney(result.netAfterTax)}
                      </span>
                    </div>
                    <div className="compare-kpi">
                      <span className="compare-kpi__label">Nettoyield</span>
                      <span className="compare-kpi__value" style={{ color: 'var(--gold)' }}>
                        {fmtPct(result.netYield)}
                      </span>
                    </div>
                    <div className="compare-kpi">
                      <span className="compare-kpi__label">Exit {horizon}å</span>
                      <span className="compare-kpi__value">{fmtMoney(result.exitPrice)}</span>
                    </div>
                    <div className="compare-kpi">
                      <span className="compare-kpi__label">Total förmög. {horizon}å</span>
                      <span className="compare-kpi__value" style={{ color: 'var(--gold)', fontWeight: 600 }}>
                        {fmtMoney(lastYear?.totalWealth ?? 0)}
                      </span>
                    </div>
                    <div className="compare-kpi">
                      <span className="compare-kpi__label">Kapitalinsats</span>
                      <span className="compare-kpi__value">{fmtMoney(p.purchasePrice + costs.total)}</span>
                    </div>
                    <div className="compare-kpi">
                      <span className="compare-kpi__label">Ann. avkastning</span>
                      <span className="compare-kpi__value">{fmtPct(result.annualizedReturn)}</span>
                    </div>
                  </div>

                  {/* Mini wealth chart */}
                  <div className="compare-mini-chart">
                    {projection.map((yr, idx) => {
                      const h = Math.max((yr.totalWealth / (lastYear?.totalWealth || 1)) * 40, yr.totalWealth > 0 ? 3 : 0);
                      return (
                        <div
                          key={idx}
                          className="compare-mini-bar"
                          style={{ height: `${h}px`, background: isWinner ? 'var(--gold)' : 'var(--border-hi)' }}
                          title={`${yr.calendarYear}: ${fmtMoney(yr.totalWealth)}`}
                        />
                      );
                    })}
                  </div>

                  {/* Data source note */}
                  {usedMarket ? (
                    <p className="compare-data-note compare-data-note--live">
                      📍 Marknadsdata: {mkt?.area} ({mkt?.source})
                    </p>
                  ) : (
                    <p className="compare-data-note">
                      ⚠ Scenariots defaultvärden (ingen marknadsdata för {p.area})
                    </p>
                  )}

                  <button
                    className="compare-bank-btn"
                    onClick={() => exportBankPdf(p, mkt ?? undefined, scenario, horizon)}
                  >
                    📄 Bankkalkyl PDF
                  </button>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noopener noreferrer" className="compare-link">
                      Öppna på Idealista →
                    </a>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Summary table */}
          {prospects.length > 1 && (
            <Card style={{ marginTop: '20px' }}>
              <div className="table-header" style={{ gridTemplateColumns: '1fr 100px 100px 100px 100px 110px' }}>
                <span>Objekt</span>
                <span>Pris</span>
                <span>Nettoyield</span>
                <span>Netto/år</span>
                <span>Ann. avk.</span>
                <span>Total {horizon}å</span>
              </div>
              {ranked.map(({ p, result, projection }, i) => (
                <div
                  key={p.id}
                  className="table-row"
                  style={{ gridTemplateColumns: '1fr 100px 100px 100px 100px 110px' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {i === 0 && prospects.length > 1 && <span style={{ color: 'var(--gold)', fontSize: '12px' }}>★</span>}
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    <span className="text-mute" style={{ fontSize: '12px' }}>{p.area}</span>
                  </span>
                  <span>{fmtMoney(p.purchasePrice)}</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{fmtPct(result.netYield)}</span>
                  <span style={{ color: result.netAfterTax > 0 ? 'var(--green)' : 'var(--red)' }}>
                    {fmtMoney(result.netAfterTax)}
                  </span>
                  <span>{fmtPct(result.annualizedReturn)}</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
                    {fmtMoney(projection[projection.length - 1]?.totalWealth ?? 0)}
                  </span>
                </div>
              ))}
            </Card>
          )}

          {prospects.length > 0 && (
            <AIPanel
              scope="portfolio"
              title="🤖 AI-rådgivning för prospekt"
              presets={[
                { key: 'rank-prospects', icon: '🏆', label: 'Rangordna prospekt' },
              ]}
            />
          )}
        </>
      )}

      {showModal && (
        <ProspectModal
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ── Prospect Modal ────────────────────────────────────────────────────────────

interface ProspectModalProps {
  initial: ProspectProperty | null;
  onClose: () => void;
  onSave:  (p: ProspectProperty) => void;
}

function ProspectModal({ initial, onClose, onSave }: ProspectModalProps) {
  const [name,          setName]          = useState(initial?.name          ?? '');
  const [area,          setArea]          = useState(initial?.area          ?? '');
  const [development,   setDevelopment]   = useState(initial?.development   ?? '');
  const [purchasePrice, setPurchasePrice] = useState(initial ? String(initial.purchasePrice) : '');
  const [bedrooms,      setBedrooms]      = useState(initial ? String(initial.bedrooms)      : '2');
  const [sizeSqm,       setSizeSqm]       = useState(initial ? String(initial.sizeSqm)       : '');
  const [terraceSqm,    setTerraceSqm]    = useState(initial ? String(initial.terraceSqm)    : '0');
  const [floor,         setFloor]         = useState(initial?.floor         ?? '');
  const [link,          setLink]          = useState(initial?.link          ?? '');
  const [notes,         setNotes]         = useState(initial?.notes         ?? '');
  const [error,         setError]         = useState('');

  function handleSave() {
    if (!name.trim())         return setError('Namn krävs.');
    if (!purchasePrice)       return setError('Pris krävs.');
    if (!sizeSqm)             return setError('Storlek krävs.');

    onSave({
      id:            initial?.id  ?? newId(),
      name:          name.trim(),
      area:          area.trim(),
      type:          'apartment',
      bedrooms:      parseInt(bedrooms)      || 2,
      sizeSqm:       parseInt(sizeSqm)       || 0,
      terraceSqm:    parseInt(terraceSqm)    || 0,
      purchasePrice: parseInt(purchasePrice.replace(/\D/g, '')) || 0,
      floor:         floor.trim()            || undefined,
      development:   development.trim()      || undefined,
      link:          link.trim()             || undefined,
      notes:         notes.trim()            || undefined,
    });
  }

  return (
    <Modal
      title={initial ? 'Redigera prospekt' : 'Lägg till objekt'}
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleSave}>{initial ? 'Spara' : 'Lägg till'}</Btn>
      </>}
    >
      {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
      <div className="grid-2">
        <FormGroup label="Namn / Beteckning" className="col-span-2">
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="t.ex. Apt 4B Cancelada" />
        </FormGroup>
        <FormGroup label="Område">
          <input className="form-input" value={area} onChange={e => setArea(e.target.value)} placeholder="t.ex. Cancelada" />
        </FormGroup>
        <FormGroup label="Projekt / Byggherre">
          <input className="form-input" value={development} onChange={e => setDevelopment(e.target.value)} placeholder="t.ex. Essence Residences" />
        </FormGroup>
        <FormGroup label="Begärt pris (€)">
          <input className="form-input" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="780000" />
        </FormGroup>
        <FormGroup label="Sovrum">
          <select className="form-input" value={bedrooms} onChange={e => setBedrooms(e.target.value)}>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} sovrum</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Bostadsyta (m²)">
          <input className="form-input" type="number" value={sizeSqm} onChange={e => setSizeSqm(e.target.value)} placeholder="93" />
        </FormGroup>
        <FormGroup label="Terrass (m²)">
          <input className="form-input" type="number" value={terraceSqm} onChange={e => setTerraceSqm(e.target.value)} placeholder="35" />
        </FormGroup>
        <FormGroup label="Våning / Läge">
          <input className="form-input" value={floor} onChange={e => setFloor(e.target.value)} placeholder="t.ex. 3:e vån, söder" />
        </FormGroup>
        <FormGroup label="Idealista-länk" className="col-span-2">
          <input className="form-input" value={link} onChange={e => setLink(e.target.value)} placeholder="https://idealista.com/..." />
        </FormGroup>
        <FormGroup label="Anteckningar" className="col-span-2">
          <textarea className="form-input form-input--textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Intryck, frågor, förbehåll..." />
        </FormGroup>
      </div>
    </Modal>
  );
}
