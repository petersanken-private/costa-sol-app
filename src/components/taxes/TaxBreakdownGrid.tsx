// ── TaxBreakdownGrid ──────────────────────────────────────────────────────────
// Tvåkolumnsgrid: intäkter per plattform + kostnader per kategori.

import { Card, SectionHeader, Divider, Badge } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';
import { EXPENSE_LABELS, PLATFORM_COLORS } from '../../data';
import type { Expense } from '../../types';

interface TaxBreakdownGridProps {
  year:               number;
  yearExpenses:       Expense[];
  grossIncome:        number;
  platformBreakdown:  Record<string, { revenue: number; nights: number }>;
  expenseByCategory:  Record<string, number>;
}

export function TaxBreakdownGrid({
  year, yearExpenses, grossIncome, platformBreakdown, expenseByCategory,
}: TaxBreakdownGridProps) {
  return (
    <div className="grid-2" style={{ marginBottom: '20px' }}>
      {/* Intäkter per plattform */}
      <Card className="card-p">
        <SectionHeader title="Intäkter per plattform" />
        {Object.keys(platformBreakdown).length === 0 ? (
          <p className="text-mute">Ingen data för {year}.</p>
        ) : (
          <>
            {Object.entries(platformBreakdown).map(([platform, data]) => (
              <div key={platform} className="table-row"
                   style={{ gridTemplateColumns: '1fr auto', borderTop: '1px solid var(--border)', padding: '10px 0' }}>
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

      {/* Kostnader per kategori */}
      <Card className="card-p">
        <SectionHeader title="Kostnader per kategori" />
        {Object.keys(expenseByCategory).length === 0 ? (
          <p className="text-mute">Inga kostnader för {year}.</p>
        ) : (
          Object.entries(expenseByCategory).map(([cat, amount]) => {
            const isDeductible = yearExpenses.find(e => e.category === cat)?.deductible;
            return (
              <div key={cat}
                   style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="text-dim">{EXPENSE_LABELS[cat] ?? cat}</span>
                  {isDeductible && <span className="text-[10px] text-green ml-2">avdragsgill</span>}
                </div>
                <span className="text-mute">−{fmtMoney(amount)}</span>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
