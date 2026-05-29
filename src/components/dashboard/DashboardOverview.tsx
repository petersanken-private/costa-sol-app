// DashboardOverview — den ursprungliga "Översikt"-vyn på Dashboard.
// Extraherad så att Dashboard.tsx kan ha tabs (Översikt / Prognos).

import { Card, Stat, YearButton } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';
import { CurrencyWidget } from '../CurrencyWidget';
import { AIPanel } from '../ai';
import { useDashboard } from '../../hooks/useDashboard';
import { RevenueChart } from './RevenueChart';
import { PropertySidebar } from './PropertySidebar';
import { MarketSnapshot } from './MarketSnapshot';

export function DashboardOverview() {
  const {
    properties, rentals,
    availableYears, selectedYear, setSelectedYear,
    selectedProperty, setSelectedProperty,
    chartData, platformData, kpis, navigate,
  } = useDashboard();

  const { totalInvested, totalCurrentValue, unrealizedGain, totalRent, totalNights, totalExpCost, netIncome } = kpis;

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

      {/* KPI strip */}
      <div className="grid-4 mb-7">
        <Card className="card-p-md">
          <Stat label="Totalt investerat" value={fmtMoney(totalInvested)} sub={`${properties.length} fastigheter`} />
        </Card>
        <Card className="card-p-md">
          <Stat
            label="Nuvarande värde"
            value={fmtMoney(totalCurrentValue)}
            sub={`${unrealizedGain >= 0 ? '+' : ''}${fmtMoney(unrealizedGain)} orealiserat`}
            color={unrealizedGain >= 0 ? 'var(--green)' : 'var(--red)'}
          />
        </Card>
        <Card className="card-p-md">
          <Stat
            label={`Hyresintäkt ${selectedYear}`}
            value={fmtMoney(totalRent)}
            sub={totalNights > 0 ? `${totalNights} uthyrda nätter` : 'Ingen data ännu'}
            color={totalRent > 0 ? 'var(--gold)' : undefined}
          />
        </Card>
        <Card className="card-p-md">
          <Stat
            label="Netto (hyra − kostn.)"
            value={fmtMoney(netIncome)}
            sub={`Kostnader: −${fmtMoney(totalExpCost)}`}
            color={netIncome >= 0 ? 'var(--green)' : 'var(--red)'}
          />
        </Card>
      </div>

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
