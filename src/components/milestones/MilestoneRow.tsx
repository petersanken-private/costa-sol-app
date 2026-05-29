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

const CHECK_BASE = 'w-6 h-6 min-w-[24px] rounded-full border-2 bg-transparent flex items-center justify-center text-[12px] transition-all duration-150 flex-shrink-0';

export function MilestoneRow({ milestone: m, property: prop, onMarkDone, onEdit, onDelete }: MilestoneRowProps) {
  const cat  = catInfo(m.category);
  const done = m.status === 'done';

  return (
    <div
      className={`group flex items-center gap-2.5 p-3.5 bg-bg-card border border-border rounded-[10px] transition-colors duration-150 hover:bg-bg-subtle hover:border-border-hi ${done ? 'opacity-55' : ''}`}
    >
      <button
        className={`${CHECK_BASE} ${
          done
            ? 'border-green bg-green-bg text-green'
            : 'border-border-hi text-transparent enabled:hover:border-green enabled:hover:bg-green-bg enabled:hover:text-green'
        }`}
        onClick={() => !done && onMarkDone(m.id)}
        title={done ? 'Klar' : 'Markera som klar'}
        disabled={done}
      >
        {done ? '✓' : ''}
      </button>

      <span className="text-[20px] flex-shrink-0 leading-none">{cat.icon}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
          <p className="text-[14px] font-medium text-text flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">{m.title}</p>
          <DueBadge dueDate={m.dueDate} status={m.status} />
        </div>
        <div className="flex flex-wrap gap-1.5 text-[12px] text-text-mute items-center">
          <span className="bg-bg-subtle border border-border rounded-[10px] py-px px-2 text-[11px] text-text-dim">{cat.label}</span>
          {prop && <span>· {prop.name}</span>}
          {m.amount && <span>· <strong style={{ color: 'var(--gold)' }}>{fmtMoney(m.amount)}</strong></span>}
          {m.notes && <span className="italic text-[11px] whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">· {m.notes}</span>}
        </div>
      </div>

      <div className="flex gap-1.5 flex-shrink-0 md:opacity-0 group-hover:md:opacity-100 transition-opacity duration-150">
        <RowActionBtn variant="edit"   onClick={() => onEdit(m)} />
        <RowActionBtn variant="delete" onClick={() => onDelete(m)} />
      </div>
    </div>
  );
}
