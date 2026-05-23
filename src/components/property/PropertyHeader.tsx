import { Badge } from '../ui';
import { Property } from '../../types';
import { STATUS_LABELS, STATUS_COLORS } from '../../data';
import { fmtMoney } from '../../utils/calc.utils';

export interface PropertyHeaderProps {
  property: Property;
  onBack:   () => void;
}

export function PropertyHeader({ property, onBack }: PropertyHeaderProps) {
  const gain = property.currentValue - property.purchasePrice;

  return (
    <>
      <button className="link-btn" style={{ marginBottom: '20px' }} onClick={onBack}>
        ← Tillbaka till portfölj
      </button>

      <div className="detail-top">
        <div>
          <div className="detail-badges">
            <Badge label={STATUS_LABELS[property.status]} color={STATUS_COLORS[property.status]} />
            {property.hasVFTLicense && <Badge label="VFT-licens" color="var(--green)" />}
          </div>
          <h1 className="page-title" style={{ fontSize: '32px' }}>{property.name}</h1>
          <p className="text-mute" style={{ marginTop: '4px', fontSize: '14px' }}>
            {property.area} · {property.development} · {property.bedrooms} sovrum · {property.sizeSqm} m²
          </p>
        </div>
        <div className="detail-price-block">
          <p className="detail-price-eyebrow">Köpeskilling</p>
          <p className="detail-price-value">{fmtMoney(property.purchasePrice)}</p>
          <p className="detail-price-sub" style={{ color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
            Nuv. värde {fmtMoney(property.currentValue)} ({gain >= 0 ? '+' : ''}{fmtMoney(gain)})
          </p>
        </div>
      </div>
    </>
  );
}
