// ── Forecast — kassaflödesprognos över 12 månader ───────────────────────────
//
// Visar:
//   - Saldo-linjegraf med startsaldo + månatlig saldoutveckling
//   - Sammanfattning (totalt in, totalt ut, slutsaldo, lägsta saldo)
//   - Detaljerad månadstabell med klickbara rader

import { useState } from 'react';
import { Card, SectionHeader, Stat } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';
import { useForecast } from '../../hooks/useForecast';
import type { ForecastMonth } from '../../types/forecast.types';

export function Forecast() {
  const {
    forecast, properties, startBalance, setStartBalance, propertyId, setPropertyId,
  } = useForecast();
  const { months, summary } = forecast;
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const isEmpty = properties.length === 0;
  if (isEmpty) {
    return (
      <Card className="card-p">
        <div className="empty-state">
          <p className="empty-state__icon">📊</p>
          <p className="empty-state__title">Lägg till fastigheter först</p>
          <p className="empty-state__sub">
            Prognosen behöver fastigheter med hyresintäkter och recurring-utgifter för att bygga sin baseline.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Inställningar */}
      <Card className="card-p">
        <SectionHeader title="Inställningar" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label mb-2">Startsaldo (€)</label>
            <input
              className="form-input"
              type="number"
              value={startBalance}
              onChange={e => setStartBalance(parseInt(e.target.value, 10) || 0)}
            />
            <p className="text-[11px] text-text-mute mt-1.5">Ditt bankkontosaldo just nu. Sparas lokalt på enheten.</p>
          </div>
          <div>
            <label className="form-label mb-2">Filtrera fastighet</label>
            <select
              className="form-input"
              value={propertyId}
              onChange={e => setPropertyId(e.target.value as string | 'all')}
            >
              <option value="all">Alla fastigheter</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="card-p-md">
          <Stat
            label="Slutsaldo (12 mån)"
            value={fmtMoney(summary.endBalance)}
            sub={`Från ${fmtMoney(startBalance)}`}
            color={summary.endBalance >= startBalance ? 'var(--green)' : 'var(--red)'}
          />
        </Card>
        <Card className="card-p-md">
          <Stat
            label="Totala intäkter"
            value={fmtMoney(summary.totalIncome)}
            sub="Förväntat (baseline + iCal)"
            color="var(--gold)"
          />
        </Card>
        <Card className="card-p-md">
          <Stat
            label="Totala utgifter"
            value={fmtMoney(summary.totalExpenses)}
            sub="Recurring + bolån + skatt"
            color="var(--red)"
          />
        </Card>
        <Card className="card-p-md">
          <Stat
            label="Lägsta saldo"
            value={fmtMoney(summary.minBalance)}
            sub={summary.minBalanceMonth}
            color={summary.minBalance < 0 ? 'var(--red)' : 'var(--text)'}
          />
        </Card>
      </div>

      {/* Linjegraf */}
      <Card className="card-p">
        <SectionHeader title="Saldoutveckling över 12 månader" />
        <BalanceLineChart months={months} startBalance={startBalance} />
      </Card>

      {/* Månadstabell */}
      <Card className="card-p">
        <SectionHeader title="Månad för månad" />
        <div className="flex flex-col gap-1.5">
          <div className="hidden md:grid grid-cols-[1fr_100px_100px_100px_100px_120px] gap-3 px-3 py-2 text-[10px] tracking-[1.5px] uppercase text-text-mute border-b border-border">
            <span>Månad</span>
            <span className="text-right">Intäkter</span>
            <span className="text-right">Bolån</span>
            <span className="text-right">Skatt</span>
            <span className="text-right">Netto</span>
            <span className="text-right">Saldo</span>
          </div>
          {months.map((m) => (
            <MonthRow
              key={`${m.year}-${m.month}`}
              month={m}
              expanded={expandedMonth === `${m.year}-${m.month}`}
              onToggle={() => setExpandedMonth(expandedMonth === `${m.year}-${m.month}` ? null : `${m.year}-${m.month}`)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Linjegraf med SVG ────────────────────────────────────────────────────────

function BalanceLineChart({ months, startBalance }: { months: ForecastMonth[]; startBalance: number }) {
  const W = 800, H = 200, PAD_X = 40, PAD_Y = 20;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;

  const allBalances = [startBalance, ...months.map(m => m.balanceEnd)];
  const max = Math.max(...allBalances, 0);
  const min = Math.min(...allBalances, 0);
  const range = max - min || 1;

  const xFor = (i: number) => PAD_X + (i / months.length) * innerW;
  const yFor = (v: number) => PAD_Y + (1 - (v - min) / range) * innerH;

  // Path för linje
  const points = [{ x: xFor(0), y: yFor(startBalance) }, ...months.map((m, i) => ({
    x: xFor(i + 1),
    y: yFor(m.balanceEnd),
  }))];
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join('');
  const areaPath = `${path}L${points[points.length - 1].x},${yFor(0)}L${PAD_X},${yFor(0)}Z`;

  const yZero = yFor(0);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[600px] h-[200px] block">
        <defs>
          <linearGradient id="balance-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axel: nollinje */}
        <line x1={PAD_X} y1={yZero} x2={W - PAD_X} y2={yZero} stroke="var(--border-hi)" strokeDasharray="4 4" />

        {/* Y-värden — topp/botten */}
        <text x={W - PAD_X + 4} y={PAD_Y + 4}        fontSize="10" fill="var(--text-mute)">{fmtCompact(max)}</text>
        <text x={W - PAD_X + 4} y={yZero + 4}        fontSize="10" fill="var(--text-mute)">0</text>
        <text x={W - PAD_X + 4} y={H - PAD_Y + 4}     fontSize="10" fill="var(--text-mute)">{fmtCompact(min)}</text>

        {/* Area + linje */}
        <path d={areaPath} fill="url(#balance-grad)" />
        <path d={path}     fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Punkter + X-labels */}
        {months.map((m, i) => (
          <g key={i}>
            <circle cx={xFor(i + 1)} cy={yFor(m.balanceEnd)} r="3" fill="var(--gold)" />
            {(i % 2 === 0) && (
              <text x={xFor(i + 1)} y={H - 4} fontSize="9" fill="var(--text-mute)" textAnchor="middle">
                {m.label.split(' ')[0]}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function fmtCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return `${n.toFixed(0)}`;
}

// ── Månadsrad ───────────────────────────────────────────────────────────────

function MonthRow({ month: m, expanded, onToggle }: { month: ForecastMonth; expanded: boolean; onToggle: () => void }) {
  const tag = m.isPast
    ? <span className="text-[10px] uppercase tracking-[1px] text-text-mute ml-2">historik</span>
    : m.isCurrent
    ? <span className="text-[10px] uppercase tracking-[1px] text-gold ml-2">nu</span>
    : null;

  const totalMortgage = m.mortgageInterest + m.mortgageAmort;

  return (
    <div className={`rounded-[8px] transition-colors duration-150 ${expanded ? 'bg-bg-subtle' : ''}`}>
      <button
        className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] md:grid-cols-[1fr_100px_100px_100px_100px_120px] gap-3 w-full px-3 py-2.5 text-left hover:bg-bg-subtle transition-colors duration-150 rounded-[8px] items-center"
        onClick={onToggle}
      >
        <span className="text-[13px] font-medium text-text flex items-center">
          {m.label}
          {tag}
        </span>
        <span className="text-[13px] text-right text-gold tabular-nums">{fmtMoney(m.rentalIncome)}</span>
        <span className="text-[13px] text-right text-text-dim tabular-nums">{totalMortgage > 0 ? `−${fmtMoney(totalMortgage)}` : '—'}</span>
        <span className="text-[13px] text-right text-text-dim tabular-nums">{m.taxPayment > 0 ? `−${fmtMoney(m.taxPayment)}` : '—'}</span>
        <span className={`text-[13px] font-semibold text-right tabular-nums ${m.netCashflow >= 0 ? 'text-green' : 'text-red'}`}>
          {m.netCashflow >= 0 ? '+' : '−'}{fmtMoney(Math.abs(m.netCashflow))}
        </span>
        <span className={`font-display text-[14px] text-right tabular-nums ${m.balanceEnd < 0 ? 'text-red' : 'text-text'}`}>
          {fmtMoney(m.balanceEnd)}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px]">
            <Detail label="Hyresintäkter"  value={fmtMoney(m.rentalIncome)}      color="var(--gold)" />
            <Detail label="Recurring"       value={`−${fmtMoney(m.recurringExpenses)}`} />
            <Detail label="Ad-hoc utgifter" value={m.oneOffExpenses > 0 ? `−${fmtMoney(m.oneOffExpenses)}` : '—'} />
            <Detail label="Bolåneränta"     value={m.mortgageInterest > 0 ? `−${fmtMoney(m.mortgageInterest)}` : '—'} />
            <Detail label="Amortering"      value={m.mortgageAmort > 0 ? `−${fmtMoney(m.mortgageAmort)}` : '—'} />
            <Detail label="Modelo 210"      value={m.taxPayment > 0 ? `−${fmtMoney(m.taxPayment)}` : '—'} color={m.taxPayment > 0 ? 'var(--red)' : undefined} />
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[1px] text-text-mute mb-0.5">{label}</p>
      <p className="text-[13px]" style={{ color }}>{value}</p>
    </div>
  );
}
