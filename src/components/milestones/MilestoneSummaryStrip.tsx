// ── MilestoneSummaryStrip ─────────────────────────────────────────────────────
// De 4 summary-korten högst upp på Milstolpar-sidan.

import { fmtMoney } from '../../utils/calc.utils';
import type { Milestone } from '../../types';

interface MilestoneSummaryStripProps {
  milestones:    Milestone[];
  overdueCount:  number;
  soonCount:     number;
  totalPayments: number;
}

export function MilestoneSummaryStrip({ milestones, overdueCount, soonCount, totalPayments }: MilestoneSummaryStripProps) {
  return (
    <div className="ms-summary-strip">
      <div className="ms-summary-card" style={{ borderColor: overdueCount > 0 ? 'var(--red)' : undefined }}>
        <p className="stat-label">Försenade</p>
        <p className="stat-value" style={{ color: overdueCount > 0 ? 'var(--red)' : 'var(--text-mute)' }}>
          {overdueCount}
        </p>
      </div>
      <div className="ms-summary-card" style={{ borderColor: soonCount > 0 ? '#d97706' : undefined }}>
        <p className="stat-label">Inom 7 dagar</p>
        <p className="stat-value" style={{ color: soonCount > 0 ? '#d97706' : 'var(--text-mute)' }}>
          {soonCount}
        </p>
      </div>
      <div className="ms-summary-card">
        <p className="stat-label">Kommande betalningar</p>
        <p className="stat-value" style={{ color: totalPayments > 0 ? 'var(--gold)' : 'var(--text-mute)' }}>
          {totalPayments > 0 ? fmtMoney(totalPayments) : '—'}
        </p>
      </div>
      <div className="ms-summary-card">
        <p className="stat-label">Totalt</p>
        <p className="stat-value">{milestones.filter(m => m.status !== 'done').length}</p>
        <p className="stat-sub">{milestones.filter(m => m.status === 'done').length} klara</p>
      </div>
    </div>
  );
}
