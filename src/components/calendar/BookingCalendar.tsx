// ── BookingCalendar ──────────────────────────────────────────────────────────
//
// Gantt-stil månadsvy: properties på Y-axeln, dagar på X-axeln.
// Färgkodade bokningsbarer per plattform. Overlap-flagga vid konflikter.
// Mobile: stackad lista per fastighet.

import { useState, useMemo } from 'react';
import { Card, SectionHeader, EmptyState, YearButton, Stat, Icon } from '../ui';
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
      {/* Månadsnavigation — pill */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex items-center gap-1 border border-border rounded-pill bg-bg-card p-1">
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-dim hover:bg-bg-hover hover:text-text transition-all duration-150"
            onClick={() => shiftMonth(-1)}
            aria-label="Föregående månad"
          ><Icon name="chevron" size={16} className="rotate-180" /></button>
          <span className="font-display text-[19px] text-text min-w-[130px] text-center capitalize">
            {MONTHS_SV[month - 1]} {year}
          </span>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-dim hover:bg-bg-hover hover:text-text transition-all duration-150"
            onClick={() => shiftMonth(1)}
            aria-label="Nästa månad"
          ><Icon name="chevron" size={16} /></button>
        </div>
        <YearButton
          label="Idag"
          active={year === now.getFullYear() && month === now.getMonth() + 1}
          onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}
        />
      </div>

      {/* Månadsstatistik — joined stat-grid */}
      <div className="stat-grid">
        <div className="stat-cell"><Stat label="Bokade nätter" value={`${portfolioStats.totalNights}`} sub={`av ${daysInMonth(year, month) * state.properties.length}`} color="var(--green)" /></div>
        <div className="stat-cell"><Stat label="Beläggning"     value={`${portfolioStats.occupancyPct.toFixed(0)}%`} sub={`${portfolioStats.occupiedDays} dagar`} /></div>
        <div className="stat-cell"><Stat label="Intäkt"          value={fmtMoney(portfolioStats.revenue)} sub="Bokningar i månaden" color="var(--green)" /></div>
        <div className="stat-cell"><Stat label="Konflikter"      value={`${totalOverlapDays}`} sub={totalOverlapDays > 0 ? 'Dagar med 2+ iCal-bokningar' : 'Inga overlaps'} color={totalOverlapDays > 0 ? 'var(--red)' : undefined} /></div>
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
                  isToday ? 'text-green font-semibold' : 'text-text-mute',
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
                background: PLATFORM_COLORS[b.platform] ?? 'var(--green)',
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
