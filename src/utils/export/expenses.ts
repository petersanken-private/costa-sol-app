import { Expense } from '../../types';
import { EXPENSE_LABELS } from '../../data';
import { csvRow, downloadCsv, openPrintWindow, eur, pct, today, slugify } from './_shared';

export function exportExpensesCsv(propertyName: string, expenses: Expense[]): void {
  const header = csvRow(['Datum', 'Kategori', 'Beskrivning', 'Belopp (€)', 'Avdragsgill']);
  const rows   = expenses.map(e =>
    csvRow([e.date, EXPENSE_LABELS[e.category] ?? e.category, e.description, e.amount, e.deductible ? 'Ja' : 'Nej'])
  );
  const total      = expenses.reduce((s, e) => s + e.amount, 0);
  const deductible = expenses.filter(e => e.deductible).reduce((s, e) => s + e.amount, 0);
  rows.push(csvRow(['', 'TOTALT', '', total, '']));
  rows.push(csvRow(['', 'AVDRAGSGILLT', '', deductible, '']));

  downloadCsv(`kostnader-${slugify(propertyName)}-${today()}.csv`, [header, ...rows]);
}

export function exportExpensesPdf(propertyName: string, expenses: Expense[]): void {
  const total      = expenses.reduce((s, e) => s + e.amount, 0);
  const deductible = expenses.filter(e => e.deductible).reduce((s, e) => s + e.amount, 0);

  // Group by category for summary
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const expenseRows = expenses.map(e => `<tr>
    <td>${e.date}</td>
    <td>${EXPENSE_LABELS[e.category] ?? e.category}</td>
    <td>${e.description}</td>
    <td class="num red bold">−${eur(e.amount)}</td>
    <td class="${e.deductible ? 'green' : 'mute'}">${e.deductible ? '✓ Ja' : '—'}</td>
  </tr>`).join('');

  const categoryRows = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => `<tr>
      <td>${EXPENSE_LABELS[cat] ?? cat}</td>
      <td class="num red">−${eur(amt)}</td>
      <td class="num mute">${pct(total > 0 ? (amt / total) * 100 : 0)}</td>
    </tr>`).join('');

  const html = `
    <h1>Kostnadsrapport</h1>
    <p class="meta">${propertyName} · ${today()}</p>
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Totala kostnader</div><div class="kpi-value red">−${eur(total)}</div></div>
      <div class="kpi"><div class="kpi-label">Avdragsgillt</div><div class="kpi-value green">${eur(deductible)}</div></div>
      <div class="kpi"><div class="kpi-label">Ej avdragsgillt</div><div class="kpi-value">${eur(total - deductible)}</div></div>
      <div class="kpi"><div class="kpi-label">Antal poster</div><div class="kpi-value">${expenses.length}</div></div>
    </div>

    <h2>Alla kostnader</h2>
    <table>
      <thead><tr><th>Datum</th><th>Kategori</th><th>Beskrivning</th><th class="num">Belopp</th><th>Avdrag</th></tr></thead>
      <tbody>${expenseRows || '<tr><td colspan="5" class="mute">Inga kostnader.</td></tr>'}</tbody>
      <tfoot>
        <tr><td class="bold" colspan="3">Totalt</td><td class="num bold red">−${eur(total)}</td><td></td></tr>
        <tr><td class="bold" colspan="3">Avdragsgillt (IRNR)</td><td class="num bold green">${eur(deductible)}</td><td></td></tr>
      </tfoot>
    </table>

    <h2>Fördelning per kategori</h2>
    <table>
      <thead><tr><th>Kategori</th><th class="num">Belopp</th><th class="num">Andel</th></tr></thead>
      <tbody>${categoryRows}</tbody>
    </table>`;

  openPrintWindow(`Kostnadsrapport · ${propertyName}`, html);
}
