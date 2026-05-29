// ── MilestoneRow ──────────────────────────────────────────────────────────────
// En rad i milstolpe-listan med check-knapp, ikon, meta och actions.

import { fmtMoney } from '../../utils/calc.utils';
import { catInfo, DueBadge } from '.';
import { RowActionBtn } from '../ui';
import type { Milestone, Property } from '../../types';

interface MilestoneRowProps {
  milestone:   Milestone;
  property?:   Property;
  onMarkDone:  (id: string) => void;
  onEdit:      (m: Milestone) => void;
  onDelete:    (m: Milestone) => void;
}

export function MilestoneRow({ milestone: m, property: prop, onMarkDone, onEdit, onDelete }: MilestoneRowProps) {
  const cat  = catInfo(m.category);
  const done = m.status === 'done';

  return (
    <div className={`ms-row ${done ? 'ms-row--done' : ''}`}>
      <button
        className={`ms-check ${done ? 'ms-check--done' : ''}`}
        onClick={() => !done && onMarkDone(m.id)}
        title={done ? 'Klar' : 'Markera som klar'}
        disabled={done}
      >
        {done ? '✓' : ''}
      </button>

      <span className="ms-cat-icon">{cat.icon}</span>

      <div className="ms-row__content">
        <div className="ms-row__top">
          <p className="ms-row__title">{m.title}</p>
          <DueBadge dueDate={m.dueDate} status={m.status} />
        </div>
        <div className="ms-row__meta">
          <span className="ms-cat-label">{cat.label}</span>
          {prop && <span>· {prop.name}</span>}
          {m.amount && <span>· <strong style={{ color: 'var(--gold)' }}>{fmtMoney(m.amount)}</strong></span>}
          {m.notes && <span className="ms-row__notes">· {m.notes}</span>}
        </div>
      </div>

      <div className="ms-row__actions">
        <RowActionBtn variant="edit"   onClick={() => onEdit(m)} />
        <RowActionBtn variant="delete" onClick={() => onDelete(m)} />
      </div>
    </div>
  );
}
