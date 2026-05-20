import { Property, RentalEntry, Expense } from '../../types';
import { MONTHS_SV, EXPENSE_LABELS } from '../../data';
import { TAX } from '../../constants/tax';
import { csvRow, downloadCsv, openPrintWindow, eur, pct, today } from './_shared';

export interface TaxData {
  year:        number;
  rentals:     RentalEntry[];
  expenses:    Expense[];
  properties:  Property[];
}

export function exportTaxCsv({ year, rentals, expenses, properties }: TaxData): void {
  const rows: string[] = [];

  // Section 1: Rental income
  rows.push(csvRow([`HYRESINTÄKTER ${year}`]));
  rows.push(csvRow(['Fastighet', 'År', 'Månad', 'Nätter', 'Intäkt (€)', 'Plattform']));
  for (const r of rentals) {
    const prop = properties.find(p => p.id === r.propertyId);
    rows.push(csvRow([prop?.name ?? r.propertyId, r.year, MONTHS_SV[r.month - 1], r.nights, r.revenue, r.platform]));
  }
  rows.push(csvRow(['', '', '', 'TOTALT:', rentals.reduce((s, r) => s + r.revenue, 0)]));
  rows.push(csvRow([]));

  // Section 2: Expenses
  rows.push(csvRow([`KOSTNADER ${year}`]));
  rows.push(csvRow(['Fastighet', 'Datum', 'Kategori', 'Beskrivning', 'Belopp (€)', 'Avdragsgill']));
  for (const e of expenses) {
    const prop = properties.find(p => p.id === e.propertyId);
    rows.push(csvRow([prop?.name ?? e.propertyId, e.date, EXPENSE_LABELS[e.category] ?? e.category, e.description, e.amount, e.deductible ? 'Ja' : 'Nej']));
  }
  const deductible = expenses.filter(e => e.deductible).reduce((s, e) => s + e.amount, 0);
  rows.push(csvRow(['', '', '', 'TOTALT AVDRAGSGILLT:', deductible]));
  rows.push(csvRow([]));

  // Section 3: Tax summary
  const grossIncome   = rentals.reduce((s, r) => s + r.revenue, 0);
  const netTaxable    = Math.max(0, grossIncome - deductible);
  const tax           = netTaxable * TAX.IRNR_EU_PCT;
  rows.push(csvRow([`MODELO 210 SAMMANFATTNING ${year}`]));
  rows.push(csvRow(['Post', 'Belopp (€)']));
  rows.push(csvRow(['Bruttointäkt', grossIncome]));
  rows.push(csvRow(['Avdragsgilla kostnader', -deductible]));
  rows.push(csvRow(['Beskattningsbar inkomst', netTaxable]));
  rows.push(csvRow(['Skattesats (IRNR EU/EEA)', `${(TAX.IRNR_EU_PCT * 100).toFixed(0)}%`]));
  rows.push(csvRow(['Beräknad skatt att betala', tax]));

  downloadCsv(`costa-sol-modelo210-${year}-${today()}.csv`, rows);
}

export function exportTaxPdf({ year, rentals, expenses, properties }: TaxData): void {
  const grossIncome   = rentals.reduce((s, r) => s + r.revenue, 0);
  const deductible    = expenses.filter(e => e.deductible).reduce((s, e) => s + e.amount, 0);
  const netTaxable    = Math.max(0, grossIncome - deductible);
  const tax           = netTaxable * TAX.IRNR_EU_PCT;
  const effectiveRate = grossIncome > 0 ? (tax / grossIncome) * 100 : 0;
  const ratePct       = (TAX.IRNR_EU_PCT * 100).toFixed(0);

  const rentalRows = rentals.map(r => {
    const prop = properties.find(p => p.id === r.propertyId);
    return `<tr>
      <td>${prop?.name ?? '—'}</td>
      <td>${MONTHS_SV[r.month - 1]} ${r.year}</td>
      <td>${r.nights}</td>
      <td class="num">${r.platform}</td>
      <td class="num gold bold">${eur(r.revenue)}</td>
    </tr>`;
  }).join('');

  const expenseRows = expenses.map(e => {
    const prop = properties.find(p => p.id === e.propertyId);
    return `<tr>
      <td>${prop?.name ?? '—'}</td>
      <td>${e.date}</td>
      <td>${EXPENSE_LABELS[e.category] ?? e.category}</td>
      <td>${e.description}</td>
      <td class="num red">−${eur(e.amount)}</td>
      <td class="${e.deductible ? 'green' : 'mute'}">${e.deductible ? '✓ Ja' : '—'}</td>
    </tr>`;
  }).join('');

  const html = `
    <h1>Modelo 210 · Skatteunderlag ${year}</h1>
    <p class="meta">Costa Sol · Genererat ${today()} · För gestor/skattemyndigheten</p>

    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Bruttointäkt</div><div class="kpi-value gold">${eur(grossIncome)}</div></div>
      <div class="kpi"><div class="kpi-label">Avdragsgilla kostn.</div><div class="kpi-value">${eur(deductible)}</div></div>
      <div class="kpi"><div class="kpi-label">Beskattningsbar ink.</div><div class="kpi-value">${eur(netTaxable)}</div></div>
      <div class="kpi"><div class="kpi-label">IRNR-skatt (${ratePct}%)</div><div class="kpi-value red">${eur(tax)}</div></div>
    </div>

    <h2>Hyresintäkter ${year}</h2>
    <table>
      <thead><tr><th>Fastighet</th><th>Period</th><th>Nätter</th><th class="num">Plattform</th><th class="num">Intäkt</th></tr></thead>
      <tbody>${rentalRows || '<tr><td colspan="5" class="mute">Inga hyresintäkter registrerade.</td></tr>'}</tbody>
      <tfoot><tr>
        <td class="bold" colspan="4">Totalt brutto</td>
        <td class="num bold gold">${eur(grossIncome)}</td>
      </tr></tfoot>
    </table>

    <h2>Kostnader ${year}</h2>
    <table>
      <thead><tr><th>Fastighet</th><th>Datum</th><th>Kategori</th><th>Beskrivning</th><th class="num">Belopp</th><th>Avdrag</th></tr></thead>
      <tbody>${expenseRows || '<tr><td colspan="6" class="mute">Inga kostnader registrerade.</td></tr>'}</tbody>
      <tfoot><tr>
        <td class="bold" colspan="4">Totalt avdragsgillt</td>
        <td class="num bold red">−${eur(deductible)}</td>
        <td></td>
      </tr></tfoot>
    </table>

    <h2>Sammanfattning Modelo 210</h2>
    <div class="summary-row"><span>Bruttointäkt hyra</span><span class="gold bold">${eur(grossIncome)}</span></div>
    <div class="summary-row"><span>Avdragsgilla kostnader (EU/EEA)</span><span class="red">−${eur(deductible)}</span></div>
    <div class="summary-row bold"><span>Beskattningsbar nettoinkomst</span><span>${eur(netTaxable)}</span></div>
    <div class="summary-row"><span>Skattesats IRNR (EU/EEA-medborgare)</span><span>${ratePct}%</span></div>
    <div class="summary-row bold total-row"><span>Beräknad skatt att betala</span><span class="red">${eur(tax)}</span></div>
    <div class="summary-row"><span>Effektiv skattesats</span><span class="mute">${pct(effectiveRate)}</span></div>
    <br>
    <p style="font-size:11px;color:#999;line-height:1.6">
      Blankett: <strong>Modelo 210</strong> · Deklarationsfrist: <strong>31 december ${year + 1}</strong> ·
      Skattesats ${ratePct}% gäller EU/EEA-medborgare. Anlita alltid en spansk gestor för korrekt inlämning.
    </p>`;

  openPrintWindow(`Modelo 210 · ${year}`, html);
}
