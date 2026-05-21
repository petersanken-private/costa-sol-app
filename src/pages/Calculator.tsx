import { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { Card, Stat, Tabs, SectionHeader, Btn } from '../components/ui';
import { SCENARIOS, UNIT_PRESETS } from '../data';
import { ScenarioKey } from '../types';
import { fmtMoney, fmtPct, calcInvestment, calcBuyingCosts, calcProjection, runMonteCarlo, BuyingCostBreakdown, MonteCarloResult } from '../utils/calc';
import { useMortgages } from '../hooks/useMortgages';
import { rateForDate } from '../utils/mortgageCalc';
import '../styles/pages.css';

const CALC_TABS = [
  { id: 'cashflow',   label: 'Kassaflöde'  },
  { id: 'projection', label: 'Projektion'  },
  { id: 'timeline',   label: 'Tidslinje'   },
  { id: 'costs',      label: 'Köpkostnader'},
  { id: 'montecarlo', label: 'Monte Carlo' },
];

const START_YEAR = new Date().getFullYear() + 1;

export function Calculator() {
  const { state } = useApp();
  const { items: mortgages } = useMortgages();
  const [selectedUnitId, setSelectedUnitId] = useState(UNIT_PRESETS[0].id);
  const [customPrice,    setCustomPrice]    = useState('');
  const [scenario,       setScenario]       = useState<ScenarioKey>('base');
  const [horizonYears,   setHorizonYears]   = useState(10);
  const [useMortgage,    setUseMortgage]    = useState(false);
  const [mortgagePct,    setMortgagePct]    = useState(60);
  const [mortgageRatePct, setMortgageRatePct] = useState(4.5);
  const [amortPct,       setAmortPct]       = useState(2);
  const [activeTab,      setActiveTab]      = useState('cashflow');

  // ── Monte Carlo state ──────────────────────────────────────────────────────
  const [mcAdrStd,       setMcAdrStd]       = useState(30);    // €/natt
  const [mcOccStd,       setMcOccStd]       = useState(25);    // nätter
  const [mcGrowthStd,    setMcGrowthStd]    = useState(2.5);   // %
  const [mcIterations,   setMcIterations]   = useState(2000);
  const [mcResult,       setMcResult]       = useState<MonteCarloResult | null>(null);
  const [mcRunning,      setMcRunning]      = useState(false);

  const isCustom       = selectedUnitId === 'custom';
  const selectedPreset = UNIT_PRESETS.find(u => u.id === selectedUnitId);
  const purchasePrice  = isCustom
    ? (parseInt(customPrice.replace(/\D/g, ''), 10) || 500_000)
    : (selectedPreset?.purchasePrice ?? 780_000);

  const sc         = SCENARIOS.find(s => s.key === scenario)!;
  const result     = calcInvestment({ purchasePrice, scenario: sc, horizonYears, useMortgage, mortgagePct, mortgageRate: mortgageRatePct / 100 });
  const costs      = calcBuyingCosts(purchasePrice);
  const projection = calcProjection({
    purchasePrice,
    startYear:      START_YEAR,
    horizonYears,
    scenario:       sc,
    useMortgage,
    mortgagePct,
    mortgageRate:   mortgageRatePct / 100,
    amortizationPct: amortPct,
    inflationPct:   2,
  });

  const cashflowRows   = buildCashflowRows(result.grossRent, sc.nights, purchasePrice, result, useMortgage, mortgageRatePct);
  const buyingCostRows = buildBuyingCostRows(purchasePrice, costs);

  // Monte Carlo summary stats för histogram
  const mcMaxCount = useMemo(
    () => mcResult ? Math.max(...mcResult.histogram.map(h => h.count), 1) : 1,
    [mcResult]
  );

  function handleRunMonteCarlo() {
    setMcRunning(true);
    // Defer till nästa frame så UI hinner uppdatera "Kör…"-state
    setTimeout(() => {
      const res = runMonteCarlo({
        purchasePrice,
        horizonYears,
        useMortgage,
        mortgagePct,
        mortgageRate:    mortgageRatePct / 100,
        iterations:      mcIterations,
        adrMean:         sc.adr,
        adrStdDev:       mcAdrStd,
        occupancyMean:   sc.nights,
        occupancyStdDev: mcOccStd,
        growthMean:      sc.annualGrowthPct,
        growthStdDev:    mcGrowthStd,
      });
      setMcResult(res);
      setMcRunning(false);
    }, 30);
  }

  // Chart helpers for projection
  const maxWealth  = Math.max(...projection.map(p => p.totalWealth), 1);
  const maxRent    = Math.max(...projection.map(p => p.netAfterTax), 1);

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-eyebrow">Investeringskalkyl</p>
        <h1 className="page-title">Kalkylator</h1>
        <p className="text-mute" style={{ fontSize: '13px', marginTop: '6px' }}>
          Hypotetisk avkastningskalkyl med typiska Costa del Sol-objekt — oberoende av din portfölj.
          Använd "Egen prisnivå" för att räkna på ett specifikt prospekt.
        </p>
      </div>

      {/* Unit selector */}
      <p className="form-label" style={{ marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
        Välj objekt
      </p>
      <div className="calc-unit-grid" style={{ marginBottom: '10px' }}>
        {UNIT_PRESETS.map(u => (
          <button
            key={u.id}
            className={`unit-btn ${selectedUnitId === u.id ? 'unit-btn--active' : ''}`}
            onClick={() => setSelectedUnitId(u.id)}
          >
            <p className="unit-btn__label">{u.label}</p>
            <p className="unit-btn__price">{fmtMoney(u.purchasePrice)}</p>
            <p className="unit-btn__meta">{u.sizeSqm}m² + {u.terraceSqm}m² terrass</p>
          </button>
        ))}
        <button
          className={`unit-btn ${isCustom ? 'unit-btn--custom-active' : 'unit-btn--custom'}`}
          onClick={() => setSelectedUnitId('custom')}
        >
          <p className="unit-btn__label">Eget objekt</p>
          <input
            className="form-input"
            value={customPrice}
            placeholder="€ Pris..."
            style={{ marginTop: '6px' }}
            onChange={e => { setCustomPrice(e.target.value); setSelectedUnitId('custom'); }}
            onClick={e => e.stopPropagation()}
          />
        </button>
      </div>

      {/* From portfolio */}
      {state.properties.length > 0 && (
        <div className="from-portfolio" style={{ marginBottom: '24px' }}>
          <span className="from-portfolio__label">Från portfölj:</span>
          {state.properties.map(p => (
            <button
              key={p.id}
              className="from-portfolio__btn"
              onClick={() => { setSelectedUnitId(p.id); setCustomPrice(String(p.purchasePrice)); }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Scenario + options */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div>
          <p className="form-label" style={{ marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Scenario</p>
          <div className="scenario-list">
            {SCENARIOS.map(s => (
              <button
                key={s.key}
                className="scenario-btn"
                style={{
                  borderColor: scenario === s.key ? s.color : undefined,
                  background:  scenario === s.key ? s.color + '15' : undefined,
                }}
                onClick={() => setScenario(s.key)}
              >
                <span className="scenario-btn__label" style={{ color: scenario === s.key ? s.color : undefined }}>
                  {s.label}
                </span>
                <span className="scenario-btn__meta">
                  {s.nights} nätter · €{s.adr}/natt · +{s.annualGrowthPct}%/år
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="form-label" style={{ marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Tidshorisont & bolån</p>
          <Card className="card-p">
            <p className="form-label" style={{ marginBottom: '8px' }}>Horisont (år)</p>
            <div className="horizon-btns" style={{ marginBottom: '16px' }}>
              {[3, 5, 7, 10].map(y => (
                <button
                  key={y}
                  className={`horizon-btn ${horizonYears === y ? 'horizon-btn--active' : ''}`}
                  onClick={() => setHorizonYears(y)}
                >{y}</button>
              ))}
            </div>
            <div className="mortgage-toggle">
              <input
                type="checkbox"
                className="toggle"
                id="mortgage"
                checked={useMortgage}
                onChange={e => setUseMortgage(e.target.checked)}
              />
              <span>Inkludera bolån ({mortgageRatePct}%)</span>
            </div>
            {useMortgage && (
              <>
                {mortgages.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <p className="form-label" style={{ marginBottom: '8px' }}>Använd sparat bolån som mall</p>
                    <select
                      className="form-input"
                      onChange={e => {
                        const id = e.target.value;
                        if (!id) return;
                        const m = mortgages.find(x => x.mortgage.id === id);
                        if (!m) return;
                        const ltv  = Math.round((m.mortgage.originalAmount / purchasePrice) * 100);
                        const rate = rateForDate(m.periods, new Date().toISOString().split('T')[0]);
                        setMortgagePct(Math.min(80, Math.max(10, ltv)));
                        setMortgageRatePct(rate);
                      }}
                      defaultValue=""
                    >
                      <option value="">— Välj sparat bolån —</option>
                      {mortgages.map(m => {
                        const prop = state.properties.find(p => p.id === m.mortgage.propertyId);
                        const rate = rateForDate(m.periods, new Date().toISOString().split('T')[0]);
                        return (
                          <option key={m.mortgage.id} value={m.mortgage.id}>
                            {prop?.name ?? 'Okänt objekt'} · {m.mortgage.bankName || 'Bolån'} · {rate}%
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                <div style={{ marginBottom: '12px' }}>
                  <p className="form-label" style={{ marginBottom: '8px' }}>Ränta (%)</p>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    value={mortgageRatePct}
                    onChange={e => setMortgageRatePct(parseFloat(e.target.value) || 0)}
                    style={{ maxWidth: '120px' }}
                  />
                </div>
                <p className="form-label" style={{ marginBottom: '8px' }}>Belåningsgrad (LTV)</p>
                <div className="ltv-btns">
                  {[50, 60, 70].map(p => (
                    <button
                      key={p}
                      className={`ltv-btn ${mortgagePct === p ? 'ltv-btn--active' : ''}`}
                      onClick={() => setMortgagePct(p)}
                    >{p}% LTV</button>
                  ))}
                </div>
                <div style={{ marginTop: '12px' }}>
                  <p className="form-label" style={{ marginBottom: '8px' }}>Amortering per år</p>
                  <div className="ltv-btns">
                    {[1, 2, 3].map(p => (
                      <button
                        key={p}
                        className={`ltv-btn ${amortPct === p ? 'ltv-btn--active' : ''}`}
                        onClick={() => setAmortPct(p)}
                      >{p}%</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-strip">
        {[
          { label: 'Netto/år',               value: fmtMoney(result.netAfterTax),      color: result.netAfterTax > 0 ? sc.color : 'var(--red)' },
          { label: 'Nettoyield',              value: fmtPct(result.netYield),         color: sc.color },
          { label: `Exit (${horizonYears}å)`, value: fmtMoney(result.exitPrice),        color: 'var(--gold)' },
          { label: 'Totalavk. (ann.)',         value: fmtPct(result.annualizedReturn), color: sc.color },
        ].map((k, i) => (
          <Card key={i} className="card-p-md">
            <Stat label={k.label} value={k.value} color={k.color} />
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs tabs={CALC_TABS} active={activeTab} onChange={setActiveTab} />

      {/* ── Kassaflöde ── */}
      {activeTab === 'cashflow' && (
        <Card>
          {cashflowRows.map((row, i) => (
            <div
              key={i}
              className={`cashflow-row ${row.isFinal ? 'cashflow-row--final' : ''} ${row.isNet ? 'cashflow-row--net' : ''}`}
            >
              <span style={{ color: row.isFinal ? 'var(--text)' : row.isIncome ? 'var(--text)' : 'var(--text-dim)' }}>
                {row.label}
              </span>
              <span style={{ color: row.isFinal ? (row.value > 0 ? sc.color : 'var(--red)') : row.value > 0 ? 'var(--text)' : 'var(--text-mute)' }}>
                {row.value >= 0 ? '+' : '−'}{fmtMoney(Math.abs(row.value))}
              </span>
            </div>
          ))}
        </Card>
      )}

      {/* ── Projektion ── */}
      {activeTab === 'projection' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Wealth chart */}
          <Card className="card-p">
            <SectionHeader title="Total förmögenhetstillväxt" />
            <div className="proj-chart">
              {projection.map((p, i) => {
                const wealthH = Math.max((p.totalWealth / maxWealth) * 120, p.totalWealth > 0 ? 4 : 0);
                const rentH   = Math.max((p.netAfterTax / maxRent) * 120, 4);
                return (
                  <div key={i} className="proj-bar-group">
                    <div className="proj-bar-pair">
                      <div
                        className="proj-bar proj-bar--wealth"
                        style={{ height: `${wealthH}px`, background: sc.color }}
                        title={`År ${p.calendarYear}: Total förmögenhet ${fmtMoney(p.totalWealth)}`}
                      />
                      <div
                        className="proj-bar proj-bar--rent"
                        style={{ height: `${rentH}px` }}
                        title={`År ${p.calendarYear}: Driftnetto ${fmtMoney(p.netAfterTax)}`}
                      />
                    </div>
                    <span className="proj-bar-label">{p.calendarYear}</span>
                  </div>
                );
              })}
            </div>
            <div className="proj-legend">
              <span className="proj-legend-item">
                <span className="proj-legend-dot" style={{ background: sc.color }} /> Total förmögenhet
              </span>
              <span className="proj-legend-item">
                <span className="proj-legend-dot proj-legend-dot--rent" /> Driftnetto per år
              </span>
            </div>
          </Card>

          {/* Year-by-year table */}
          <Card>
            <div className="calc-projection-scroll">
              <div className="table-header proj-cols">
                <span>År</span>
                <span>Fastighetsvärde</span>
                <span>Lånesaldo</span>
                <span>Eget kapital</span>
                <span>Driftnetto</span>
                <span>Ackum. kassafl.</span>
                <span>Total förmögenhet</span>
              </div>
              {projection.map((p, i) => (
                <div key={i} className={`table-row proj-cols ${i % 2 === 1 ? 'proj-row--alt' : ''}`}>
                  <span className="text-mute">{p.calendarYear}</span>
                  <span data-label="Fastighetsvärde" style={{ color: 'var(--gold)' }}>{fmtMoney(p.propertyValue)}</span>
                  <span data-label="Lånesaldo" className="text-mute">{p.loanBalance > 0 ? `−${fmtMoney(p.loanBalance)}` : '—'}</span>
                  <span data-label="Eget kapital">{fmtMoney(p.equity)}</span>
                  <span data-label="Driftnetto" style={{ color: p.netAfterTax >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {p.netAfterTax >= 0 ? '+' : '−'}{fmtMoney(Math.abs(p.netAfterTax))}
                  </span>
                  <span data-label="Ackum. kassafl." style={{ color: p.cumulativeCashflow >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {p.cumulativeCashflow >= 0 ? '+' : '−'}{fmtMoney(Math.abs(p.cumulativeCashflow))}
                  </span>
                  <span data-label="Total förmögenhet" style={{
                    color: p.totalWealth >= 0 ? sc.color : 'var(--red)',
                    fontWeight: 600,
                  }}>
                    {p.totalWealth >= 0 ? '+' : '−'}{fmtMoney(Math.abs(p.totalWealth))}
                  </span>
                </div>
              ))}
            </div>
            {/* Summary row */}
            <div className="table-footer" style={{ justifyContent: 'flex-end', gap: '24px' }}>
              <span className="text-mute">
                Equity år {horizonYears}: <strong style={{ color: 'var(--gold)' }}>{fmtMoney(projection[projection.length - 1]?.equity ?? 0)}</strong>
              </span>
              <span className="text-mute">
                Total förmögenhet: <strong style={{ color: sc.color }}>{fmtMoney(projection[projection.length - 1]?.totalWealth ?? 0)}</strong>
              </span>
            </div>
          </Card>

          <p className="calc-disclaimer">
            Projektion inkluderar inflation (2%/år på opex), realt ADR-tillväxt (max 5%/år), amortering {amortPct}%/år och IRNR-skatt 19%. Fastighetsvärde växer enligt valt scenario. Total förmögenhet = eget kapital + ackumulerat driftnetto − köpkostnader.
          </p>
        </div>
      )}

      {/* ── Tidslinje ── */}
      {activeTab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Array.from({ length: horizonYears }, (_, i) => i + 1).map(yr => {
            const rentAccum = result.netAfterTax * yr;
            const projPrice = purchasePrice * Math.pow(1 + sc.annualGrowthPct / 100, yr);
            const gain      = projPrice - purchasePrice;
            const gainTax   = gain * 0.19;
            const total     = rentAccum + gain - gainTax;
            const pct       = Math.max(0, Math.min(100, (total / (result.equity * 1.5)) * 100));

            return (
              <Card key={yr} className="card-p-sm">
                <div className="timeline-row">
                  <div className="timeline-row__meta">
                    <span>År {START_YEAR + yr}</span>
                    <span>Hyra: {fmtMoney(rentAccum)}</span>
                    <span>Värdestegring: {fmtMoney(gain - gainTax)}</span>
                  </div>
                  <span className="timeline-row__value" style={{ color: sc.color }}>
                    {fmtMoney(total)}
                  </span>
                </div>
                <div className="timeline-bar-wrap">
                  <div className="timeline-bar" style={{ width: `${pct}%`, background: sc.color }} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Köpkostnader ── */}
      {activeTab === 'costs' && (
        <Card>
          {buyingCostRows.map((row, i) => (
            <div
              key={i}
              className={`cashflow-row ${row.bold ? 'cashflow-row--net' : ''} ${row.highlight ? 'cashflow-row--final' : ''}`}
            >
              <div>
                <span style={{ fontWeight: row.bold ? 600 : 400, color: row.highlight ? 'var(--gold)' : row.bold ? 'var(--text)' : 'var(--text-dim)' }}>
                  {row.label}
                </span>
                {row.note && <span className="text-mute" style={{ fontSize: '11px', marginLeft: '8px' }}>· {row.note}</span>}
              </div>
              <span style={{
                fontFamily: row.highlight ? 'var(--font-display)' : undefined,
                fontSize:   row.highlight ? '20px' : '14px',
                color:      row.highlight ? 'var(--gold)' : row.bold ? 'var(--text)' : 'var(--text-mute)',
                fontWeight: row.bold ? 600 : 400,
              }}>
                {fmtMoney(row.value)}
              </span>
            </div>
          ))}
        </Card>
      )}

      {activeTab === 'montecarlo' && (
        <div className="mc-section">
          <Card>
            <div className="mc-intro">
              <SectionHeader title="Känslighetsanalys (Monte Carlo)" />
              <p className="text-mute" style={{ fontSize: '13px', marginTop: '4px' }}>
                Kör tusentals simuleringar med slumpmässig variation runt scenariots värden för att se
                fördelningen av möjliga utfall. Anger osäkerheten (standardavvikelse) per parameter.
              </p>
            </div>

            <div className="mc-controls">
              <div className="mc-control">
                <label className="form-label">ADR osäkerhet (±€/natt)</label>
                <input
                  type="number"
                  className="form-input"
                  value={mcAdrStd}
                  onChange={e => setMcAdrStd(parseInt(e.target.value) || 0)}
                />
                <p className="mc-control__sub">
                  Medel: €{sc.adr}/natt · Spread ≈ €{sc.adr - mcAdrStd}–{sc.adr + mcAdrStd}
                </p>
              </div>

              <div className="mc-control">
                <label className="form-label">Beläggning osäkerhet (±nätter)</label>
                <input
                  type="number"
                  className="form-input"
                  value={mcOccStd}
                  onChange={e => setMcOccStd(parseInt(e.target.value) || 0)}
                />
                <p className="mc-control__sub">
                  Medel: {sc.nights} nätter · Spread ≈ {Math.max(0, sc.nights - mcOccStd)}–{sc.nights + mcOccStd}
                </p>
              </div>

              <div className="mc-control">
                <label className="form-label">Tillväxt osäkerhet (±%)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={mcGrowthStd}
                  onChange={e => setMcGrowthStd(parseFloat(e.target.value) || 0)}
                />
                <p className="mc-control__sub">
                  Medel: {sc.annualGrowthPct}% · Spread ≈ {(sc.annualGrowthPct - mcGrowthStd).toFixed(1)}–{(sc.annualGrowthPct + mcGrowthStd).toFixed(1)}%
                </p>
              </div>

              <div className="mc-control">
                <label className="form-label">Antal simuleringar</label>
                <select
                  className="form-input"
                  value={mcIterations}
                  onChange={e => setMcIterations(parseInt(e.target.value))}
                >
                  <option value={500}>500 (snabb)</option>
                  <option value={2000}>2 000 (rekommenderat)</option>
                  <option value={5000}>5 000</option>
                  <option value={10000}>10 000 (långsam)</option>
                </select>
              </div>
            </div>

            <div className="mc-run-row">
              <Btn variant="primary" onClick={handleRunMonteCarlo} disabled={mcRunning}>
                {mcRunning ? 'Kör simulering…' : `▶ Kör ${mcIterations.toLocaleString('sv-SE')} simuleringar`}
              </Btn>
            </div>
          </Card>

          {mcResult && (
            <>
              <Card>
                <SectionHeader title="Resultat" />
                <div className="mc-stats-grid">
                  <Stat label="Medel (avk./år)"   value={fmtPct(mcResult.meanAnnualizedReturn)}   color={mcResult.meanAnnualizedReturn > 5 ? 'var(--green)' : 'var(--text)'} />
                  <Stat label="Median"            value={fmtPct(mcResult.medianAnnualizedReturn)} color="var(--gold)" />
                  <Stat label="Pessimistisk (P10)" value={fmtPct(mcResult.p10AnnualizedReturn)}    color={mcResult.p10AnnualizedReturn > 0 ? 'var(--text)' : 'var(--red)'} />
                  <Stat label="Optimistisk (P90)"  value={fmtPct(mcResult.p90AnnualizedReturn)}    color="var(--green)" />
                </div>

                <div className="mc-probabilities">
                  <p className="section-title" style={{ fontSize: '14px', marginTop: '20px' }}>Sannolikheter</p>
                  <div className="mc-prob-grid">
                    <div className="mc-prob-row">
                      <span>Positiv avkastning</span>
                      <div className="mc-prob-bar">
                        <div className="mc-prob-bar__fill" style={{ width: `${mcResult.probabilityPositive * 100}%`, background: 'var(--green)' }} />
                      </div>
                      <strong>{fmtPct(mcResult.probabilityPositive * 100, 0)}</strong>
                    </div>
                    <div className="mc-prob-row">
                      <span>Över 5%/år</span>
                      <div className="mc-prob-bar">
                        <div className="mc-prob-bar__fill" style={{ width: `${mcResult.probabilityAbove5 * 100}%`, background: 'var(--gold)' }} />
                      </div>
                      <strong>{fmtPct(mcResult.probabilityAbove5 * 100, 0)}</strong>
                    </div>
                    <div className="mc-prob-row">
                      <span>Över 10%/år</span>
                      <div className="mc-prob-bar">
                        <div className="mc-prob-bar__fill" style={{ width: `${mcResult.probabilityAbove10 * 100}%`, background: 'var(--gold)' }} />
                      </div>
                      <strong>{fmtPct(mcResult.probabilityAbove10 * 100, 0)}</strong>
                    </div>
                    <div className="mc-prob-row">
                      <span>Över 15%/år</span>
                      <div className="mc-prob-bar">
                        <div className="mc-prob-bar__fill" style={{ width: `${mcResult.probabilityAbove15 * 100}%`, background: 'var(--green)' }} />
                      </div>
                      <strong>{fmtPct(mcResult.probabilityAbove15 * 100, 0)}</strong>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <SectionHeader title="Fördelning av årlig avkastning" />
                <div className="mc-histogram">
                  {mcResult.histogram.map((h, i) => {
                    const isPositive = h.bin >= 0;
                    return (
                      <div key={i} className="mc-bar-wrap" title={`${h.bin.toFixed(1)}% — ${h.count} simuleringar`}>
                        <div
                          className="mc-bar"
                          style={{
                            height: `${(h.count / mcMaxCount) * 100}%`,
                            background: isPositive ? 'var(--gold)' : 'var(--red)',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mc-histogram-axis">
                  <span>{mcResult.histogram[0]?.bin.toFixed(0)}%</span>
                  <span style={{ color: 'var(--text-mute)' }}>Årlig avkastning</span>
                  <span>{mcResult.histogram[mcResult.histogram.length - 1]?.bin.toFixed(0)}%</span>
                </div>
                <p className="text-mute" style={{ fontSize: '11px', marginTop: '12px', textAlign: 'center' }}>
                  Baserat på {mcResult.iterations.toLocaleString('sv-SE')} simuleringar med normalfördelad variation runt scenariot.
                </p>
              </Card>
            </>
          )}

          {!mcResult && !mcRunning && (
            <Card>
              <div className="empty-state">
                <p className="empty-state__icon">🎲</p>
                <p className="empty-state__title">Ingen simulering körd ännu</p>
                <p className="empty-state__sub">
                  Justera osäkerheten ovan och klicka "Kör simuleringar" för att se fördelningen av möjliga utfall.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      <p className="calc-disclaimer">
        Alla siffror är estimat baserade på marknadsdata. Konsultera alltid spansk gestor och advokat.
      </p>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildCashflowRows(
  grossRent: number,
  nights: number,
  purchasePrice: number,
  result: ReturnType<typeof calcInvestment>,
  useMortgage: boolean,
  mortgageRatePct: number = 4.5,
) {
  return [
    { label: 'Bruttohyresintäkt',                          value:  grossRent,               isIncome: true  },
    { label: 'Förvaltningsavgift (18%)',                    value: -result.managementFee                     },
    { label: `Städning (€55 × ${nights} nätter)`,          value: -result.cleaningCost                      },
    { label: 'IBI + Försäkring + Community + Gestor',      value: -result.fixedCosts                        },
    { label: `Underhåll (0.4% × ${fmtMoney(purchasePrice)})`, value: -(purchasePrice * 0.004)                },
    ...(useMortgage ? [{ label: `Bolåneränta (${mortgageRatePct}%)`, value: -result.mortgageCost }] : []),
    { label: 'Nettoinkomst f. skatt',                       value:  result.netBeforeTax,     isNet: true     },
    { label: 'IRNR-skatt (19% på netto)',                   value: -result.tax                               },
    { label: 'Netto e. skatt',                              value:  result.netAfterTax,      isFinal: true   },
  ] as Array<{ label: string; value: number; isIncome?: boolean; isNet?: boolean; isFinal?: boolean }>;
}

function buildBuyingCostRows(purchasePrice: number, costs: BuyingCostBreakdown) {
  return [
    { label: 'Köpeskilling',              value: purchasePrice,               note: '',                         bold: false, highlight: false },
    { label: 'Transferskatt ITP (7%)',    value: costs.transferTax,           note: 'Andalusien, nyproduktion', bold: false, highlight: false },
    { label: 'Notarieavgifter (0.5%)',    value: costs.notary,                note: 'Obligatorisk',             bold: false, highlight: false },
    { label: 'Lantmäteri/stämpel (1%)',   value: costs.landRegistry,          note: '',                         bold: false, highlight: false },
    { label: 'Advokat (1.5%)',            value: costs.lawyer,                note: 'Rekommenderas',            bold: false, highlight: false },
    { label: 'NIE + administration',      value: costs.admin,                 note: 'Engångskostnad',           bold: false, highlight: false },
    { label: 'Totala köpomkostnader',     value: costs.total,                 note: '≈ 12%',                    bold: true,  highlight: false },
    { label: 'TOTAL KAPITALINSATS',       value: purchasePrice + costs.total, note: '',                         bold: true,  highlight: true  },
  ];
}
