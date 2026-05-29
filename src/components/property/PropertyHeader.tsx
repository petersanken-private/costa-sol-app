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
      <button className="link-btn mb-5" onClick={onBack}>
        ← Tillbaka till portfölj
      </button>

      <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
        <div>
          <div className="flex gap-2 mb-1.5">
            <Badge label={STATUS_LABELS[property.status]} color={STATUS_COLORS[property.status]} />
            {property.hasVFTLicense && <Badge label="VFT-licens" color="var(--green)" />}
          </div>
          <h1 className="page-title text-[32px]">{property.name}</h1>
          <p className="text-mute mt-1 text-[14px]">
            {property.area} · {property.development} · {property.bedrooms} sovrum · {property.sizeSqm} m²
          </p>
        </div>
        <div className="text-right max-md:text-left">
          <p className="text-[11px] text-text-mute uppercase tracking-[1px] mb-1">Köpeskilling</p>
          <p className="font-display text-[32px] max-md:text-[26px] text-gold">{fmtMoney(property.purchasePrice)}</p>
          <p className="text-[13px] mt-0.5" style={{ color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
            Nuv. värde {fmtMoney(property.currentValue)} ({gain >= 0 ? '+' : ''}{fmtMoney(gain)})
          </p>
        </div>
      </div>
    </>
  );
}
