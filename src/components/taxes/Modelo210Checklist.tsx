// ── Modelo210Checklist ────────────────────────────────────────────────────────
// Deklarationsunderlag + viktiga datum för Modelo 210.

import { Card, SectionHeader, Badge } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';

interface Modelo210ChecklistProps {
  year:                number;
  grossIncome:         number;
  deductibleExpenses:  number;
  netTaxableIncome:    number;
  taxOwed:             number;
}

export function Modelo210Checklist({
  year, grossIncome, deductibleExpenses, netTaxableIncome, taxOwed,
}: Modelo210ChecklistProps) {
  const declRows = [
    { label: `Bruttohyresintäkt ${year}`, value: fmtMoney(grossIncome) },
    { label: 'Avdragsgilla kostnader',    value: `−${fmtMoney(deductibleExpenses)}` },
    { label: 'Beskattningsbar inkomst',   value: fmtMoney(netTaxableIncome) },
    { label: 'Skattesats (EU/EEA)',        value: '19%' },
    { label: 'Skatt att betala',           value: fmtMoney(taxOwed) },
  ];

  const dateRows = [
    { label: `Deklarera hyresintäkt ${year}`, date: `31 dec ${year + 1}` },
    { label: 'Blankett',                      date: 'Modelo 210' },
    { label: 'IBI-betalning',                  date: 'Aug–okt varje år' },
    { label: 'Gestor-rapport',                 date: 'Q1 varje år' },
    { label: '3% innehåll vid försäljning',   date: 'Modelo 211' },
  ];

  return (
    <Card className="card-p">
      <SectionHeader title="Modelo 210 – Deklarationsunderlag" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <p className="form-label" style={{ marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Att deklarera
          </p>
          {declRows.map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <span className="text-dim">{row.label}</span>
              <span style={{ fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div>
          <p className="form-label" style={{ marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Viktiga datum
          </p>
          {dateRows.map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <span className="text-dim">{row.label}</span>
              <Badge label={row.date} color="var(--gold)" />
            </div>
          ))}
        </div>
      </div>

      <p className="text-[12px] text-text-mute leading-[1.6] mt-4 pt-4 border-t border-border">
        Som EU/EEA-medborgare beskattas du med <strong>19% på nettoinkomst</strong> efter avdragsgilla kostnader.
        Anlita alltid en spansk gestor för att hantera deklarationen korrekt.
        Dubbelbeskattningsavtalet Sverige–Spanien förhindrar att du betalar skatt i båda länder.
      </p>
    </Card>
  );
}
