import { useState, useMemo } from 'react';
import { useApp } from './useApp';
import { useMilestones, daysUntil } from './useMilestones';
import { fmtPct, calcPortfolioKPIs } from '../utils/calc.utils';
import { MONTHS_SV, PLATFORM_COLORS } from '../data';

const CURRENT_YEAR = new Date().getFullYear();

// ── Typer ─────────────────────────────────────────────────────────────────────

export interface ChartBar {
  month:   number;
  label:   string;
  revenue: number;
  nights:  number;
  hasData: boolean;
}

export interface PlatformShare {
  platform:  string;
  revenue:   number;
  color:     string;
}

export interface DashboardKPIs {
  totalInvested:    number;
  totalCurrentValue:number;
  unrealizedGain:   number;
  totalRent:        number;
  totalNights:      number;
  totalExpCost:     number;
  netIncome:        number;
  activeMonths:     number;
  avgPerMonth:      number;
  avgAdr:           number;
  grossYieldEst:    string;
  maxRevenue:       number;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDashboard() {
  const { state, navigate } = useApp();
  const { milestones }      = useMilestones();
  const { properties, rentals, expenses } = state;

  // ── Filters ───────────────────────────────────────────────────────────────
  const availableYears = useMemo(() => {
    const years = new Set(rentals.map(r => r.year));
    if (years.size === 0) years.add(CURRENT_YEAR);
    return Array.from(years).sort((a, b) => b - a);
  }, [rentals]);

  const [selectedYear,     setSelectedYear]     = useState<number>(() => availableYears[0] ?? CURRENT_YEAR);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');

  // ── Derived data ──────────────────────────────────────────────────────────
  const filteredRentals = useMemo(() =>
    rentals.filter(r =>
      r.year === selectedYear &&
      (selectedProperty === 'all' || r.propertyId === selectedProperty),
    ), [rentals, selectedYear, selectedProperty]);

  const filteredExpenses = useMemo(() =>
    expenses.filter(e =>
      e.date.startsWith(String(selectedYear)) &&
      (selectedProperty === 'all' || e.propertyId === selectedProperty),
    ), [expenses, selectedYear, selectedProperty]);

  const chartData = useMemo<ChartBar[]>(() =>
    Array.from({ length: 12 }, (_, i) => {
      const month   = i + 1;
      const rows    = filteredRentals.filter(r => r.month === month);
      const revenue = rows.reduce((s, r) => s + r.revenue, 0);
      const nights  = rows.reduce((s, r) => s + r.nights, 0);
      return { month, label: MONTHS_SV[i], revenue, nights, hasData: revenue > 0 };
    }), [filteredRentals]);

  const platformData = useMemo<PlatformShare[]>(() => {
    const acc: Record<string, number> = {};
    for (const r of filteredRentals) acc[r.platform] = (acc[r.platform] ?? 0) + r.revenue;
    return Object.entries(acc)
      .sort(([, a], [, b]) => b - a)
      .map(([platform, revenue]) => ({
        platform,
        revenue,
        color: PLATFORM_COLORS[platform] ?? 'var(--gold)',
      }));
  }, [filteredRentals]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const { totalInvested, totalCurrentValue, unrealizedGain } = calcPortfolioKPIs(properties);

  const totalRent    = filteredRentals.reduce((s, r) => s + r.revenue, 0);
  const totalNights  = filteredRentals.reduce((s, r) => s + r.nights, 0);
  const totalExpCost = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const netIncome    = totalRent - totalExpCost;
  const activeMonths = chartData.filter(d => d.hasData).length;
  const avgPerMonth  = activeMonths > 0 ? totalRent / activeMonths : 0;
  const avgAdr       = totalNights > 0 ? totalRent / totalNights   : 0;
  const maxRevenue   = Math.max(...chartData.map(d => d.revenue), 1);

  const grossYieldEst = totalInvested > 0 && activeMonths > 0
    ? fmtPct(((totalRent / activeMonths * 12) / totalInvested) * 100)
    : '—';

  const kpis: DashboardKPIs = {
    totalInvested, totalCurrentValue, unrealizedGain,
    totalRent, totalNights, totalExpCost, netIncome,
    activeMonths, avgPerMonth, avgAdr, grossYieldEst, maxRevenue,
  };

  // ── Milstolpe-alertar ─────────────────────────────────────────────────────
  const alertMs = milestones.filter(
    m => m.status === 'overdue' || (m.status === 'upcoming' && daysUntil(m.dueDate) <= 7),
  );

  return {
    properties,
    rentals,
    availableYears,
    selectedYear,     setSelectedYear,
    selectedProperty, setSelectedProperty,
    chartData,
    platformData,
    kpis,
    alertMs,
    navigate,
  };
}
