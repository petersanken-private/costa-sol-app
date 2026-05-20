// ── Delade hjälpfunktioner för export (CSV + PDF) ─────────────────────────────

export function csvRow(cells: (string | number)[]): string {
  return cells
    .map(c => {
      const s = String(c ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    })
    .join(',');
}

export function downloadCsv(filename: string, rows: string[]): void {
  const bom     = '﻿'; // UTF-8 BOM så Excel läser svenska tecken korrekt
  const content = bom + rows.join('\n');
  const blob    = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const PRINT_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 12px;
    color: #1a1a1a;
    padding: 32px 40px;
  }
  h1 { font-size: 22px; font-weight: 600; margin-bottom: 4px; }
  h2 { font-size: 15px; font-weight: 600; margin: 24px 0 10px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
  .meta { font-size: 11px; color: #777; margin-bottom: 28px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { text-align: left; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #999; border-bottom: 2px solid #eee; padding: 6px 10px; }
  td { padding: 9px 10px; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
  tr:last-child td { border-bottom: none; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .bold { font-weight: 600; }
  .gold { color: #b8860b; }
  .red  { color: #c0392b; }
  .green { color: #27ae60; }
  .mute { color: #888; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 28px; }
  .kpi { background: #f9f9f9; border-radius: 6px; padding: 14px; }
  .kpi-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 6px; }
  .kpi-value { font-size: 20px; font-weight: 600; }
  .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
  .summary-row:last-child { border-bottom: none; }
  .total-row { font-weight: 600; border-top: 2px solid #ddd; margin-top: 8px; padding-top: 8px; }
  .footer { margin-top: 40px; font-size: 10px; color: #bbb; text-align: center; }
  @media print {
    body { padding: 0; }
    @page { margin: 20mm; }
  }
`;

export function openPrintWindow(title: string, html: string): void {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(`<!doctype html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>
  ${html}
  <div class="footer">Genererat av Costa Sol · ${new Date().toLocaleDateString('sv-SE')}</div>
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`);
  win.document.close();
}

// ── Formatters ────────────────────────────────────────────────────────────────

export const eur   = (n: number) => '€' + Math.abs(n).toLocaleString('sv-SE', { maximumFractionDigits: 0 });
export const pct   = (n: number) => n.toFixed(1) + '%';
export const today = () => new Date().toLocaleDateString('sv-SE');

export function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
