import { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { Card, Stat, SectionHeader, Badge } from '../components/ui';
import { fmtMoney, fmtPct, calcPortfolioKPIs } from '../utils/calc.utils';
import { MONTHS_SV, STATUS_LABELS, STATUS_COLORS, PLATFORM_COLORS } from '../data';
import '../styles/pages.css';
import { CurrencyWidget } from '../components/CurrencyWidget';
import { useMilestones, daysUntil } from '../hooks/useMilestones';
import { AIPanel } from '../components/AIPanel';

const CURRENT_YEAR = new Date().getFullYear();

export function Dashboard() {
  const { state, navigate } = useApp();
  const { milestones } = useMilestones();
  const alertMs = milestones.filter(m => m.status === 'overdue' || (m.status === 'upcoming' && daysUntil(m.dueDate) <= 7));
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
        <div className="dashboard-top-bar">
          <h1 className="page-title">Portföljöversikt</h1>
          <div className="dashboard-filters">
            <select
              className="dash-filter-select"
              value={selectedProperty}
              onChange={e => setSelectedProperty(e.target.value)}
            >
              <option value="all">Alla fastigheter</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="year-btns">
              {availableYears.map(y => (
                <button
                  key={y}
                  className={`year-btn ${selectedYear === y ? 'year-btn--active' : ''}`}
                  onClick={() => setSelectedYear(y)}
                >{y}</button>
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
          <div className="chart-header">
            <SectionHeader title={`Hyresintäkt per månad · ${selectedYear}`} />
            {totalRent === 0 && (
              <p className="chart-empty-hint">Logga hyresintäkter på fastighetssidan för att se grafen.</p>
            )}
          </div>

          <div className="chart-bars">
            {chartData.map((d, i) => (
              <div key={i} className="chart-bar-col">
                <span className="chart-bar-label">{d.revenue > 0 ? fmtMoney(d.revenue) : ''}</span>
                <div
                  className={`chart-bar ${!d.hasData ? 'chart-bar--empty' : ''}`}
                  style={{ height: `${Math.max((d.revenue / maxRevenue) * 110, d.hasData ? 4 : 0)}px` }}
                  title={d.hasData ? `${d.label}: ${fmtMoney(d.revenue)} · ${d.nights} nätter` : undefined}
                />
                <span className={`chart-month ${d.hasData ? '' : 'chart-month--empty'}`}>{d.label}</span>
              </div>
            ))}
          </div>

          <div className="chart-footer">
            <div className="chart-footer-stat">
              <label>Totalt {selectedYear}</label>
              <p className="text-gold">{fmtMoney(totalRent)}</p>
            </div>
            <div className="chart-footer-stat">
              <label>Snitt / aktiv mån</label>
              <p>{activeMonths > 0 ? fmtMoney(avgPerMonth) : '—'}</p>
            </div>
            <div className="chart-footer-stat">
              <label>Snitt ADR</label>
              <p>{avgAdr > 0 ? `${fmtMoney(avgAdr)}/natt` : '—'}</p>
            </div>
            <div className="chart-footer-stat">
              <label>Yield (est.)</label>
              <p>{grossYieldEst}</p>
            </div>
          </div>

          {platformData.length > 0 && (
            <div className="platform-breakdown">
              {platformData.map(([platform, revenue]) => (
                <div key={platform} className="platform-bar-row">
                  <span className="platform-dot" style={{ background: PLATFORM_COLORS[platform] ?? 'var(--gold)' }} />
                  <span className="platform-name">{platform}</span>
                  <div className="platform-bar-track">
                    <div
                      className="platform-bar-fill"
                      style={{
                        width: `${(revenue / totalRent) * 100}%`,
                        background: PLATFORM_COLORS[platform] ?? 'var(--gold)',
                      }}
                    />
                  </div>
                  <span className="platform-amount">{fmtMoney(revenue)}</span>
                  <span className="platform-pct">{((revenue / totalRent) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Properties sidebar */}
        <div>
          <div className="properties-sidebar-header">
            <p className="properties-sidebar-title">Fastigheter</p>
            <button className="link-btn" onClick={() => navigate('portfolio')}>Visa alla →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {properties.map(p => {
              const propRent = rentals
                .filter(r => r.propertyId === p.id && r.year === selectedYear)
                .reduce((s, r) => s + r.revenue, 0);
              return (
                <Card key={p.id} className="card-p-sm" hoverable onClick={() => navigate('property', p.id)}>
                  <div className="property-card-meta">
                    <div>
                      <p className="property-card-name">{p.name}</p>
                      <p className="property-card-area">{p.area} · {p.bedrooms} sovrum</p>
                    </div>
                    <Badge label={STATUS_LABELS[p.status]} color={STATUS_COLORS[p.status]} />
                  </div>
                  <div className="property-card-price">
                    <span className="property-card-price-value">{fmtMoney(p.purchasePrice)}</span>
                    {propRent > 0 && (
                      <span className="property-card-rent text-gold">{fmtMoney(propRent)} hyra {selectedYear}</span>
                    )}
                  </div>
                </Card>
              );
            })}
            <Card className="card-p-sm card--dashed" hoverable onClick={() => navigate('portfolio')}>
              <p className="text-mute" style={{ fontSize: '13px' }}>+ Lägg till fastighet</p>
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
      <Card className="card-p" style={{ marginTop: '20px' }}>
        <div className="section-header">
          <p className="section-title">Marknadsöversikt · Costa del Sol</p>
          <span className="market-updated">Källa: Idealista / AirDNA 2025</span>
        </div>
        <div className="market-grid">
          {[
            { label: 'Snitt €/kvm Estepona',  value: '€4 017', delta: '+8–10%/år',       positive: true  },
            { label: 'Airbnb beläggning',      value: '62%',    delta: '≈226 nätter/år',  positive: true  },
            { label: 'Snittdygn (ADR)',        value: '€146',   delta: 'Estepona 2024/25', positive: true  },
            { label: 'Prisutveckling 2y',      value: '+20%',   delta: 'Cancelada area',   positive: true  },
          ].map((m, i) => (
            <div key={i} className="market-stat-item">
              <p className="market-stat-label">{m.label}</p>
              <p className="market-stat-value">{m.value}</p>
              <p className={`market-stat-delta ${m.positive ? 'text-green' : 'text-red'}`}>{m.delta}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
