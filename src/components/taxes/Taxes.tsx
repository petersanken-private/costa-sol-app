import { useState, useMemo } from 'react';
import { useApp } from '../../hooks/useApp';
import { Card, Stat } from '../ui';
import { fmtMoney, fmtPct } from '../../utils/calc.utils';
import { TAX } from '../../constants/tax';
import { ExportMenu } from '../ExportMenu';
import { exportTaxCsv, exportTaxPdf } from '../../utils/export';
import { TaxBreakdownGrid } from './TaxBreakdownGrid';
import { Modelo210Checklist } from './Modelo210Checklist';

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
  const taxOwed            = netTaxableIncome * TAX.IRNR_EU_PCT;
  const effectiveRate      = grossIncome > 0 ? (taxOwed / grossIncome) * 100 : 0;

  const expenseByCategory = yearExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

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
                <button key={y} className={`year-btn ${year === y ? 'year-btn--active' : ''}`}
                        onClick={() => setYear(y)}>{y}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <Card className="card-p-md">
          <Stat label="Bruttointäkt" value={fmtMoney(grossIncome)}
                sub={`${yearRentals.reduce((s, r) => s + r.nights, 0)} nätter`} color="var(--gold)" />
        </Card>
        <Card className="card-p-md">
          <Stat label="Avdragsgilla kostn." value={fmtMoney(deductibleExpenses)} sub="IRNR-avdrag (EU/EEA)" />
        </Card>
        <Card className="card-p-md">
          <Stat label="Beskattningsbar ink." value={fmtMoney(netTaxableIncome)} sub="Netto efter avdrag" />
        </Card>
        <Card className="card-p-md" style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <Stat label="Beräknad IRNR-skatt" value={fmtMoney(taxOwed)}
                sub={`Effektiv skattesats ${fmtPct(effectiveRate)}`} color="var(--red)" />
        </Card>
      </div>

      <TaxBreakdownGrid
        year={year}
        yearExpenses={yearExpenses}
        grossIncome={grossIncome}
        platformBreakdown={platformBreakdown}
        expenseByCategory={expenseByCategory}
      />

      <Modelo210Checklist
        year={year}
        grossIncome={grossIncome}
        deductibleExpenses={deductibleExpenses}
        netTaxableIncome={netTaxableIncome}
        taxOwed={taxOwed}
      />
    </div>
  );
}
