import React from 'react';
import { Badge, RowActionBtn } from '../ui';
import { Property } from '../../types';
import { STATUS_LABELS, STATUS_COLORS } from '../../data';
import { fmtMoney } from '../../utils/calc.utils';

export interface PropertyRowProps {
  property: Property;
  onClick:  () => void;
  onEdit:   (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function PropertyRow({ property: p, onClick, onEdit, onDelete }: PropertyRowProps) {
  const gain = p.currentValue - p.purchasePrice;
  return (
    <div
      className="table-row table-row--clickable grid-cols-[1fr_120px_100px_120px_120px_80px_64px] gap-3 group"
      onClick={onClick}
    >
      <div>
        <p className="text-[14px] font-medium text-text">{p.name}</p>
        <p className="text-[12px] text-text-mute mt-0.5">{p.area} · {p.sizeSqm}m² · {p.bedrooms} sovrum</p>
      </div>
      <p className="text-[12px] text-text-dim capitalize">{p.type}</p>
      <Badge label={STATUS_LABELS[p.status]} color={STATUS_COLORS[p.status]} />
      <p className="font-display text-[18px] text-gold">{fmtMoney(p.purchasePrice)}</p>
      <div>
        <p className="font-display text-[18px] text-text">{fmtMoney(p.currentValue)}</p>
        <p className="text-[11px] mt-0.5" style={{ color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {gain >= 0 ? '+' : ''}{fmtMoney(gain)}
        </p>
      </div>
      <p className="text-[12px]" style={{ color: p.hasVFTLicense ? 'var(--green)' : 'var(--text-mute)' }}>
        {p.hasVFTLicense ? '✓ Licens' : '— Saknas'}
      </p>
      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <RowActionBtn variant="edit"   onClick={onEdit}   />
        <RowActionBtn variant="delete" onClick={onDelete} />
      </div>
    </div>
  );
}
