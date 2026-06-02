// ── BookingCalendar ──────────────────────────────────────────────────────────
//
// Gantt-stil månadsvy: properties på Y-axeln, dagar på X-axeln.
// Färgkodade bokningsbarer per plattform. Overlap-flagga vid konflikter.
// Mobile: stackad lista per fastighet.

import { useState, useMemo } from 'react';
import { Card, SectionHeader, EmptyState, YearButton } from '../ui';
import { useApp } from '../../hooks/useApp';
import { fmtMoney } from '../../utils/calc.utils';
import { PLATFORM_COLORS, MONTHS_SV } from '../../data';
import {
  toCalendarBookings, buildMonthGrid, summarizeMonth, findFreeWindows,
  daysInMonth, addDays, firstOfMonth,
} from '../../utils/calendar.utils';
import type { CalendarBooking } from '../../utils/calendar.utils';
import type { Property } from '../../types';

const TODAY = new Date();

export function BookingCalendar() {
  const { state } = useApp();
  const now = TODAY;

  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const bookings = useMemo(() => toCalendarBookings(state.rentals), [state.rentals]);

  // KPI:er över hela månaden (alla fastigheter)
  const portfolioStats = useMemo(() => {
    const allGrid = buildMonthGrid(bookings, year, month);
    return summarizeMonth(allGrid, year, month);
  }, [bookings, year, month]);

  const totalOverlapDays = useMemo(() => {
    let total = 0;
    for (const p of state.properties) {
      const propBookings = bookings.filter(b => b.propertyId === p.id);
      const grid = buildMonthGrid(propBookings, year, month);
      total += grid.filter(c => c.hasOverlap).length;
    }
    return total;
  }, [bookings, state.properties, year, month]);

  function shiftMonth(delta: number) {
    const total = year * 12 + (month - 1) + delta;
    setYear(Math.floor(total / 12));
    setMonth((total % 12) + 1);
  }

  if (state.properties.length === 0) {
    return (
      <Card className="card-p">
        <EmptyState
          icon="📅"
          title="Inga fastigheter ännu"
          subtitle="Lägg till fastigheter och importera iCal-feeds för att se bokningar i kalendervy."
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Månadsnavigation */}
      <Card className="card-p">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 rounded-[6px] border border-border bg-bg-card text-text-dim text-[16px] hover:border-border-hi hover:text-text transition-all duration-150"
              onClick={() => shiftMonth(-1)}
              aria-label="Föregående månad"
            >‹</button>
            <span className="font-display text-[20px] text-text min-w-[140px] text-center">
              {MONTHS_SV[month - 1]} {year}
            </span>
            <button
              className="w-9 h-9 rounded-[6px] border border-border bg-bg-card text-text-dim text-[16px] hover:border-border-hi hover:text-text transition-all duration-150"
              onClick={() => shiftMonth(1)}
              aria-label="Nästa månad"
            >›</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <YearButton
              label="Idag"
              active={year === now.getFullYear() && month === now.getMonth() + 1}
              onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}
            />
          </div>
        </div>
      </Card>

      {/* Månadsstatistik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Bokade nätter"  value={`${portfolioStats.totalNights}`} sub={`av ${daysInMonth(year, month) * state.properties.length}`} color="var(--gold)" />
        <KpiCard label="Beläggning"      value={`${portfolioStats.occupancyPct.toFixed(0)}%`} sub={`${portfolioStats.occupiedDays} dagar`} />
        <KpiCard label="Intäkt"           value={fmtMoney(portfolioStats.revenue)} sub="Bokningar i månaden" color="var(--green)" />
        <KpiCard
          label="Konflikter"
          value={`${totalOverlapDays}`}
          sub={totalOverlapDays > 0 ? 'Dagar med 2+ iCal-bokningar' : 'Inga overlaps'}
          color={totalOverlapDays > 0 ? 'var(--red)' : undefined}
        />
      </div>

      {/* Plattform-legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {Object.entries(PLATFORM_COLORS).map(([platform, color]) => (
          <span key={platform} className="flex items-center gap-1.5 text-[12px] text-text-mute">
            <span className="w-3 h-3 rounded-[3px]" style={{ background: color }} />
            <span className="capitalize">{platform}</span>
          </span>
        ))}
      </div>

      {/* Gantt-vy per fastighet */}
      <Card className="card-p">
        <SectionHeader title="Bokningar per fastighet" />
        <div className="space-y-3">
          {state.properties.map(p => (
            <PropertyRow
              key={p.id}
              property={p}
              bookings={bookings.filter(b => b.propertyId === p.id)}
              year={year}
              month={month}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── KPI ─────────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <Card className="card-p-md">
      <p className="text-[10px] tracking-[1.5px] uppercase text-text-mute mb-1">{label}</p>
      <p className="font-display text-[22px] md:text-[26px] font-normal leading-none" style={{ color }}>{value}</p>
      <p className="text-[11px] text-text-mute mt-1">{sub}</p>
    </Card>
  );
}

// ── Property-rad (Gantt-vy) ─────────────────────────────────────────────────

function PropertyRow({
  property, bookings, year, month,
}: { property: Property; bookings: CalendarBooking[]; year: number; month: number }) {
  const grid       = buildMonthGrid(bookings, year, month);
  const summary    = summarizeMonth(grid, year, month);
  const days       = daysInMonth(year, month);
  const freeWindows = findFreeWindows(grid);

  // Bokningar att rendera som barer (klippta till månadens range)
  const monthStart = firstOfMonth(year, month);
  const monthEnd   = addDays(monthStart, days);   // exklusiv
  const visibleBookings = bookings.filter(b => b.startDate < monthEnd && b.endDate > monthStart);

  return (
    <div className="border border-border rounded-[10px] p-3 bg-bg-card">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div>
          <p className="font-medium text-[14px]">{property.name}</p>
          <p className="text-[12px] text-text-mute">
            {summary.totalNights} nätter · {summary.occupancyPct.toFixed(0)}% beläggning · {fmtMoney(summary.revenue)}
            {summary.overlapDays > 0 && <span className="text-red"> · ⚠ {summary.overlapDays} konfliktdagar</span>}
          </p>
        </div>
        {freeWindows.length > 0 && (
          <p className="text-[11px] text-text-mute">
            Längsta lediga fönster: <strong>{Math.max(...freeWindows.map(w => w.nights))} nätter</strong>
          </p>
        )}
      </div>

      {/* Gantt-spår */}
      <div className="relative bg-bg-subtle rounded-[6px] h-12 overflow-hidden">
        {/* Dagsnummer */}
        <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${days}, 1fr)` }}>
          {Array.from({ length: days }, (_, i) => {
            const date  = addDays(monthStart, i);
            const isToday = date === TODAY.toISOString().split('T')[0];
            const cell  = grid[i];
            return (
              <div key={i} className="border-r border-border last:border-r-0 flex items-start justify-center pt-0.5">
                <span className={[
                  'text-[9px] leading-none',
                  isToday ? 'text-gold font-semibold' : 'text-text-mute',
                  cell.hasOverlap ? '!text-red' : '',
                ].join(' ')}>{i + 1}</span>
              </div>
            );
          })}
        </div>

        {/* Bokningsbarer */}
        {visibleBookings.map((b, idx) => {
          const start  = b.startDate < monthStart ? monthStart : b.startDate;
          const end    = b.endDate > monthEnd   ? monthEnd   : b.endDate;
          const startIdx = parseInt(start.slice(8, 10), 10) - 1;
          const endIdx   = parseInt(end.slice(8, 10),   10) - 1;
          // Hantera bokningar som slutar i nästa månad
          const widthDays = (end === monthEnd) ? (days - startIdx) : (endIdx - startIdx);
          const leftPct   = (startIdx / days) * 100;
          const widthPct  = (widthDays / days) * 100;

          return (
            <div
              key={`${b.id}-${idx}`}
              className="absolute top-4 h-7 rounded-[4px] opacity-85 hover:opacity-100 transition-opacity duration-150 flex items-center justify-center cursor-default overflow-hidden"
              style={{
                left:       `${leftPct}%`,
                width:      `${widthPct}%`,
                background: PLATFORM_COLORS[b.platform] ?? 'var(--gold)',
              }}
              title={`${b.platform} · ${b.startDate} → ${b.endDate} · ${b.nights} nätter · ${fmtMoney(b.revenue)}${b.source === 'manual' ? ' (manuellt entry, exakt datum saknas)' : ''}`}
            >
              {widthPct > 10 && (
                <span className="text-[10px] text-white font-medium px-1.5 whitespace-nowrap">
                  {b.nights}n · {fmtMoney(b.revenue)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {freeWindows.length > 0 && (
        <details className="mt-2">
          <summary className="text-[11px] text-text-mute cursor-pointer hover:text-text-dim">
            Lediga fönster ({freeWindows.length})
          </summary>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {freeWindows.map((w, i) => (
              <li key={i} className="text-[11px] py-0.5 px-2 bg-bg-subtle rounded-[12px] border border-border">
                {w.startDate.slice(8, 10)}–{w.endDate === addDays(w.startDate, w.nights) ? parseInt(w.endDate.slice(8, 10), 10) - 1 : w.endDate.slice(8, 10)} ({w.nights}n)
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
