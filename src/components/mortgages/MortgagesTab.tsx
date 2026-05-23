import { useState } from 'react';
import { useMortgages } from '../../hooks/useMortgages';
import { Mortgage } from '../../types';
import { Card, Btn } from '../ui';
import { MortgageCard } from './MortgageCard';
import { MortgageModal } from './MortgageModal';
import { RatePeriodModal } from './RatePeriodModal';

export interface MortgagesTabProps {
  propertyId: string;
}

export function MortgagesTab({ propertyId }: MortgagesTabProps) {
  const { items, loading, add, remove, addRatePeriod, removeRatePeriod } = useMortgages(propertyId);
  const [showMortgageModal, setShowMortgageModal] = useState(false);
  const [showPeriodModal,   setShowPeriodModal]   = useState<string | null>(null);
  const [expandedId,        setExpandedId]        = useState<string | null>(null);

  async function handleAddMortgage(m: Mortgage, rate: number) {
    await add(m, rate);
    setShowMortgageModal(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Ta bort detta bolån? Alla ränteperioder försvinner också.')) return;
    await remove(id);
  }

  return (
    <>
      <div className="tab-action-bar">
        <span className="text-mute" style={{ fontSize: '13px' }}>
          {items.length} bolån registrera{items.length === 1 ? 't' : 'de'}
        </span>
        <Btn variant="primary" size="sm" onClick={() => setShowMortgageModal(true)}>+ Nytt bolån</Btn>
      </div>

      {loading ? (
        <p className="text-mute">Laddar…</p>
      ) : items.length === 0 ? (
        <Card>
          <div className="empty-state">
            <p className="empty-state__icon">🏦</p>
            <p className="empty-state__title">Inget bolån registrerat</p>
            <p className="empty-state__sub">
              Lägg till bolånedetaljer för att se amorteringsplan och total räntekostnad.
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map(it => (
            <MortgageCard
              key={it.mortgage.id}
              data={it}
              expanded={expandedId === it.mortgage.id}
              onToggle={() => setExpandedId(expandedId === it.mortgage.id ? null : it.mortgage.id)}
              onDelete={() => handleDelete(it.mortgage.id)}
              onAddPeriod={() => setShowPeriodModal(it.mortgage.id)}
              onRemovePeriod={id => removeRatePeriod(id)}
            />
          ))}
        </div>
      )}

      {showMortgageModal && (
        <MortgageModal
          propertyId={propertyId}
          onClose={() => setShowMortgageModal(false)}
          onSave={handleAddMortgage}
        />
      )}

      {showPeriodModal && (
        <RatePeriodModal
          mortgageId={showPeriodModal}
          onClose={() => setShowPeriodModal(null)}
          onSave={async p => { await addRatePeriod(p); setShowPeriodModal(null); }}
        />
      )}
    </>
  );
}
