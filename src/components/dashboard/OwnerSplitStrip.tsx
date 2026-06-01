// ── OwnerSplitStrip ──────────────────────────────────────────────────────────
//
// Visar per-ägare-aggregat när portföljen har 2+ delägare i någon fastighet.
// Renderas under huvud-KPI:erna på Dashboard som en utfällbar sektion.

import { Card, SectionHeader, Stat } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';
import { calcAllOwnerPnLs, hasCoOwnership } from '../../utils/owner.utils';
import type { Property, RentalEntry, Expense } from '../../types';

interface Props {
  properties: Property[];
  rentals:    RentalEntry[];
  expenses:   Expense[];
  year:       number;
}

export function OwnerSplitStrip({ properties, rentals, expenses, year }: Props) {
  if (!hasCoOwnership(properties)) return null;

  const pnls = calcAllOwnerPnLs(properties, rentals, expenses, year);

  return (
    <Card className="card-p mb-7">
      <SectionHeader
        title="Per ägare"
        action={<span className="text-[11px] text-text-mute">Baserat på ägarandelar per fastighet</span>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {pnls.map(o => (
          <div key={o.ownerName} className="p-4 bg-bg-subtle rounded-[10px] border border-border">
            <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-border">
              <span className="font-display text-[18px] font-medium text-text">{o.ownerName}</span>
              <span className="text-[11px] text-text-mute">{o.propertyCount} {o.propertyCount === 1 ? 'fastighet' : 'fastigheter'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Stat label="Investerat"      value={fmtMoney(o.totalInvested)} />
              <Stat label="Nuv. värde"       value={fmtMoney(o.totalCurrentValue)}
                    sub={`${o.unrealizedGain >= 0 ? '+' : ''}${fmtMoney(o.unrealizedGain)}`}
                    color={o.unrealizedGain >= 0 ? 'var(--green)' : 'var(--red)'} />
              <Stat label={`Bruttohyra ${year}`} value={fmtMoney(o.grossRentalIncome)} color="var(--gold)" />
              <Stat label="Skatt (est.)"      value={fmtMoney(o.estimatedTax)} color="var(--red)" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
