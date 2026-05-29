import { Card, Badge } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';
import { STATUS_LABELS, STATUS_COLORS } from '../../data';
import type { Property, RentalEntry, PageKey } from '../../types';

interface PropertySidebarProps {
  properties:   Property[];
  rentals:      RentalEntry[];
  selectedYear: number;
  navigate:     (page: PageKey, propertyId?: string) => void;
}

export function PropertySidebar({ properties, rentals, selectedYear, navigate }: PropertySidebarProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="font-display text-[20px] font-normal text-text">Fastigheter</p>
        <button className="link-btn" onClick={() => navigate('portfolio')}>Visa alla →</button>
      </div>
      <div className="flex flex-col gap-2.5">
        {properties.map(p => {
          const propRent = rentals
            .filter(r => r.propertyId === p.id && r.year === selectedYear)
            .reduce((s, r) => s + r.revenue, 0);
          return (
            <Card key={p.id} className="card-p-sm" hoverable onClick={() => navigate('property', p.id)}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-[13px] font-medium text-text">{p.name}</p>
                  <p className="text-[11px] text-text-mute mt-0.5">{p.area} · {p.bedrooms} sovrum</p>
                </div>
                <Badge label={STATUS_LABELS[p.status]} color={STATUS_COLORS[p.status]} />
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-display text-[18px] text-gold">{fmtMoney(p.purchasePrice)}</span>
                {propRent > 0 && (
                  <span className="text-[12px] text-gold">{fmtMoney(propRent)} hyra {selectedYear}</span>
                )}
              </div>
            </Card>
          );
        })}
        <Card className="card-p-sm card--dashed" hoverable onClick={() => navigate('portfolio')}>
          <p className="text-mute text-[13px]">+ Lägg till fastighet</p>
        </Card>
      </div>
    </div>
  );
}
