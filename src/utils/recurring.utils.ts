import { RecurringExpense, Expense } from '../types';

/**
 * Beräknar nästa due-date för en återkommande utgift.
 * Returnerar null om ingen mer ska genereras (efter endDate eller inactive).
 */
export function nextDueDate(rec: RecurringExpense, after: string): string | null {
  if (!rec.active) return null;
  if (rec.endDate && after >= rec.endDate) return null;

  const [yStr, mStr] = after.split('-');
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10);
  const d = rec.dayOfMonth;

  function fmt(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  if (rec.frequency === 'monthly') {
    m++;
    if (m > 12) { m = 1; y++; }
    return fmt(y, m, d);
  }

  if (rec.frequency === 'quarterly') {
    m += 3;
    while (m > 12) { m -= 12; y++; }
    return fmt(y, m, d);
  }

  // yearly — använd monthOfYear om angivet, annars månaden från startdatumet
  if (rec.frequency === 'yearly') {
    const targetMonth = rec.monthOfYear ?? parseInt(rec.startDate.split('-')[1], 10);
    return fmt(y + 1, targetMonth, d);
  }

  return null;
}

/**
 * Genererar alla saknade Expense-poster från en återkommande mall,
 * från sista genererade datumet (eller startdatum) fram till idag.
 *
 * Returnerar { expenses: nya att infoga, nextLastGenerated: värde att spara på mallen }.
 */
export function generateMissingExpenses(
  rec: RecurringExpense,
  today: string,
): { expenses: Omit<Expense, 'id'>[]; nextLastGenerated: string | null } {
  if (!rec.active) return { expenses: [], nextLastGenerated: rec.lastGeneratedDate ?? null };

  const expenses: Omit<Expense, 'id'>[] = [];
  let cursor = rec.lastGeneratedDate ?? null;

  // Om aldrig genererat — använd startdatumet som första post (om det är i det förflutna)
  if (!cursor) {
    if (rec.startDate <= today) {
      expenses.push({
        propertyId:  rec.propertyId,
        date:        rec.startDate,
        category:    rec.category,
        amount:      rec.amount,
        description: rec.description,
        deductible:  rec.deductible,
      });
      cursor = rec.startDate;
    } else {
      return { expenses: [], nextLastGenerated: null };
    }
  }

  // Generera framåt tills vi når idag eller endDate
  while (true) {
    const next = nextDueDate(rec, cursor);
    if (!next || next > today) break;
    expenses.push({
      propertyId:  rec.propertyId,
      date:        next,
      category:    rec.category,
      amount:      rec.amount,
      description: rec.description,
      deductible:  rec.deductible,
    });
    cursor = next;
  }

  return { expenses, nextLastGenerated: cursor };
}

/**
 * Mänskligt läsbart sammandrag av frekvens.
 */
export function frequencyLabel(rec: RecurringExpense): string {
  const monthNames = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
  switch (rec.frequency) {
    case 'monthly':
      return `Varje månad den ${rec.dayOfMonth}:e`;
    case 'quarterly':
      return `Var tredje månad den ${rec.dayOfMonth}:e`;
    case 'yearly': {
      const m = rec.monthOfYear ?? parseInt(rec.startDate.split('-')[1], 10);
      return `Årligen i ${monthNames[m - 1]} (den ${rec.dayOfMonth}:e)`;
    }
  }
}

/**
 * Beräknar årlig kostnad för rapportering (årlig schablonsumma av återkommande).
 */
export function annualizedCost(rec: RecurringExpense): number {
  switch (rec.frequency) {
    case 'monthly':   return rec.amount * 12;
    case 'quarterly': return rec.amount * 4;
    case 'yearly':    return rec.amount;
  }
}
