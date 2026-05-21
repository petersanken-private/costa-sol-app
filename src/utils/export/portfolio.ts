import { Property } from '../../types';
import { STATUS_LABELS } from '../../data';
import { csvRow, downloadCsv, openPrintWindow, eur, today, assertNotEmpty } from './_shared';

export function exportPortfolioCsv(properties: Property[]): void {
  if (!assertNotEmpty(properties, 'fastigheter')) return;
  const header = csvRow(['Namn', 'Område', 'Typ', 'Status', 'Sovrum', 'Storlek (kvm)',
    'Köpeskilling (€)', 'Nuv. värde (€)', 'Värdeutveckling (€)', 'VFT-licens', 'Strategi', 'Anteckningar']);

  const rows = properties.map(p =>
    csvRow([
      p.name, p.area, p.type, STATUS_LABELS[p.status] ?? p.status,
      p.bedrooms, p.sizeSqm,
      p.purchasePrice, p.currentValue, p.currentValue - p.purchasePrice,
      p.hasVFTLicense ? 'Ja' : 'Nej',
      p.rentalStrategy,
      p.notes ?? '',
    ])
  );

  downloadCsv(`costa-sol-portfolio-${today()}.csv`, [header, ...rows]);
}

export function exportPortfolioPdf(properties: Property[]): void {
  if (!assertNotEmpty(properties, 'fastigheter')) return;
  const totalInvested = properties.reduce((s, p) => s + p.purchasePrice, 0);
  const totalValue    = properties.reduce((s, p) => s + p.currentValue, 0);
  const totalGain     = totalValue - totalInvested;

  const rows = properties.map(p => {
    const gain = p.currentValue - p.purchasePrice;
    return `<tr>
      <td>${p.name}<br><span class="mute">${p.area} · ${p.bedrooms} rum · ${p.sizeSqm}m²</span></td>
      <td>${STATUS_LABELS[p.status] ?? p.status}</td>
      <td class="num gold">${eur(p.purchasePrice)}</td>
      <td class="num">${eur(p.currentValue)}</td>
      <td class="num ${gain >= 0 ? 'green' : 'red'}">${gain >= 0 ? '+' : '−'}${eur(gain)}</td>
      <td>${p.hasVFTLicense ? '✓ Ja' : '—'}</td>
    </tr>`;
  }).join('');

  const html = `
    <h1>Portföljöversikt</h1>
    <p class="meta">Costa Sol · ${today()} · ${properties.length} fastigheter</p>
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Totalt investerat</div><div class="kpi-value gold">${eur(totalInvested)}</div></div>
      <div class="kpi"><div class="kpi-label">Nuvarande värde</div><div class="kpi-value">${eur(totalValue)}</div></div>
      <div class="kpi"><div class="kpi-label">Orealiserad vinst</div><div class="kpi-value ${totalGain >= 0 ? 'green' : 'red'}">${totalGain >= 0 ? '+' : '−'}${eur(totalGain)}</div></div>
      <div class="kpi"><div class="kpi-label">Fastigheter</div><div class="kpi-value">${properties.length}</div></div>
    </div>
    <table>
      <thead><tr>
        <th>Fastighet</th><th>Status</th><th class="num">Köpeskilling</th>
        <th class="num">Nuv. värde</th><th class="num">Värdeutveckling</th><th>VFT</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr>
        <td class="bold">Totalt</td><td></td>
        <td class="num bold gold">${eur(totalInvested)}</td>
        <td class="num bold">${eur(totalValue)}</td>
        <td class="num bold ${totalGain >= 0 ? 'green' : 'red'}">${totalGain >= 0 ? '+' : '−'}${eur(totalGain)}</td>
        <td></td>
      </tr></tfoot>
    </table>`;

  openPrintWindow('Portföljöversikt', html);
}
