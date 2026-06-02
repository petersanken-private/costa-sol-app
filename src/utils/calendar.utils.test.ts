import { describe, it, expect } from 'vitest';
import {
  toCalendarBookings, buildMonthGrid, summarizeMonth, findFreeWindows,
  daysBetween, addDays, daysInMonth,
} from './calendar.utils';
import type { RentalEntry } from '../types';

describe('datumhelpers', () => {
  it('daysBetween räknar rätt', () => {
    expect(daysBetween('2026-06-01', '2026-06-08')).toBe(7);
    expect(daysBetween('2026-06-30', '2026-07-01')).toBe(1);
  });

  it('addDays hanterar månadsgränser', () => {
    expect(addDays('2026-06-30', 1)).toBe('2026-07-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('daysInMonth ger rätt antal', () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 2)).toBe(28);   // ej skottår
    expect(daysInMonth(2024, 2)).toBe(29);   // skottår
    expect(daysInMonth(2026, 4)).toBe(30);
  });
});

describe('toCalendarBookings', () => {
  it('använder checkin/checkout när de finns (iCal)', () => {
    const rentals: RentalEntry[] = [{
      id: 'r1', propertyId: 'p1', year: 2026, month: 6, nights: 5, revenue: 1000,
      platform: 'airbnb', checkinDate: '2026-06-10', checkoutDate: '2026-06-15',
    }];
    const [b] = toCalendarBookings(rentals);
    expect(b.startDate).toBe('2026-06-10');
    expect(b.endDate).toBe('2026-06-15');
    expect(b.source).toBe('ical');
  });

  it('approximerar till hela månaden för manuella entries', () => {
    const rentals: RentalEntry[] = [{
      id: 'r1', propertyId: 'p1', year: 2026, month: 6, nights: 10, revenue: 2000, platform: 'airbnb',
    }];
    const [b] = toCalendarBookings(rentals);
    expect(b.startDate).toBe('2026-06-01');
    expect(b.endDate).toBe('2026-07-01');   // exklusiv slutdag (nästa månad)
    expect(b.source).toBe('manual');
  });
});

describe('buildMonthGrid', () => {
  it('returnerar en cell per dag i månaden', () => {
    const grid = buildMonthGrid([], 2026, 6);
    expect(grid).toHaveLength(30);
    expect(grid[0].date).toBe('2026-06-01');
    expect(grid[29].date).toBe('2026-06-30');
  });

  it('placerar booking på rätt dagar (inklusiv start, exklusiv slut)', () => {
    const bookings = toCalendarBookings([{
      id: 'r1', propertyId: 'p1', year: 2026, month: 6, nights: 3, revenue: 600,
      platform: 'airbnb', checkinDate: '2026-06-10', checkoutDate: '2026-06-13',
    }]);
    const grid = buildMonthGrid(bookings, 2026, 6);
    expect(grid.find(c => c.date === '2026-06-09')?.bookings).toHaveLength(0);
    expect(grid.find(c => c.date === '2026-06-10')?.bookings).toHaveLength(1);
    expect(grid.find(c => c.date === '2026-06-11')?.bookings).toHaveLength(1);
    expect(grid.find(c => c.date === '2026-06-12')?.bookings).toHaveLength(1);
    expect(grid.find(c => c.date === '2026-06-13')?.bookings).toHaveLength(0);
  });

  it('flaggar overlap mellan 2 iCal-bookings', () => {
    const bookings = toCalendarBookings([
      { id: 'r1', propertyId: 'p1', year: 2026, month: 6, nights: 3, revenue: 600, platform: 'airbnb',
        checkinDate: '2026-06-10', checkoutDate: '2026-06-13' },
      { id: 'r2', propertyId: 'p1', year: 2026, month: 6, nights: 3, revenue: 700, platform: 'booking',
        checkinDate: '2026-06-12', checkoutDate: '2026-06-15' },
    ]);
    const grid = buildMonthGrid(bookings, 2026, 6);
    expect(grid.find(c => c.date === '2026-06-11')?.hasOverlap).toBe(false);
    expect(grid.find(c => c.date === '2026-06-12')?.hasOverlap).toBe(true);
    expect(grid.find(c => c.date === '2026-06-13')?.hasOverlap).toBe(false);
  });

  it('flaggar inte overlap för 2 manuella entries (de spänner hela månaden)', () => {
    const bookings = toCalendarBookings([
      { id: 'r1', propertyId: 'p1', year: 2026, month: 6, nights: 10, revenue: 600, platform: 'airbnb' },
      { id: 'r2', propertyId: 'p1', year: 2026, month: 6, nights: 5,  revenue: 500, platform: 'direct' },
    ]);
    const grid = buildMonthGrid(bookings, 2026, 6);
    expect(grid.find(c => c.date === '2026-06-15')?.hasOverlap).toBe(false);
  });
});

describe('summarizeMonth', () => {
  it('räknar nätter, occupancy och revenue', () => {
    const bookings = toCalendarBookings([
      { id: 'r1', propertyId: 'p1', year: 2026, month: 6, nights: 5, revenue: 1000,
        platform: 'airbnb', checkinDate: '2026-06-10', checkoutDate: '2026-06-15' },
    ]);
    const grid = buildMonthGrid(bookings, 2026, 6);
    const s = summarizeMonth(grid, 2026, 6);
    expect(s.totalNights).toBe(5);
    expect(s.occupiedDays).toBe(5);
    expect(s.revenue).toBe(1000);
    expect(s.occupancyPct).toBeCloseTo((5 / 30) * 100, 1);
    expect(s.platformCounts.airbnb).toBe(5);
  });

  it('dubbelräknar inte bokningar som spänner månadsgränser', () => {
    const bookings = toCalendarBookings([
      // Startar i maj, slutar i juni
      { id: 'r1', propertyId: 'p1', year: 2026, month: 5, nights: 10, revenue: 2000,
        platform: 'airbnb', checkinDate: '2026-05-28', checkoutDate: '2026-06-07' },
    ]);
    const gridJune = buildMonthGrid(bookings, 2026, 6);
    const s = summarizeMonth(gridJune, 2026, 6);
    // Booking startade i maj → räknas inte i juni-revenue
    expect(s.revenue).toBe(0);
    expect(s.occupiedDays).toBeGreaterThan(0);   // dagarna är ockuperade
  });
});

describe('findFreeWindows', () => {
  it('hittar gap mellan bookings', () => {
    const bookings = toCalendarBookings([
      { id: 'r1', propertyId: 'p1', year: 2026, month: 6, nights: 5, revenue: 0,
        platform: 'airbnb', checkinDate: '2026-06-05', checkoutDate: '2026-06-10' },
      { id: 'r2', propertyId: 'p1', year: 2026, month: 6, nights: 5, revenue: 0,
        platform: 'airbnb', checkinDate: '2026-06-20', checkoutDate: '2026-06-25' },
    ]);
    const grid    = buildMonthGrid(bookings, 2026, 6);
    const windows = findFreeWindows(grid);

    // 1-4 (4 dagar), 10-19 (10 dagar), 25-30 (6 dagar)
    expect(windows).toHaveLength(3);
    expect(windows[0]).toEqual({ startDate: '2026-06-01', endDate: '2026-06-05', nights: 4 });
    expect(windows[1]).toEqual({ startDate: '2026-06-10', endDate: '2026-06-20', nights: 10 });
    expect(windows[2]).toEqual({ startDate: '2026-06-25', endDate: '2026-07-01', nights: 6 });
  });

  it('hela månaden ledig → en window', () => {
    const grid    = buildMonthGrid([], 2026, 6);
    const windows = findFreeWindows(grid);
    expect(windows).toHaveLength(1);
    expect(windows[0].nights).toBe(30);
  });

  it('helt fullbokad → inga windows', () => {
    const bookings = toCalendarBookings([
      { id: 'r1', propertyId: 'p1', year: 2026, month: 6, nights: 30, revenue: 0,
        platform: 'airbnb', checkinDate: '2026-06-01', checkoutDate: '2026-07-01' },
    ]);
    const grid = buildMonthGrid(bookings, 2026, 6);
    expect(findFreeWindows(grid)).toHaveLength(0);
  });
});
