import { RentalEntry } from '../../types';
import { MONTHS_SV } from '../../data';
import { csvRow, downloadCsv, openPrintWindow, eur, today, slugify } from './_shared';

export function exportRentalsCsv(propertyName: string, rentals: RentalEntry[]): void {
  const header = csvRow(['År', 'Månad', 'Nätter', 'Intäkt (€)', 'Plattform', 'Snitt/natt (€)', 'Anteckning']);
  const rows   = rentals.map(r =>
    csvRow([r.year, MONTHS_SV[r.month - 1], r.nights, r.revenue, r.platform,
      Math.round(r.revenue / r.nights), r.notes ?? ''])
  );
  const total  = rentals.reduce((s, r) => s + r.revenue, 0);
  const nights = rentals.reduce((s, r) => s + r.nights, 0);
  rows.push(csvRow(['', 'TOTALT', nights, total, '', Math.round(total / (nights || 1))]));

  downloadCsv(`hyreshistorik-${slugify(propertyName)}-${today()}.csv`, [header, ...rows]);
}

export function exportRentalsPdf(propertyName: string, rentals: RentalEntry[]): void {
  const totalRevenue = rentals.reduce((s, r) => s + r.revenue, 0);
  const totalNights  = rentals.reduce((s, r) => s + r.nights, 0);
  const avgAdr       = totalNights > 0 ? totalRevenue / totalNights : 0;

  const rows = rentals.map(r => `<tr>
    <td>${r.year}</td>
    <td>${MONTHS_SV[r.month - 1]}</td>
    <td class="num">${r.nights}</td>
    <td class="num gold bold">${eur(r.revenue)}</td>
    <td>${r.platform}</td>
    <td class="num mute">${eur(Math.round(r.revenue / r.nights))}/natt</td>
    ${r.notes ? `<td class="mute">${r.notes}</td>` : '<td></td>'}
  </tr>`).join('');

  const html = `
    <h1>Hyreshistorik</h1>
    <p class="meta">${propertyName} · ${today()}</p>
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Total intäkt</div><div class="kpi-value gold">${eur(totalRevenue)}</div></div>
      <div class="kpi"><div class="kpi-label">Antal nätter</div><div class="kpi-value">${totalNights}</div></div>
      <div class="kpi"><div class="kpi-label">Snitt ADR</div><div class="kpi-value">${eur(Math.round(avgAdr))}/natt</div></div>
      <div class="kpi"><div class="kpi-label">Antal poster</div><div class="kpi-value">${rentals.length}</div></div>
    </div>
    <table>
      <thead><tr><th>År</th><th>Månad</th><th class="num">Nätter</th><th class="num">Intäkt</th><th>Plattform</th><th class="num">Snitt/natt</th><th>Not</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7" class="mute">Inga poster.</td></tr>'}</tbody>
      <tfoot><tr>
        <td class="bold" colspan="2">Totalt</td>
        <td class="num bold">${totalNights}</td>
        <td class="num bold gold">${eur(totalRevenue)}</td>
        <td></td>
        <td class="num bold">${eur(Math.round(avgAdr))}/natt</td>
        <td></td>
      </tr></tfoot>
    </table>`;

  openPrintWindow(`Hyreshistorik · ${propertyName}`, html);
}
