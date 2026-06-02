// ── Bokningskalender — pure utility-funktioner ──────────────────────────────
//
// Tar rentals (med ev. checkin/checkout-datum från iCal) och bygger:
//   - Lista bookings per dag, per fastighet (för Gantt-rendering)
//   - Overlap-detektion mellan iCal-feeds (samma fastighet, samma dag)
//   - Lediga fönster (gap analysis)

import type { RentalEntry, RentalPlatform } from '../types';

export interface CalendarBooking {
  id:           string;
  propertyId:   string;
  platform:     RentalPlatform;
  startDate:    string;     // ISO YYYY-MM-DD (checkin)
  endDate:      string;     // ISO YYYY-MM-DD (checkout, exklusiv)
  nights:       number;
  revenue:      number;
  source:       'ical' | 'manual';
}

export interface DayCell {
  date:         string;     // YYYY-MM-DD
  bookings:     CalendarBooking[];
  hasOverlap:   boolean;
}

// ── Datum-helpers ────────────────────────────────────────────────────────────

export function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function parseIso(s: string): Date {
  return new Date(s + (s.length === 10 ? 'T00:00:00Z' : ''));
}

export function daysBetween(a: string, b: string): number {
  const ms = parseIso(b).getTime() - parseIso(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function addDays(iso: string, n: number): string {
  const d = parseIso(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return isoDate(d);
}

export function firstOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export function lastOfMonth(year: number, month: number): string {
  const next = new Date(Date.UTC(year, month, 1));   // month är 1-12, nästa månad
  next.setUTCDate(0);                                 // tillbaka en dag → sista i månaden
  return isoDate(next);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// ── Konvertera RentalEntry → CalendarBooking ────────────────────────────────

/**
 * Om checkin/checkout-datum finns: använd dem (iCal-import).
 * Annars: använd månadens första→sista som approximation (manuellt entry).
 */
export function toCalendarBookings(rentals: RentalEntry[]): CalendarBooking[] {
  return rentals.map(r => {
    if (r.checkinDate && r.checkoutDate) {
      return {
        id:         r.id,
        propertyId: r.propertyId,
        platform:   r.platform,
        startDate:  r.checkinDate,
        endDate:    r.checkoutDate,
        nights:     r.nights,
        revenue:    r.revenue,
        source:     'ical' as const,
      };
    }
    // Manuell: spann hela månaden
    return {
      id:         r.id,
      propertyId: r.propertyId,
      platform:   r.platform,
      startDate:  firstOfMonth(r.year, r.month),
      endDate:    addDays(lastOfMonth(r.year, r.month), 1), // exklusiv
      nights:     r.nights,
      revenue:    r.revenue,
      source:     'manual' as const,
    };
  });
}

// ── Bygg månadsmatris för en fastighet ──────────────────────────────────────

/**
 * Returnerar en lista DayCell för den givna månaden, med alla bookings
 * som täcker dagen och overlap-flagga om det finns 2+ från olika feeds.
 */
export function buildMonthGrid(
  bookings: CalendarBooking[],
  year:     number,
  month:    number,    // 1-12
): DayCell[] {
  const start = firstOfMonth(year, month);
  const days  = daysInMonth(year, month);

  return Array.from({ length: days }, (_, i) => {
    const date = addDays(start, i);
    const dayBookings = bookings.filter(b =>
      b.startDate <= date && date < b.endDate,
    );

    // Overlap = 2+ bookings, OCH minst en är från iCal (manuella spänner
    // hela månaden så de skulle annars alltid markeras som överlapp).
    const icalCount = dayBookings.filter(b => b.source === 'ical').length;
    const hasOverlap = icalCount > 1 || (icalCount >= 1 && dayBookings.length > icalCount);

    return { date, bookings: dayBookings, hasOverlap };
  });
}

// ── Statistik per månad ──────────────────────────────────────────────────────

export interface MonthSummary {
  totalNights:     number;
  occupiedDays:    number;       // antal dagar med minst 1 booking
  occupancyPct:    number;       // occupiedDays / totalDays × 100
  revenue:         number;
  overlapDays:     number;       // antal dagar med konflikt
  platformCounts:  Record<string, number>;  // antal nätter per plattform
}

export function summarizeMonth(grid: DayCell[], year: number, month: number): MonthSummary {
  const totalDays  = daysInMonth(year, month);
  let occupiedDays = 0;
  let overlapDays  = 0;
  const platforms: Record<string, number> = {};

  for (const cell of grid) {
    if (cell.bookings.length > 0) occupiedDays++;
    if (cell.hasOverlap) overlapDays++;
    for (const b of cell.bookings) {
      platforms[b.platform] = (platforms[b.platform] ?? 0) + 1;
    }
  }

  // Total revenue/nights från ALLA bookings vars startDate ligger i månaden
  // (annars dubbelräknas bokningar som spänner månadsgränser)
  const start = firstOfMonth(year, month);
  const end   = addDays(lastOfMonth(year, month), 1);
  const bookingsInMonth = new Set<string>();
  for (const cell of grid) {
    for (const b of cell.bookings) {
      if (b.startDate >= start && b.startDate < end) {
        bookingsInMonth.add(b.id);
      }
    }
  }
  let revenue = 0, totalNights = 0;
  const seenIds = new Set<string>();
  for (const cell of grid) {
    for (const b of cell.bookings) {
      if (bookingsInMonth.has(b.id) && !seenIds.has(b.id)) {
        seenIds.add(b.id);
        revenue     += b.revenue;
        totalNights += b.nights;
      }
    }
  }

  return {
    totalNights,
    occupiedDays,
    occupancyPct: totalDays > 0 ? (occupiedDays / totalDays) * 100 : 0,
    revenue,
    overlapDays,
    platformCounts: platforms,
  };
}

// ── Lediga fönster ───────────────────────────────────────────────────────────

export interface FreeWindow {
  startDate:    string;
  endDate:      string;
  nights:       number;
}

export function findFreeWindows(grid: DayCell[]): FreeWindow[] {
  const windows: FreeWindow[] = [];
  let runStart: string | null = null;

  for (const cell of grid) {
    if (cell.bookings.length === 0) {
      if (runStart === null) runStart = cell.date;
    } else if (runStart !== null) {
      const nights = daysBetween(runStart, cell.date);
      if (nights >= 1) {
        windows.push({ startDate: runStart, endDate: cell.date, nights });
      }
      runStart = null;
    }
  }
  // Avsluta öppen run i slutet av månaden
  if (runStart !== null && grid.length > 0) {
    const lastDate = grid[grid.length - 1].date;
    const endDate  = addDays(lastDate, 1);
    const nights   = daysBetween(runStart, endDate);
    if (nights >= 1) {
      windows.push({ startDate: runStart, endDate, nights });
    }
  }

  return windows;
}
