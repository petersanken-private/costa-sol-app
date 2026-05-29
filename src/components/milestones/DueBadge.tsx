import { MilestoneStatus } from '../../types';
import { daysUntil } from '../../hooks/useMilestones';

export interface DueBadgeProps {
  dueDate: string;
  status:  MilestoneStatus;
}

const BASE = 'inline-block px-2.5 py-0.5 rounded-[20px] text-[11px] font-semibold whitespace-nowrap flex-shrink-0 border';

const VARIANTS = {
  overdue:  'bg-red-bg text-red border-red/20',
  today:    'bg-[#fef3c7] text-[#92400e] border-[#fde68a]',
  soon:     'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]',
  upcoming: 'bg-gold-faint text-gold border-gold/20',
  future:   'bg-bg-subtle text-text-mute border-border',
  done:     'bg-green-bg text-green border-green/20',
} as const;

export function DueBadge({ dueDate, status }: DueBadgeProps) {
  if (status === 'done') return <span className={`${BASE} ${VARIANTS.done}`}>✓ Klar</span>;

  const d = daysUntil(dueDate);
  if (d < 0)   return <span className={`${BASE} ${VARIANTS.overdue}`}>{Math.abs(d)} dagar sen</span>;
  if (d === 0) return <span className={`${BASE} ${VARIANTS.today}`}>Idag!</span>;
  if (d <= 7)  return <span className={`${BASE} ${VARIANTS.soon}`}>Om {d} dagar</span>;
  if (d <= 30) return <span className={`${BASE} ${VARIANTS.upcoming}`}>Om {d} dagar</span>;
  return (
    <span className={`${BASE} ${VARIANTS.future}`}>
      {new Date(dueDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}
    </span>
  );
}
