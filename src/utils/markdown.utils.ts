/**
 * Lättviktig markdown → HTML-renderare för AI-svar.
 * Stöder: rubriker, fet/kursiv text, listor, tabeller, kodspann, kodblock.
 * INTE en fullständig markdown-parser — avsedd för Claude:s strukturerade output.
 *
 * Säkerhet: escapar HTML i input innan markdown-konvertering så att rå HTML
 * från Claude inte renderas (defense-in-depth även om Claude svarar i ren markdown).
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderInline(s: string): string {
  return s
    // Code spans `code`
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold **text**
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic *text* (after bold)
    .replace(/(?<![*])\*([^*]+)\*(?![*])/g, '<em>$1</em>')
    // Länkar [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function renderTable(rows: string[]): string {
  // rows = ['| col1 | col2 |', '| --- | --- |', '| a | b |', ...]
  if (rows.length < 2) return rows.join('\n');

  const parseRow = (row: string) =>
    row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());

  const header  = parseRow(rows[0]);
  const bodyRows = rows.slice(2).map(parseRow);

  const headerHtml = '<tr>' + header.map(c => `<th>${renderInline(c)}</th>`).join('') + '</tr>';
  const bodyHtml   = bodyRows.map(r =>
    '<tr>' + r.map(c => `<td>${renderInline(c)}</td>`).join('') + '</tr>'
  ).join('');

  return `<table class="md-table"><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table>`;
}

export function renderMarkdown(md: string): string {
  const escaped = escapeHtml(md);
  const lines   = escaped.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Kodblock ```...```
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // hoppa över stängande ```
      out.push(`<pre><code>${codeLines.join('\n')}</code></pre>`);
      continue;
    }

    // Tabell — kolla om vi har minst två rader som ser ut som tabell
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\|[\s\-:|]+\|/.test(lines[i + 1].trim())) {
      const tableRows: string[] = [line];
      i++;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableRows.push(lines[i]);
        i++;
      }
      out.push(renderTable(tableRows));
      continue;
    }

    // Rubriker
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${renderInline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // Numrerade listor
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\d+\.\s+/, ''))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Punktlistor
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^[-*]\s+/, ''))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Horisontell linje
    if (/^---+$/.test(line.trim())) {
      out.push('<hr />');
      i++;
      continue;
    }

    // Tom rad
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Vanligt stycke — samla konsekutiva rader
    const paraLines: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== ''
           && !lines[i].trim().startsWith('#')
           && !lines[i].trim().startsWith('|')
           && !lines[i].trim().startsWith('```')
           && !/^\d+\.\s+/.test(lines[i])
           && !/^[-*]\s+/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    out.push(`<p>${renderInline(paraLines.join(' '))}</p>`);
  }

  return out.join('\n');
}
