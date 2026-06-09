import { Icon, PhotoPlaceholder, RowActionBtn } from '../ui';
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
  const gain    = p.currentValue - p.purchasePrice;
  const gainPct = p.purchasePrice > 0 ? (gain / p.purchasePrice) * 100 : 0;
  const tint    = STATUS_COLORS[p.status] ?? '#2f5d4d';

  return (
    <div
      className="group bg-bg-card border border-border rounded-[14px] overflow-hidden cursor-pointer transition-all duration-150 hover:border-border-hi hover:-translate-y-0.5"
      onClick={onClick}
    >
      <div className="relative">
        <PhotoPlaceholder height={170} tint={tint} label={p.development || p.name} radius={0} />
        <div
          className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          onClick={e => e.stopPropagation()}
        >
          <RowActionBtn variant="edit"   onClick={onEdit} />
          <RowActionBtn variant="delete" onClick={onDelete} />
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-1.5 text-[11px] text-text-mute mb-1.5">
          <Icon name="pin" size={13} />
          <span>{p.area}</span>
        </div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <h3 className="font-display text-[22px] font-medium text-text leading-tight">{p.name}</h3>
          <span
            className="flex-shrink-0 text-[11.5px] font-semibold py-[3px] px-2.5 rounded-[8px]"
            style={{ background: `${tint}1a`, color: tint }}
          >
            {STATUS_LABELS[p.status]}
          </span>
        </div>

        {/* Spec-rad */}
        <div className="flex items-center gap-4 text-[12px] text-text-dim mb-4 pb-4 border-b border-border">
          <span className="flex items-center gap-1.5"><Icon name="bed" size={15} />{p.bedrooms}</span>
          <span className="flex items-center gap-1.5"><Icon name="bath" size={15} />{p.bathrooms}</span>
          <span className="flex items-center gap-1.5"><Icon name="sqm" size={15} />{p.sizeSqm} m²</span>
          {p.terraceSqm > 0 && <span className="text-text-mute">+{p.terraceSqm} terrass</span>}
        </div>

        {/* Bottom — två stat-block + CTA */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[1.5px] uppercase text-text-mute mb-1">Värde</p>
            <p className="font-display text-[18px] text-text leading-none">{fmtMoney(p.currentValue)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[1.5px] uppercase text-text-mute mb-1">Värdeökning</p>
            <p
              className="font-display text-[18px] leading-none"
              style={{ color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}
            >
              {gain >= 0 ? '+' : '−'}{Math.abs(gainPct).toFixed(1).replace('.', ',')} %
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold py-2 px-3 rounded-[8px] bg-green-soft text-green whitespace-nowrap">
            Öppna <Icon name="arrow" size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}
