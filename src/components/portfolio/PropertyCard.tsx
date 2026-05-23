import { Badge } from '../ui';
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
    <div className="prop-mobile-card" onClick={onClick}>
      <div className="prop-mobile-card__top">
        <div>
          <p className="prop-mobile-card__name">{p.name}</p>
          <p className="prop-mobile-card__meta">{p.area} · {p.sizeSqm}m² · {p.bedrooms} sov</p>
        </div>
        <div className="prop-mobile-card__actions" onClick={e => e.stopPropagation()}>
          <button className="row-action-btn row-action-btn--edit"   onClick={onEdit}>✎</button>
          <button className="row-action-btn row-action-btn--delete" onClick={onDelete}>×</button>
        </div>
      </div>
      <div className="prop-mobile-card__row">
        <span className="prop-mobile-card__label">Köpeskilling</span>
        <span className="prop-mobile-card__price">{fmtMoney(p.purchasePrice)}</span>
      </div>
      <div className="prop-mobile-card__row">
        <span className="prop-mobile-card__label">Nuv. värde</span>
        <div style={{ textAlign: 'right' }}>
          <span className="prop-mobile-card__value">{fmtMoney(p.currentValue)}</span>
          <span style={{ fontSize: '11px', color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {' '}{gain >= 0 ? '+' : ''}{fmtMoney(gain)}
          </span>
        </div>
      </div>
      <div className="prop-mobile-card__row">
        <Badge label={STATUS_LABELS[p.status]} color={STATUS_COLORS[p.status]} />
        <span style={{ fontSize: '12px', color: p.hasVFTLicense ? 'var(--green)' : 'var(--text-mute)' }}>
          {p.hasVFTLicense ? '✓ VFT' : '— Ingen licens'}
        </span>
      </div>
    </div>
  );
}
