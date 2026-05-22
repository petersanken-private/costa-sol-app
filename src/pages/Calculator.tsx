import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { Card, Stat, Tabs } from '../components/ui';
import { SCENARIOS, UNIT_PRESETS } from '../data';
import { ScenarioKey } from '../types';
import {
  fmtMoney, fmtPct, calcInvestment, calcBuyingCosts, calcProjection,
  BuyingCostBreakdown,
} from '../utils/calc.utils';
import { useMortgages } from '../hooks/useMortgages';
import { rateForDate } from '../utils/mortgage.utils';
import { OPERATING } from '../constants/tax';
import {
  CashflowTab, ProjectionTab, TimelineTab, CostsTab, MonteCarloTab,
  CashflowRow, BuyingCostRow,
} from '../components/calculator';
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
  const [selectedUnitId, setSelectedUnitId]   = useState(UNIT_PRESETS[0].id);
  const [customPrice,    setCustomPrice]      = useState('');
  const [scenario,       setScenario]         = useState<ScenarioKey>('base');
  const [horizonYears,   setHorizonYears]     = useState(10);
  const [useMortgage,    setUseMortgage]      = useState(false);
  const [mortgagePct,    setMortgagePct]      = useState(60);
  const [mortgageRatePct, setMortgageRatePct] = useState(4.5);
  const [amortPct,       setAmortPct]         = useState(2);
  const [activeTab,      setActiveTab]        = useState('cashflow');

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
    startYear:       START_YEAR,
    horizonYears,
    scenario:        sc,
    useMortgage,
    mortgagePct,
    mortgageRate:    mortgageRatePct / 100,
    amortizationPct: amortPct,
    inflationPct:    2,
  });

  const cashflowRows   = buildCashflowRows(result, sc.nights, purchasePrice, useMortgage, mortgageRatePct);
  const buyingCostRows = buildBuyingCostRows(purchasePrice, costs);

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-eyebrow">Investeringskalkyl</p>
        <h1 className="page-title">Kalkylator</h1>
        <p className="text-mute text-[13px] mt-1.5">
          Hypotetisk avkastningskalkyl med typiska Costa del Sol-objekt — oberoende av din portfölj.
          Använd "Egen prisnivå" för att räkna på ett specifikt prospekt.
        </p>
      </div>

      {/* Unit selector */}
      <p className="form-label mb-2.5 uppercase tracking-[0.094em]">Välj objekt</p>
      <div className="calc-unit-grid mb-2.5">
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
            className="form-input mt-1.5"
            value={customPrice}
            placeholder="€ Pris..."
            onChange={e => { setCustomPrice(e.target.value); setSelectedUnitId('custom'); }}
            onClick={e => e.stopPropagation()}
          />
        </button>
      </div>

      {/* From portfolio */}
      {state.properties.length > 0 && (
        <div className="from-portfolio mb-6">
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

      {/* Scenario + horizon/mortgage */}
      <div className="grid-2 mb-6">
        <div>
          <p className="form-label mb-2.5 uppercase tracking-[0.094em]">Scenario</p>
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
          <p className="form-label mb-2.5 uppercase tracking-[0.094em]">Tidshorisont & bolån</p>
          <Card className="card-p">
            <p className="form-label mb-2">Horisont (år)</p>
            <div className="horizon-btns mb-4">
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
                  <div className="mb-3">
                    <p className="form-label mb-2">Använd sparat bolån som mall</p>
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
                <div className="mb-3">
                  <p className="form-label mb-2">Ränta (%)</p>
                  <input
                    className="form-input max-w-[120px]"
                    type="number"
                    step="0.01"
                    value={mortgageRatePct}
                    onChange={e => setMortgageRatePct(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <p className="form-label mb-2">Belåningsgrad (LTV)</p>
                <div className="ltv-btns">
                  {[50, 60, 70].map(p => (
                    <button
                      key={p}
                      className={`ltv-btn ${mortgagePct === p ? 'ltv-btn--active' : ''}`}
                      onClick={() => setMortgagePct(p)}
                    >{p}% LTV</button>
                  ))}
                </div>
                <div className="mt-3">
                  <p className="form-label mb-2">Amortering per år</p>
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
          { label: 'Netto/år',                value: fmtMoney(result.netAfterTax),     color: result.netAfterTax > 0 ? sc.color : 'var(--red)' },
          { label: 'Nettoyield',              value: fmtPct(result.netYield),          color: sc.color },
          { label: `Exit (${horizonYears}å)`, value: fmtMoney(result.exitPrice),       color: 'var(--gold)' },
          { label: 'Totalavk. (ann.)',         value: fmtPct(result.annualizedReturn), color: sc.color },
        ].map((k, i) => (
          <Card key={i} className="card-p-md">
            <Stat label={k.label} value={k.value} color={k.color} />
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs tabs={CALC_TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'cashflow'   && <CashflowTab   rows={cashflowRows} scenarioColor={sc.color} />}
      {activeTab === 'projection' && <ProjectionTab projection={projection} scenarioColor={sc.color} horizonYears={horizonYears} amortPct={amortPct} />}
      {activeTab === 'timeline'   && <TimelineTab   result={result} purchasePrice={purchasePrice} scenario={sc} horizonYears={horizonYears} />}
      {activeTab === 'costs'      && <CostsTab      rows={buyingCostRows} />}
      {activeTab === 'montecarlo' && <MonteCarloTab purchasePrice={purchasePrice} scenario={sc} horizonYears={horizonYears} useMortgage={useMortgage} mortgagePct={mortgagePct} mortgageRatePct={mortgageRatePct} />}

      <p className="calc-disclaimer">
        Alla siffror är estimat baserade på marknadsdata. Konsultera alltid spansk gestor och advokat.
      </p>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildCashflowRows(
  result:           ReturnType<typeof calcInvestment>,
  nights:           number,
  purchasePrice:    number,
  useMortgage:      boolean,
  mortgageRatePct:  number,
): CashflowRow[] {
  return [
    { label: 'Bruttohyresintäkt',                          value:  result.grossRent,    isIncome: true  },
    { label: 'Förvaltningsavgift (18%)',                    value: -result.managementFee                 },
    { label: `Städning (€55 × ${nights} nätter)`,          value: -result.cleaningCost                  },
    { label: 'IBI + Försäkring + Community + Gestor',      value: -result.fixedCosts                    },
    { label: `Underhåll (${(OPERATING.MAINTENANCE_PCT * 100).toFixed(1)}% × ${fmtMoney(purchasePrice)})`,
                                                            value: -(purchasePrice * OPERATING.MAINTENANCE_PCT) },
    ...(useMortgage ? [{ label: `Bolåneränta (${mortgageRatePct}%)`, value: -result.mortgageCost }] : []),
    { label: 'Nettoinkomst f. skatt',                       value:  result.netBeforeTax, isNet:   true  },
    { label: 'IRNR-skatt (19% på netto)',                   value: -result.tax                           },
    { label: 'Netto e. skatt',                              value:  result.netAfterTax,  isFinal: true  },
  ];
}

function buildBuyingCostRows(purchasePrice: number, costs: BuyingCostBreakdown): BuyingCostRow[] {
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
