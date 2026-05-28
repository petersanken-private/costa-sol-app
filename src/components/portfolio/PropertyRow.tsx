import React from 'react';
import { Badge } from '../ui';
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
    <div className="table-row table-row--clickable grid-cols-[1fr_120px_100px_120px_120px_80px] gap-3" onClick={onClick}>
      <div>
        <p className="property-row__name">{p.name}</p>
        <p className="property-row__meta">{p.area} · {p.sizeSqm}m² · {p.bedrooms} sovrum</p>
      </div>
      <p className="property-row__type">{p.type}</p>
      <Badge label={STATUS_LABELS[p.status]} color={STATUS_COLORS[p.status]} />
      <p className="property-row__price">{fmtMoney(p.purchasePrice)}</p>
      <div>
        <p className="property-row__value">{fmtMoney(p.currentValue)}</p>
        <p className="property-row__gain" style={{ color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {gain >= 0 ? '+' : ''}{fmtMoney(gain)}
        </p>
      </div>
      <p className="property-row__vft" style={{ color: p.hasVFTLicense ? 'var(--green)' : 'var(--text-mute)' }}>
        {p.hasVFTLicense ? '✓ Licens' : '— Saknas'}
      </p>
      <div className="property-row__actions">
        <button className="row-action-btn row-action-btn--edit"   onClick={onEdit}   title="Redigera">✎</button>
        <button className="row-action-btn row-action-btn--delete" onClick={onDelete} title="Ta bort">×</button>
      </div>
    </div>
  );
}
