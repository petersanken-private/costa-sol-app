import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { Card, Stat, Tabs } from '../ui';
import { SCENARIOS, UNIT_PRESETS } from '../../data';
import { ScenarioKey } from '../../types';
import { fmtMoney, fmtPct, calcInvestment, calcBuyingCosts, calcProjection } from '../../utils/calc.utils';
import { buildCashflowRows, buildBuyingCostRows } from '../../utils/calculator.utils';
import { useMortgages } from '../../hooks/useMortgages';
import { MortgageCard } from './MortgageCard';
import {
  CashflowTab, ProjectionTab, TimelineTab, CostsTab, MonteCarloTab,
} from '.';

const CALC_TABS = [
  { id: 'cashflow',   label: 'Kassaflöde'   },
  { id: 'projection', label: 'Projektion'   },
  { id: 'timeline',   label: 'Tidslinje'    },
  { id: 'costs',      label: 'Köpkostnader' },
  { id: 'montecarlo', label: 'Monte Carlo'  },
];

const START_YEAR = new Date().getFullYear() + 1;

export function Calculator() {
  const { state } = useApp();
  const { items: mortgages } = useMortgages();

  const [selectedUnitId,   setSelectedUnitId]   = useState(UNIT_PRESETS[0].id);
  const [customPrice,      setCustomPrice]       = useState('');
  const [scenario,         setScenario]          = useState<ScenarioKey>('base');
  const [horizonYears,     setHorizonYears]      = useState(10);
  const [useMortgage,      setUseMortgage]       = useState(false);
  const [mortgagePct,      setMortgagePct]       = useState(60);
  const [mortgageRatePct,  setMortgageRatePct]   = useState(4.5);
  const [amortPct,         setAmortPct]          = useState(2);
  const [activeTab,        setActiveTab]         = useState('cashflow');

  const isCustom       = selectedUnitId === 'custom';
  const selectedPreset = UNIT_PRESETS.find(u => u.id === selectedUnitId);
  const purchasePrice  = isCustom
    ? (parseInt(customPrice.replace(/\D/g, ''), 10) || 500_000)
    : (selectedPreset?.purchasePrice ?? 780_000);

  const sc         = SCENARIOS.find(s => s.key === scenario)!;
  const result     = calcInvestment({ purchasePrice, scenario: sc, horizonYears, useMortgage, mortgagePct, mortgageRate: mortgageRatePct / 100 });
  const costs      = calcBuyingCosts(purchasePrice);
  const projection = calcProjection({
    purchasePrice, startYear: START_YEAR, horizonYears, scenario: sc,
    useMortgage, mortgagePct, mortgageRate: mortgageRatePct / 100,
    amortizationPct: amortPct, inflationPct: 2,
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
          Använd "Eget objekt" för att räkna på ett specifikt prospekt.
        </p>
      </div>

      {/* Unit selector */}
      <p className="form-label mb-2.5 uppercase tracking-[0.094em]">Välj objekt</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2.5">
        {UNIT_PRESETS.map(u => {
          const active = selectedUnitId === u.id;
          return (
            <button
              key={u.id}
              className={[
                'p-3.5 bg-bg-card border rounded-[10px] text-left transition-all duration-150 hover:border-border-hi',
                active ? '!border-gold bg-gold-faint' : 'border-border',
              ].join(' ')}
              onClick={() => setSelectedUnitId(u.id)}
            >
              <p className="text-[11px] text-text-mute uppercase tracking-[1px] mb-1">{u.label}</p>
              <p className="font-display text-[18px] max-md:text-[16px] text-gold">{fmtMoney(u.purchasePrice)}</p>
              <p className="text-[11px] text-text-mute mt-0.5">{u.sizeSqm}m² + {u.terraceSqm}m² terrass</p>
            </button>
          );
        })}
        <button
          className={[
            'p-3.5 bg-bg-card border-2 border-dashed rounded-[10px] text-left transition-all duration-150',
            isCustom ? '!border-solid !border-gold bg-gold-faint' : 'border-border hover:border-border-hi',
          ].join(' ')}
          onClick={() => setSelectedUnitId('custom')}
        >
          <p className="text-[11px] text-text-mute uppercase tracking-[1px] mb-1">Eget objekt</p>
          <input
            className="form-input mt-1.5"
            value={customPrice}
            placeholder="€ Pris..."
            onChange={e => { setCustomPrice(e.target.value); setSelectedUnitId('custom'); }}
            onClick={e => e.stopPropagation()}
          />
        </button>
      </div>

      {state.properties.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <span className="text-[11px] text-text-mute uppercase tracking-[1px]">Från portfölj:</span>
          {state.properties.map(p => (
            <button
              key={p.id}
              className="py-1.5 px-3 rounded-[20px] border border-border bg-bg-card text-text-mute text-[12px] transition-all duration-150 hover:border-border-hi hover:text-text-dim"
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
          <div className="flex flex-col gap-2">
            {SCENARIOS.map(s => (
              <button
                key={s.key}
                className="flex flex-col items-start gap-1 p-3 max-md:min-h-[48px] bg-bg-card border border-border rounded-[10px] text-left transition-all duration-150 hover:border-border-hi"
                style={{
                  borderColor: scenario === s.key ? s.color : undefined,
                  background:  scenario === s.key ? s.color + '15' : undefined,
                }}
                onClick={() => setScenario(s.key)}
              >
                <span className="text-[13px] font-medium text-text-dim" style={{ color: scenario === s.key ? s.color : undefined }}>
                  {s.label}
                </span>
                <span className="text-[11px] text-text-mute">
                  {s.nights} nätter · €{s.adr}/natt · +{s.annualGrowthPct}%/år
                </span>
              </button>
            ))}
          </div>
        </div>

        <MortgageCard
          mortgages={mortgages}
          properties={state.properties}
          purchasePrice={purchasePrice}
          horizonYears={horizonYears}      onHorizonChange={setHorizonYears}
          useMortgage={useMortgage}        onMortgageToggle={setUseMortgage}
          mortgageRatePct={mortgageRatePct} onRateChange={setMortgageRatePct}
          mortgagePct={mortgagePct}        onLtvChange={setMortgagePct}
          amortPct={amortPct}              onAmortChange={setAmortPct}
        />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Netto/år',                value: fmtMoney(result.netAfterTax),    color: result.netAfterTax > 0 ? sc.color : 'var(--red)' },
          { label: 'Nettoyield',              value: fmtPct(result.netYield),         color: sc.color },
          { label: `Exit (${horizonYears}å)`, value: fmtMoney(result.exitPrice),      color: 'var(--gold)' },
          { label: 'Totalavk. (ann.)',         value: fmtPct(result.annualizedReturn), color: sc.color },
        ].map((k, i) => (
          <Card key={i} className="card-p-md">
            <Stat label={k.label} value={k.value} color={k.color} />
          </Card>
        ))}
      </div>

      <Tabs tabs={CALC_TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'cashflow'   && <CashflowTab   rows={cashflowRows} scenarioColor={sc.color} />}
      {activeTab === 'projection' && <ProjectionTab projection={projection} scenarioColor={sc.color} horizonYears={horizonYears} amortPct={amortPct} />}
      {activeTab === 'timeline'   && <TimelineTab   result={result} purchasePrice={purchasePrice} scenario={sc} horizonYears={horizonYears} />}
      {activeTab === 'costs'      && <CostsTab      rows={buyingCostRows} />}
      {activeTab === 'montecarlo' && <MonteCarloTab purchasePrice={purchasePrice} scenario={sc} horizonYears={horizonYears} useMortgage={useMortgage} mortgagePct={mortgagePct} mortgageRatePct={mortgageRatePct} />}

      <p className="text-[12px] text-text-mute mt-6 text-center italic">
        Alla siffror är estimat baserade på marknadsdata. Konsultera alltid spansk gestor och advokat.
      </p>
    </div>
  );
}
