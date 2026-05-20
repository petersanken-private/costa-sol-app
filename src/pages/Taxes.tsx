import { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { Card, SectionHeader, Stat, Divider, Badge } from '../components/ui';
import { fmtMoney, fmtPct } from '../utils/calc';
import { EXPENSE_LABELS, PLATFORM_COLORS } from '../data';
import { ExportMenu } from '../components/ExportMenu';
import { exportTaxCsv, exportTaxPdf } from '../utils/export';

export function Taxes() {
  const { state } = useApp();
  const availableYears = useMemo(() => {
    const years = new Set(state.rentals.map(r => r.year));
    const cur = new Date().getFullYear();
    years.add(cur);
    years.add(cur - 1);
    return Array.from(years).sort((a, b) => b - a);
  }, [state.rentals]);

  const [year, setYear] = useState(() => {
    const cur = new Date().getFullYear();
    return state.rentals.some(r => r.year === cur) ? cur : (availableYears[0] ?? cur);
  });

  const yearRentals  = state.rentals.filter(r => r.year === year);
  const yearExpenses = state.expenses.filter(e => e.date.startsWith(String(year)));

  const grossIncome        = yearRentals.reduce((s, r) => s + r.revenue, 0);
  const deductibleExpenses = yearExpenses.filter(e => e.deductible).reduce((s, e) => s + e.amount, 0);
  const netTaxableIncome   = Math.max(0, grossIncome - deductibleExpenses);
  const taxOwed            = netTaxableIncome * 0.19;
  const effectiveRate      = grossIncome > 0 ? (taxOwed / grossIncome) * 100 : 0;

  // Group by category
  const expenseByCategory = yearExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  // Group by platform
  const platformBreakdown = yearRentals.reduce<Record<string, { revenue: number; nights: number }>>((acc, r) => {
    if (!acc[r.platform]) acc[r.platform] = { revenue: 0, nights: 0 };
    acc[r.platform].revenue += r.revenue;
    acc[r.platform].nights  += r.nights;
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-eyebrow">Skatteöversikt</p>
        <div className="tax-top-bar">
          <h1 className="page-title">Modelo 210 Underlag</h1>
          <div className="page-actions">
            <ExportMenu
              label="Exportera"
              options={[
                { label: 'CSV (Excel)', icon: '📊', onClick: () => exportTaxCsv({ year, rentals: yearRentals, expenses: yearExpenses, properties: state.properties }) },
                { label: 'PDF till gestor', icon: '📄', onClick: () => exportTaxPdf({ year, rentals: yearRentals, expenses: yearExpenses, properties: state.properties }) },
              ]}
            />
            <div className="year-btns">
              {availableYears.map(y => (
                <button
                  key={y}
                  className={`year-btn ${year === y ? 'year-btn--active' : ''}`}
                  onClick={() => setYear(y)}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <Card className="card-p-md">
          <Stat
            label="Bruttointäkt"
            value={fmtMoney(grossIncome)}
            sub={`${yearRentals.reduce((s, r) => s + r.nights, 0)} nätter`}
            color="var(--gold)"
          />
        </Card>
        <Card className="card-p-md">
          <Stat label="Avdragsgilla kostn." value={fmtMoney(deductibleExpenses)} sub="IRNR-avdrag (EU/EEA)" />
        </Card>
        <Card className="card-p-md">
          <Stat label="Beskattningsbar ink." value={fmtMoney(netTaxableIncome)} sub="Netto efter avdrag" />
        </Card>
        <Card className="card-p-md" style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <Stat
            label="Beräknad IRNR-skatt"
            value={fmtMoney(taxOwed)}
            sub={`Effektiv skattesats ${fmtPct(effectiveRate)}`}
            color="var(--red)"
          />
        </Card>
      </div>

      <div className="grid-2" style={{ marginBottom: '20px' }}>
        {/* Platform breakdown */}
        <Card className="card-p">
          <SectionHeader title="Intäkter per plattform" />
          {Object.keys(platformBreakdown).length === 0 ? (
            <p className="text-mute">Ingen data för {year}.</p>
          ) : (
            <>
              {Object.entries(platformBreakdown).map(([platform, data]) => (
                <div key={platform} className="table-row" style={{ gridTemplateColumns: '1fr auto', borderTop: '1px solid var(--border)', padding: '10px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Badge label={platform} color={PLATFORM_COLORS[platform]} />
                    <span className="text-mute" style={{ fontSize: '12px' }}>{data.nights} nätter</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold)' }}>
                    {fmtMoney(data.revenue)}
                  </span>
                </div>
              ))}
              <Divider className="mt-8 mb-8" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600 }}>Totalt</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--gold)' }}>
                  {fmtMoney(grossIncome)}
                </span>
              </div>
            </>
          )}
        </Card>

        {/* Expense breakdown */}
        <Card className="card-p">
          <SectionHeader title="Kostnader per kategori" />
          {Object.keys(expenseByCategory).length === 0 ? (
            <p className="text-mute">Inga kostnader för {year}.</p>
          ) : (
            Object.entries(expenseByCategory).map(([cat, amount]) => {
              const isDeductible = yearExpenses.find(e => e.category === cat)?.deductible;
              return (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="text-dim">{EXPENSE_LABELS[cat] ?? cat}</span>
                    {isDeductible && <span className="tax-deductible-tag">avdragsgill</span>}
                  </div>
                  <span className="text-mute">−{fmtMoney(amount)}</span>
                </div>
              );
            })
          )}
        </Card>
      </div>

      {/* Modelo 210 checklist */}
      <Card className="card-p">
        <SectionHeader title="Modelo 210 – Deklarationsunderlag" />
        <div className="tax-modelo-grid">
          <div>
            <p className="form-label" style={{ marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Att deklarera</p>
            {[
              { label: `Bruttohyresintäkt ${year}`, value: fmtMoney(grossIncome) },
              { label: 'Avdragsgilla kostnader',    value: `−${fmtMoney(deductibleExpenses)}` },
              { label: 'Beskattningsbar inkomst',   value: fmtMoney(netTaxableIncome) },
              { label: 'Skattesats (EU/EEA)',        value: '19%' },
              { label: 'Skatt att betala',           value: fmtMoney(taxOwed) },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <span className="text-dim">{row.label}</span>
                <span style={{ fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div>
            <p className="form-label" style={{ marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Viktiga datum</p>
            {[
              { label: `Deklarera hyresintäkt ${year}`, date: `31 dec ${year + 1}` },
              { label: 'Blankett',                      date: 'Modelo 210' },
              { label: 'IBI-betalning',                  date: 'Aug–okt varje år' },
              { label: 'Gestor-rapport',                 date: 'Q1 varje år' },
              { label: '3% innehåll vid försäljning',   date: 'Modelo 211' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <span className="text-dim">{row.label}</span>
                <Badge label={row.date} color="var(--gold)" />
              </div>
            ))}
          </div>
        </div>

        <p className="tax-note">
          Som EU/EEA-medborgare beskattas du med <strong>19% på nettoinkomst</strong> efter avdragsgilla kostnader.
          Anlita alltid en spansk gestor för att hantera deklarationen korrekt.
          Dubbelbeskattningsavtalet Sverige–Spanien förhindrar att du betalar skatt i båda länder.
        </p>
      </Card>
    </div>
  );
}
