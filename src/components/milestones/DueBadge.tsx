import { MilestoneStatus } from '../../types';
import { daysUntil } from '../../hooks/useMilestones';

export interface DueBadgeProps {
  dueDate: string;
  status:  MilestoneStatus;
}

export function DueBadge({ dueDate, status }: DueBadgeProps) {
  if (status === 'done') return <span className="ms-badge ms-badge--done">✓ Klar</span>;

  const d = daysUntil(dueDate);
  if (d < 0)   return <span className="ms-badge ms-badge--overdue">{Math.abs(d)} dagar sen</span>;
  if (d === 0) return <span className="ms-badge ms-badge--today">Idag!</span>;
  if (d <= 7)  return <span className="ms-badge ms-badge--soon">Om {d} dagar</span>;
  if (d <= 30) return <span className="ms-badge ms-badge--upcoming">Om {d} dagar</span>;
  return (
    <span className="ms-badge ms-badge--future">
      {new Date(dueDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}
    </span>
  );
}
