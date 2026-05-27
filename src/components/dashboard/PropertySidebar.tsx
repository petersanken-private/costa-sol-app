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
      <div className="properties-sidebar-header">
        <p className="properties-sidebar-title">Fastigheter</p>
        <button className="link-btn" onClick={() => navigate('portfolio')}>Visa alla →</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {properties.map(p => {
          const propRent = rentals
            .filter(r => r.propertyId === p.id && r.year === selectedYear)
            .reduce((s, r) => s + r.revenue, 0);
          return (
            <Card key={p.id} className="card-p-sm" hoverable onClick={() => navigate('property', p.id)}>
              <div className="property-card-meta">
                <div>
                  <p className="property-card-name">{p.name}</p>
                  <p className="property-card-area">{p.area} · {p.bedrooms} sovrum</p>
                </div>
                <Badge label={STATUS_LABELS[p.status]} color={STATUS_COLORS[p.status]} />
              </div>
              <div className="property-card-price">
                <span className="property-card-price-value">{fmtMoney(p.purchasePrice)}</span>
                {propRent > 0 && (
                  <span className="property-card-rent text-gold">{fmtMoney(propRent)} hyra {selectedYear}</span>
                )}
              </div>
            </Card>
          );
        })}
        <Card className="card-p-sm card--dashed" hoverable onClick={() => navigate('portfolio')}>
          <p className="text-mute" style={{ fontSize: '13px' }}>+ Lägg till fastighet</p>
        </Card>
      </div>
    </div>
  );
}
