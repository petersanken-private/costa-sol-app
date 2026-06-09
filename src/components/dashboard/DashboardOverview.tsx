// DashboardOverview — den ursprungliga "Översikt"-vyn på Dashboard.
// Extraherad så att Dashboard.tsx kan ha tabs (Översikt / Prognos).

import { Card, Stat, YearButton, HeroValue } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';
import { CurrencyWidget } from '../CurrencyWidget';
import { AIPanel } from '../ai';
import { useDashboard } from '../../hooks/useDashboard';
import { useApp } from '../../hooks/useApp';
import { RevenueChart } from './RevenueChart';
import { PropertySidebar } from './PropertySidebar';
import { MarketSnapshot } from './MarketSnapshot';
import { OwnerSplitStrip } from './OwnerSplitStrip';

export function DashboardOverview() {
  const {
    properties, rentals,
    availableYears, selectedYear, setSelectedYear,
    selectedProperty, setSelectedProperty,
    chartData, platformData, kpis, navigate,
  } = useDashboard();
  const { state } = useApp();

  const { totalInvested, totalCurrentValue, unrealizedGain, totalRent, totalNights, totalExpCost, netIncome } = kpis;

  const gainPct = totalInvested > 0 ? (unrealizedGain / totalInvested) * 100 : 0;
  const gainPositive = unrealizedGain >= 0;
  const directYield = totalInvested > 0 ? (netIncome / totalInvested) * 100 : 0;
  const fmtPct1 = (n: number) => `${n >= 0 ? '' : '−'}${Math.abs(n).toFixed(1).replace('.', ',')} %`;

  return (
    <>
      <div className="flex items-center gap-2.5 flex-wrap mb-5">
        <select
          className="bg-bg-card border border-border rounded-[6px] text-text-dim text-[13px] py-[7px] px-3 shadow-sm transition-colors duration-150 hover:border-border-hi focus:border-border-hi focus:outline-none"
          value={selectedProperty}
          onChange={e => setSelectedProperty(e.target.value)}
        >
          <option value="all">Alla fastigheter</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="flex gap-2 flex-wrap">
          {availableYears.map(y => (
            <YearButton key={y} label={y} active={selectedYear === y} onClick={() => setSelectedYear(y)} />
          ))}
        </div>
      </div>

      {/* Hero — portföljvärde + nyckeltal */}
      <Card className="px-6 py-7 md:px-9 md:py-8 mb-5">
        <div className="grid md:grid-cols-2 gap-7">
          <div>
            <p className="text-[11px] tracking-[2px] uppercase text-text-mute mb-3.5">Portföljvärde</p>
            <HeroValue value={fmtMoney(totalCurrentValue)} />
            <div className="flex items-center gap-2.5 mt-4 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-[13px] font-semibold py-[5px] px-2.5 rounded-[8px] ${
                  gainPositive ? 'bg-green-soft text-green' : 'bg-red-soft text-red'
                }`}
              >
                {gainPositive ? '▲' : '▼'} {gainPositive ? '+' : ''}{fmtMoney(unrealizedGain)}
              </span>
              <span className="text-[13px] text-text-dim">{fmtPct1(gainPct)} orealiserat sedan köp</span>
            </div>
          </div>
          <div className="md:border-l md:border-border md:pl-7">
            <p className="text-[11px] tracking-[2px] uppercase text-text-mute mb-3.5">
              Hyresintäkt · {selectedYear}
            </p>
            <p className="font-display text-[38px] font-normal leading-none tracking-[-0.3px] text-text">
              {fmtMoney(totalRent)}
            </p>
            <p className="text-[13px] text-text-dim mt-3">
              {totalNights > 0 ? `${totalNights} uthyrda nätter` : 'Ingen uthyrning ännu'}
              {netIncome !== 0 && ` · netto ${fmtMoney(netIncome)}`}
            </p>
          </div>
        </div>
      </Card>

      {/* KPI strip — joined 1px-delad stat-grid */}
      <div className="stat-grid mb-7">
        <div className="stat-cell">
          <Stat label="Totalt investerat" value={fmtMoney(totalInvested)} sub={`${properties.length} fastigheter`} />
        </div>
        <div className="stat-cell">
          <Stat
            label={`Hyresintäkt ${selectedYear}`}
            value={fmtMoney(totalRent)}
            sub={totalNights > 0 ? `${totalNights} uthyrda nätter` : 'Ingen data ännu'}
            color={totalRent > 0 ? 'var(--green)' : undefined}
          />
        </div>
        <div className="stat-cell">
          <Stat
            label={`Netto ${selectedYear}`}
            value={fmtMoney(netIncome)}
            sub={`Kostnader: −${fmtMoney(totalExpCost)}`}
            color={netIncome >= 0 ? 'var(--green)' : 'var(--red)'}
          />
        </div>
        <div className="stat-cell">
          <Stat
            label="Direktavkastning"
            value={fmtPct1(directYield)}
            sub="Netto / investerat"
            color={directYield >= 0 ? 'var(--green)' : 'var(--red)'}
          />
        </div>
      </div>

      {/* Per-ägare-split (visas bara om någon fastighet har 2+ delägare) */}
      <OwnerSplitStrip
        properties={properties}
        rentals={rentals}
        expenses={state.expenses}
        year={selectedYear}
      />

      {/* Main grid */}
      <div className="grid grid-cols-[1fr_340px] max-md:grid-cols-1 gap-5 mt-5">
        <Card className="card-p">
          <RevenueChart
            year={selectedYear}
            chartData={chartData}
            platformData={platformData}
            kpis={kpis}
          />
        </Card>

        <PropertySidebar
          properties={properties}
          rentals={rentals}
          selectedYear={selectedYear}
          navigate={navigate}
        />

        <CurrencyWidget />
      </div>

      <AIPanel
        scope="portfolio"
        title="🤖 AI-rådgivning för portföljen"
        presets={[
          { key: 'portfolio-summary', icon: '📋', label: 'Lägesrapport'   },
          { key: 'cost-anomalies',    icon: '🔍', label: 'Kostnadsanalys' },
          { key: 'next-quarter',      icon: '📅', label: 'Nästa kvartal'  },
        ]}
      />

      <MarketSnapshot />
    </>
  );
}
