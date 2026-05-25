import { useState, useMemo } from 'react';
import { useApp } from '../../hooks/useApp';
import { Card, Stat, SectionHeader, Badge } from '../ui';
import { fmtMoney, fmtPct, calcPortfolioKPIs } from '../../utils/calc.utils';
import { MONTHS_SV, STATUS_LABELS, STATUS_COLORS, PLATFORM_COLORS } from '../../data';
import '../../styles/pages.css';
import { CurrencyWidget } from '../CurrencyWidget';
import { useMilestones, daysUntil } from '../../hooks/useMilestones';
import { AIPanel } from '../AIPanel';

const CURRENT_YEAR = new Date().getFullYear();

export function Dashboard() {
  const { state, navigate } = useApp();
  const { milestones } = useMilestones();
  const alertMs = milestones.filter(m => m.status === 'overdue' || (m.status === 'upcoming' && daysUntil(m.dueDate) <= 7));
  const overdueCount  = alertMs.filter(m => m.status === 'overdue').length;
  const upcomingCount = alertMs.filter(m => m.status === 'upcoming').length;
  const { properties, rentals, expenses } = state;

  const availableYears = useMemo(() => {
    const years = new Set(rentals.map(r => r.year));
    if (years.size === 0) years.add(CURRENT_YEAR);
    return Array.from(years).sort((a, b) => b - a);
  }, [rentals]);

  const [selectedYear,     setSelectedYear]     = useState<number>(() => availableYears[0] ?? CURRENT_YEAR);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');

  const filteredRentals = useMemo(() =>
    rentals.filter(r =>
      r.year === selectedYear &&
      (selectedProperty === 'all' || r.propertyId === selectedProperty)
    ), [rentals, selectedYear, selectedProperty]);

  const filteredExpenses = useMemo(() =>
    expenses.filter(e =>
      e.date.startsWith(String(selectedYear)) &&
      (selectedProperty === 'all' || e.propertyId === selectedProperty)
    ), [expenses, selectedYear, selectedProperty]);

  const chartData = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const month   = i + 1;
      const rows    = filteredRentals.filter(r => r.month === month);
      const revenue = rows.reduce((s, r) => s + r.revenue, 0);
      const nights  = rows.reduce((s, r) => s + r.nights, 0);
      return { month, label: MONTHS_SV[i], revenue, nights, hasData: revenue > 0 };
    }), [filteredRentals]);

  const maxRevenue   = Math.max(...chartData.map(d => d.revenue), 1);
  const totalRent    = filteredRentals.reduce((s, r) => s + r.revenue, 0);
  const totalNights  = filteredRentals.reduce((s, r) => s + r.nights, 0);
  const totalExpCost = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const netIncome    = totalRent - totalExpCost;
  const activeMonths = chartData.filter(d => d.hasData).length;
  const avgPerMonth  = activeMonths > 0 ? totalRent / activeMonths : 0;
  const avgAdr       = totalNights > 0 ? totalRent / totalNights : 0;

  const platformData = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of filteredRentals) acc[r.platform] = (acc[r.platform] ?? 0) + r.revenue;
    return Object.entries(acc).sort(([, a], [, b]) => b - a);
  }, [filteredRentals]);

  const { totalInvested, totalCurrentValue, unrealizedGain } = calcPortfolioKPIs(properties);

  const grossYieldEst = totalInvested > 0 && activeMonths > 0
    ? fmtPct(((totalRent / activeMonths * 12) / totalInvested) * 100)
    : '—';

  return (
    <div className="page">
      {alertMs.length > 0 && (
        <button
          type="button"
          className="flex items-center gap-2.5 w-full text-left bg-[#fff7ed] border border-[#fed7aa] rounded-md px-3 py-2.5 mb-4 cursor-pointer transition-colors duration-150 hover:bg-[#ffedd5]"
          onClick={() => navigate('milestones')}
        >
          <span className="text-[18px] flex-shrink-0">⏰</span>
          <span className="flex-1 text-[13px] text-[#92400e]">
            {overdueCount > 0 && <strong className="text-red">{overdueCount} försenade</strong>}
            {overdueCount > 0 && upcomingCount > 0 && ' · '}
            {upcomingCount > 0 && <span>{upcomingCount} milstolpar inom 7 dagar</span>}
          </span>
          <span className="text-[12px] font-semibold text-[#c2410c] whitespace-nowrap">Visa →</span>
        </button>
      )}

      <div className="page-header">
        <p className="page-eyebrow">Välkommen tillbaka</p>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="page-title">Portföljöversikt</h1>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="bg-bg-card border border-border rounded-md px-3 py-2 text-[13px] text-text cursor-pointer transition-colors duration-150 hover:border-border-hi focus:border-gold focus:outline-none"
              value={selectedProperty}
              onChange={e => setSelectedProperty(e.target.value)}
            >
              <option value="all">Alla fastigheter</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex gap-1">
              {availableYears.map(y => {
                const active = selectedYear === y;
                const base = 'px-3 py-1.5 text-[12px] rounded-md border transition-colors duration-150 cursor-pointer';
                const variant = active
                  ? 'bg-gold text-bg border-gold font-medium'
                  : 'bg-bg-card text-text-dim border-border hover:border-border-hi';
                return (
                  <button key={y} className={`${base} ${variant}`} onClick={() => setSelectedYear(y)}>{y}</button>
                );
              })}
            </div>
          </div>
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
      <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-5 mt-5">
        <Card className="card-p">
          <div className="flex items-center justify-between gap-3 mb-3">
            <SectionHeader title={`Hyresintäkt per månad · ${selectedYear}`} />
            {totalRent === 0 && (
              <p className="text-text-mute text-[12px] italic">Logga hyresintäkter på fastighetssidan för att se grafen.</p>
            )}
          </div>

          <div className="flex items-end gap-2.5 h-[140px] mb-2">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center h-full justify-end gap-1.5">
                <span className="text-[10px] text-gold min-h-[14px]">{d.revenue > 0 ? fmtMoney(d.revenue) : ''}</span>
                <div
                  className={`w-full rounded-t transition-[height] duration-[400ms] ease-in-out min-h-[3px] ${
                    d.hasData
                      ? 'bg-gradient-to-b from-gold to-gold/40'
                      : 'bg-border'
                  }`}
                  style={{ height: `${Math.max((d.revenue / maxRevenue) * 110, d.hasData ? 4 : 0)}px` }}
                  title={d.hasData ? `${d.label}: ${fmtMoney(d.revenue)} · ${d.nights} nätter` : undefined}
                />
                <span className={`text-[11px] ${d.hasData ? 'text-text-mute' : 'text-text-mute/50'}`}>{d.label}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3.5 flex gap-6 flex-wrap">
            {[
              { label: `Totalt ${selectedYear}`,  value: fmtMoney(totalRent),                     gold: true  },
              { label: 'Snitt / aktiv mån',       value: activeMonths > 0 ? fmtMoney(avgPerMonth) : '—' },
              { label: 'Snitt ADR',               value: avgAdr > 0 ? `${fmtMoney(avgAdr)}/natt` : '—' },
              { label: 'Yield (est.)',            value: grossYieldEst },
            ].map((s, i) => (
              <div key={i}>
                <label className="text-[11px] text-text-mute block">{s.label}</label>
                <p className={`text-[14px] mt-0.5 ${s.gold ? 'text-gold' : 'text-text'}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {platformData.length > 0 && (
            <div className="mt-5 flex flex-col gap-2">
              {platformData.map(([platform, revenue]) => (
                <div key={platform} className="grid grid-cols-[10px_minmax(80px,1fr)_minmax(0,2fr)_auto_auto] items-center gap-2.5 text-[12px]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PLATFORM_COLORS[platform] ?? 'var(--gold)' }} />
                  <span className="text-text-dim">{platform}</span>
                  <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{
                        width: `${(revenue / totalRent) * 100}%`,
                        background: PLATFORM_COLORS[platform] ?? 'var(--gold)',
                      }}
                    />
                  </div>
                  <span className="text-text tabular-nums">{fmtMoney(revenue)}</span>
                  <span className="text-text-mute tabular-nums w-[36px] text-right">{((revenue / totalRent) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Properties sidebar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-medium text-text-dim uppercase tracking-[1px]">Fastigheter</p>
            <button
              className="bg-transparent border-none p-0 text-[12px] text-gold cursor-pointer hover:underline"
              onClick={() => navigate('portfolio')}
            >
              Visa alla →
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            {properties.map(p => {
              const propRent = rentals
                .filter(r => r.propertyId === p.id && r.year === selectedYear)
                .reduce((s, r) => s + r.revenue, 0);
              return (
                <Card key={p.id} className="card-p-sm" hoverable onClick={() => navigate('property', p.id)}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-[14px] font-medium text-text">{p.name}</p>
                      <p className="text-[12px] text-text-mute mt-0.5">{p.area} · {p.bedrooms} sovrum</p>
                    </div>
                    <Badge label={STATUS_LABELS[p.status]} color={STATUS_COLORS[p.status]} />
                  </div>
                  <div className="flex items-baseline justify-between gap-2 mt-1">
                    <span className="text-[13px] text-text-dim">{fmtMoney(p.purchasePrice)}</span>
                    {propRent > 0 && (
                      <span className="text-[12px] text-gold">{fmtMoney(propRent)} hyra {selectedYear}</span>
                    )}
                  </div>
                </Card>
              );
            })}
            <Card className="card-p-sm card--dashed" hoverable onClick={() => navigate('portfolio')}>
              <p className="text-text-mute text-[13px]">+ Lägg till fastighet</p>
            </Card>
          </div>
        </div>

        {/* Currency widget */}
        <CurrencyWidget />
      </div>

      {/* AI-analys */}
      <AIPanel
        scope="portfolio"
        title="🤖 AI-rådgivning för portföljen"
        presets={[
          { key: 'portfolio-summary', icon: '📋', label: 'Lägesrapport'    },
          { key: 'cost-anomalies',    icon: '🔍', label: 'Kostnadsanalys'  },
          { key: 'next-quarter',      icon: '📅', label: 'Nästa kvartal'   },
        ]}
      />

      {/* Market snapshot */}
      <Card className="card-p mt-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-[15px] font-medium text-text">Marknadsöversikt · Costa del Sol</p>
          <span className="text-[11px] text-text-mute">Källa: Idealista / AirDNA 2025</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {[
            { label: 'Snitt €/kvm Estepona',  value: '€4 017', delta: '+8–10%/år',       positive: true  },
            { label: 'Airbnb beläggning',      value: '62%',    delta: '≈226 nätter/år',  positive: true  },
            { label: 'Snittdygn (ADR)',        value: '€146',   delta: 'Estepona 2024/25', positive: true  },
            { label: 'Prisutveckling 2y',      value: '+20%',   delta: 'Cancelada area',   positive: true  },
          ].map((m, i) => (
            <div key={i} className="p-3 bg-bg-subtle rounded-md">
              <p className="text-[11px] text-text-mute uppercase tracking-[0.5px]">{m.label}</p>
              <p className="text-[18px] font-medium text-text mt-1">{m.value}</p>
              <p className={`text-[11px] mt-0.5 ${m.positive ? 'text-green' : 'text-red'}`}>{m.delta}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
