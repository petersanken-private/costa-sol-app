import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { Card, Badge, Btn, IconBtn } from '../ui';
import { Property, RentalEntry } from '../../types';
import { MONTHS_SV, PLATFORM_COLORS } from '../../data';
import { fmtMoney } from '../../utils/calc.utils';
import { ExportMenu } from '../ExportMenu';
import { RentalSources } from '../rental-sources';
import { AddRentalModal } from './AddRentalModal';
import { exportRentalsCsv, exportRentalsPdf } from '../../utils/export';

export interface RentalsTabProps {
  property: Property;
  rentals:  RentalEntry[];
}

export function RentalsTab({ property, rentals }: RentalsTabProps) {
  const { dispatch } = useApp();
  const [showAdd,    setShowAdd]    = useState(false);
  const [editRental, setEditRental] = useState<RentalEntry | null>(null);

  function handleDelete(id: string) {
    if (window.confirm('Ta bort denna hyrespost?')) {
      dispatch({ type: 'DELETE_RENTAL', id });
    }
  }

  const totalRevenue = rentals.reduce((s, r) => s + r.revenue, 0);
  const totalNights  = rentals.reduce((s, r) => s + r.nights, 0);

  return (
    <>
      <RentalSources propertyId={property.id} />
      <div className="tab-action-bar">
        <ExportMenu
          label="Exportera"
          options={[
            { label: 'CSV (Excel)',    icon: '📊', onClick: () => exportRentalsCsv(property.name, rentals) },
            { label: 'PDF (utskrift)', icon: '📄', onClick: () => exportRentalsPdf(property.name, rentals) },
          ]}
        />
        <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Logga hyresintäkt</Btn>
      </div>
      <Card>
        {rentals.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__icon">📅</p>
            <p className="empty-state__title">Ingen hyresdata ännu</p>
            <p className="empty-state__sub">Klicka "+ Logga hyresintäkt" för att lägga till din första post.</p>
          </div>
        ) : (
          <>
            <div className="table-header rentals-cols">
              <span>År</span>
              <span>Mån</span>
              <span>Nätter</span>
              <span>Intäkt</span>
              <span>Plattform</span>
              <span>Snitt/natt</span>
              <span></span>
            </div>
            {rentals.map(r => (
              <div key={r.id} className="group table-row rentals-cols">
                <span className="text-mute">{r.year}</span>
                <span className="text-mute">{MONTHS_SV[r.month - 1]}</span>
                <span>{r.nights}</span>
                <span className="cell-amount text-gold">{fmtMoney(r.revenue)}</span>
                <Badge label={r.platform} color={PLATFORM_COLORS[r.platform]} />
                <span className="text-mute">{fmtMoney(r.revenue / r.nights)}/natt</span>
                <IconBtn variant="edit"   onClick={() => setEditRental(r)} />
                <IconBtn variant="delete" onClick={() => handleDelete(r.id)} />
              </div>
            ))}
            <div className="table-footer">
              <span className="text-mute">Totalt: <strong className="text-gold">{fmtMoney(totalRevenue)}</strong></span>
              <span className="text-mute">{totalNights} nätter</span>
            </div>
          </>
        )}
      </Card>

      {showAdd && (
        <AddRentalModal
          propertyId={property.id}
          onClose={() => setShowAdd(false)}
          onAdd={rental => { dispatch({ type: 'ADD_RENTAL', rental }); setShowAdd(false); }}
        />
      )}
      {editRental && (
        <AddRentalModal
          propertyId={property.id}
          initial={editRental}
          onClose={() => setEditRental(null)}
          onAdd={rental => {
            dispatch({ type: 'DELETE_RENTAL', id: editRental.id });
            dispatch({ type: 'ADD_RENTAL', rental });
            setEditRental(null);
          }}
        />
      )}
    </>
  );
}
