import { Badge, RowActionBtn } from '../ui';
import { Property } from '../../types';
import { STATUS_LABELS, STATUS_COLORS } from '../../data';
import { fmtMoney } from '../../utils/calc.utils';

export interface PropertyCardProps {
  property: Property;
  onClick:  () => void;
  onEdit:   () => void;
  onDelete: () => void;
}

export function PropertyCard({ property: p, onClick, onEdit, onDelete }: PropertyCardProps) {
  const gain = p.currentValue - p.purchasePrice;
  return (
    <div
      className="bg-bg-card border border-border rounded-[10px] p-4 mb-2.5 cursor-pointer transition-colors duration-150 hover:bg-bg-subtle hover:border-border-hi"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-[14px] font-medium text-text">{p.name}</p>
          <p className="text-[11px] text-text-mute mt-0.5">{p.area} · {p.sizeSqm}m² · {p.bedrooms} sov</p>
        </div>
        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
          <RowActionBtn variant="edit"   onClick={onEdit} />
          <RowActionBtn variant="delete" onClick={onDelete} />
        </div>
      </div>
      <div className="flex justify-between items-center py-1.5">
        <span className="text-[11px] text-text-mute">Köpeskilling</span>
        <span className="font-display text-[16px] text-gold">{fmtMoney(p.purchasePrice)}</span>
      </div>
      <div className="flex justify-between items-center py-1.5">
        <span className="text-[11px] text-text-mute">Nuv. värde</span>
        <div className="text-right">
          <span className="font-display text-[16px] text-text">{fmtMoney(p.currentValue)}</span>
          <span className="text-[11px] ml-1" style={{ color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {gain >= 0 ? '+' : ''}{fmtMoney(gain)}
          </span>
        </div>
      </div>
      <div className="flex justify-between items-center py-1.5 mt-1">
        <Badge label={STATUS_LABELS[p.status]} color={STATUS_COLORS[p.status]} />
        <span className="text-[12px]" style={{ color: p.hasVFTLicense ? 'var(--green)' : 'var(--text-mute)' }}>
          {p.hasVFTLicense ? '✓ VFT' : '— Ingen licens'}
        </span>
      </div>
    </div>
  );
}
