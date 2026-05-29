import { Card, Stat, YearButton } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';
import { CurrencyWidget } from '../CurrencyWidget';
import { AIPanel } from '../ai';
import { useDashboard } from '../../hooks/useDashboard';
import { RevenueChart } from './RevenueChart';
import { PropertySidebar } from './PropertySidebar';
import { MarketSnapshot } from './MarketSnapshot';
import '../../styles/pages.css';

export function Dashboard() {
  const {
    properties, rentals,
    availableYears, selectedYear, setSelectedYear,
    selectedProperty, setSelectedProperty,
    chartData, platformData, kpis, alertMs, navigate,
  } = useDashboard();

  const { totalInvested, totalCurrentValue, unrealizedGain, totalRent, totalNights, totalExpCost, netIncome } = kpis;

  return (
    <div className="page">
      {alertMs.length > 0 && (
        <div className="ms-alert-banner" onClick={() => navigate('milestones')}>
          <span className="ms-alert-banner__icon">⏰</span>
          <span className="ms-alert-banner__text">
            {alertMs.filter(m => m.status === 'overdue').length > 0 && (
              <strong>{alertMs.filter(m => m.status === 'overdue').length} försenade</strong>
            )}
            {alertMs.filter(m => m.status === 'overdue').length > 0 && alertMs.filter(m => m.status === 'upcoming').length > 0 && ' · '}
            {alertMs.filter(m => m.status === 'upcoming').length > 0 && (
              <span>{alertMs.filter(m => m.status === 'upcoming').length} milstolpar inom 7 dagar</span>
            )}
          </span>
          <span className="ms-alert-banner__cta">Visa →</span>
        </div>
      )}

      <div className="page-header">
        <p className="page-eyebrow">Välkommen tillbaka</p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="page-title">Portföljöversikt</h1>
          <div className="flex items-center gap-2.5 flex-wrap">
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
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
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
      <div className="dashboard-grid">
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
    </div>
  );
}
