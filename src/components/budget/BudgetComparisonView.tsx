import { Card, SectionHeader } from '../ui';
import { fmtMoney, fmtPct } from '../../utils/calc.utils';
import { BudgetComparison } from '../../hooks/useBudgets';

export interface BudgetComparisonViewProps {
  comparison: BudgetComparison;
}

export function BudgetComparisonView({ comparison }: BudgetComparisonViewProps) {
  const { budget, actual, variance } = comparison;

  const totalBudgetCosts = budget.expectedManagement + budget.expectedCleaning + budget.expectedFixed
                         + budget.expectedMaintenance + budget.expectedOther;
  const totalActualCosts = actual.management + actual.cleaning + actual.fixed
                         + actual.maintenance + actual.other;

  const budgetNet   = budget.expectedRevenue - totalBudgetCosts;
  const actualNet   = actual.revenue - totalActualCosts;
  const netVariance = actualNet - budgetNet;

  // Revenue = "mer = bra", kostnader = "mindre = bra"
  const rows: { label: string; expected: number; actual: number; variance: number; isIncome: boolean }[] = [
    { label: 'Bruttohyra',                  expected: budget.expectedRevenue,     actual: actual.revenue,     variance: variance.revenue,     isIncome: true  },
    { label: 'Förvaltning',                  expected: budget.expectedManagement,  actual: actual.management,  variance: variance.management,  isIncome: false },
    { label: 'Städning',                     expected: budget.expectedCleaning,    actual: actual.cleaning,    variance: variance.cleaning,    isIncome: false },
    { label: 'Fasta (IBI, försäkring m.m.)', expected: budget.expectedFixed,       actual: actual.fixed,       variance: variance.fixed,       isIncome: false },
    { label: 'Underhåll',                    expected: budget.expectedMaintenance, actual: actual.maintenance, variance: variance.maintenance, isIncome: false },
    { label: 'Övrigt',                       expected: budget.expectedOther,       actual: actual.other,       variance: variance.other,       isIncome: false },
  ];

  function varianceColor(v: number, isIncome: boolean): string {
    if (v === 0) return 'var(--text-mute)';
    const isGood = isIncome ? v > 0 : v < 0;
    return isGood ? 'var(--green)' : 'var(--red)';
  }

  return (
    <>
      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <Card className="card-p-md">
          <p className="stat-label">Budget netto</p>
          <p className="stat-value">{fmtMoney(budgetNet)}</p>
          <p className="stat-sub">Planerat utfall</p>
        </Card>
        <Card className="card-p-md">
          <p className="stat-label">Faktiskt netto</p>
          <p className="stat-value" style={{ color: actualNet >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {fmtMoney(actualNet)}
          </p>
          <p className="stat-sub">Verkligt utfall</p>
        </Card>
        <Card className="card-p-md">
          <p className="stat-label">Avvikelse</p>
          <p className="stat-value" style={{ color: varianceColor(netVariance, true) }}>
            {netVariance >= 0 ? '+' : ''}{fmtMoney(netVariance)}
          </p>
          <p className="stat-sub">
            {budgetNet !== 0 ? `${fmtPct((netVariance / Math.abs(budgetNet)) * 100, 1)} vs budget` : '—'}
          </p>
        </Card>
        <Card className="card-p-md">
          <p className="stat-label">Nätter</p>
          <p className="stat-value">{actual.nights}</p>
          <p className="stat-sub">Budget: {budget.expectedNights} ({variance.nights >= 0 ? '+' : ''}{variance.nights})</p>
        </Card>
      </div>

      <Card className="card-p">
        <SectionHeader title={`Detaljerad jämförelse · ${budget.year}`} />
        <div className="table-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 80px' }}>
          <span></span>
          <span>Budget</span>
          <span>Faktiskt</span>
          <span>Avvikelse</span>
          <span>% utfall</span>
        </div>
        {rows.map((row, i) => {
          const pctOf = row.expected !== 0 ? (row.actual / row.expected) * 100 : 0;
          return (
            <div key={i} className="table-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 80px' }}>
              <span><strong>{row.label}</strong></span>
              <span className="font-display text-[18px] text-mute">{fmtMoney(row.expected)}</span>
              <span className="font-display text-[18px]">{fmtMoney(row.actual)}</span>
              <span className="font-display text-[18px]" style={{ color: varianceColor(row.variance, row.isIncome) }}>
                {row.variance >= 0 ? '+' : ''}{fmtMoney(row.variance)}
              </span>
              <span className="font-display text-[18px] text-mute" style={{ fontSize: '13px' }}>
                {row.expected !== 0 ? `${pctOf.toFixed(0)}%` : '—'}
              </span>
            </div>
          );
        })}
      </Card>

      {budget.notes && (
        <Card className="card-p" style={{ marginTop: '16px' }}>
          <p className="text-mute" style={{ fontSize: '13px' }}>Anteckning: {budget.notes}</p>
        </Card>
      )}
    </>
  );
}
