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

const CARD = 'bg-bg-card border border-border rounded-[10px] py-3.5 px-4 transition-colors duration-150';

export function MilestoneSummaryStrip({ milestones, overdueCount, soonCount, totalPayments }: MilestoneSummaryStripProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5 mb-5">
      <div className={CARD} style={{ borderColor: overdueCount > 0 ? 'var(--red)' : undefined }}>
        <p className="stat-label">Försenade</p>
        <p className="stat-value" style={{ color: overdueCount > 0 ? 'var(--red)' : 'var(--text-mute)' }}>
          {overdueCount}
        </p>
      </div>
      <div className={CARD} style={{ borderColor: soonCount > 0 ? '#d97706' : undefined }}>
        <p className="stat-label">Inom 7 dagar</p>
        <p className="stat-value" style={{ color: soonCount > 0 ? '#d97706' : 'var(--text-mute)' }}>
          {soonCount}
        </p>
      </div>
      <div className={CARD}>
        <p className="stat-label">Kommande betalningar</p>
        <p className="stat-value" style={{ color: totalPayments > 0 ? 'var(--gold)' : 'var(--text-mute)' }}>
          {totalPayments > 0 ? fmtMoney(totalPayments) : '—'}
        </p>
      </div>
      <div className={CARD}>
        <p className="stat-label">Totalt</p>
        <p className="stat-value">{milestones.filter(m => m.status !== 'done').length}</p>
        <p className="stat-sub">{milestones.filter(m => m.status === 'done').length} klara</p>
      </div>
    </div>
  );
}
