import { Badge, PhotoPlaceholder, Icon } from '../ui';
import { Property } from '../../types';
import { STATUS_LABELS, STATUS_COLORS } from '../../data';
import { fmtMoney } from '../../utils/calc.utils';

export interface PropertyHeaderProps {
  property: Property;
  onBack:   () => void;
}

export function PropertyHeader({ property, onBack }: PropertyHeaderProps) {
  const gain = property.currentValue - property.purchasePrice;
  const tint = STATUS_COLORS[property.status] ?? '#2f5d4d';

  return (
    <>
      <button className="link-btn mb-5 inline-flex items-center gap-1.5" onClick={onBack}>
        <Icon name="back" size={15} /> Tillbaka till portfölj
      </button>

      <div className="grid md:grid-cols-[1.1fr_1.3fr] gap-6 mb-7 items-stretch">
        <PhotoPlaceholder height={240} tint={tint} label={property.development || property.name} radius={14} />

        <div className="flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center gap-1.5 text-[12px] text-text-mute mb-2">
              <Icon name="pin" size={14} /> {property.area}
            </div>
            <h1 className="page-title text-[28px] md:text-[33px]">{property.name}</h1>
            <div className="flex gap-2 mt-2.5 flex-wrap">
              <Badge label={STATUS_LABELS[property.status]} color={STATUS_COLORS[property.status]} />
              {property.hasVFTLicense && <Badge label="VFT-licens" color="var(--green)" />}
            </div>
            <p className="text-dim mt-3 text-[13.5px] leading-relaxed">
              {property.development} · {property.bedrooms} sovrum · {property.bathrooms} bad · {property.sizeSqm} m²
              {property.terraceSqm > 0 && ` · ${property.terraceSqm} m² terrass`}
            </p>
          </div>
          <div className="flex items-end justify-between gap-4 pt-4 border-t border-border flex-wrap">
            <div>
              <p className="text-[11px] text-text-mute uppercase tracking-[1px] mb-1">Köpeskilling</p>
              <p className="font-display text-[28px] text-text leading-none">{fmtMoney(property.purchasePrice)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-text-mute uppercase tracking-[1px] mb-1">Nuvarande värde</p>
              <p className="font-display text-[28px] leading-none" style={{ color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {fmtMoney(property.currentValue)}
              </p>
              <p className="text-[13px] mt-1" style={{ color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {gain >= 0 ? '+' : ''}{fmtMoney(gain)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
