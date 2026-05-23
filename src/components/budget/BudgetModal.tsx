import { useState } from 'react';
import { Btn, Modal, FormGroup } from '../ui';
import { Budget } from '../../types';

function newId() { return 'bud-' + Math.random().toString(36).slice(2, 10); }

export interface BudgetModalProps {
  initial:    Budget | null;
  propertyId: string;
  year:       number;
  onClose:    () => void;
  onSave:     (b: Budget) => void;
}

export function BudgetModal({ initial, propertyId, year, onClose, onSave }: BudgetModalProps) {
  const [revenue,     setRevenue]     = useState(String(initial?.expectedRevenue     ?? 0));
  const [nights,      setNights]      = useState(String(initial?.expectedNights      ?? 0));
  const [management,  setManagement]  = useState(String(initial?.expectedManagement  ?? 0));
  const [cleaning,    setCleaning]    = useState(String(initial?.expectedCleaning    ?? 0));
  const [fixed,       setFixed]       = useState(String(initial?.expectedFixed       ?? 0));
  const [maintenance, setMaintenance] = useState(String(initial?.expectedMaintenance ?? 0));
  const [other,       setOther]       = useState(String(initial?.expectedOther       ?? 0));
  const [notes,       setNotes]       = useState(initial?.notes ?? '');

  function n(s: string): number { return parseInt(s.replace(/\D/g, '')) || 0; }

  function handleSave() {
    onSave({
      id:                  initial?.id ?? newId(),
      propertyId,
      year,
      expectedRevenue:     n(revenue),
      expectedNights:      n(nights),
      expectedManagement:  n(management),
      expectedCleaning:    n(cleaning),
      expectedFixed:       n(fixed),
      expectedMaintenance: n(maintenance),
      expectedOther:       n(other),
      notes:               notes.trim() || undefined,
    });
  }

  return (
    <Modal
      title={`${initial ? 'Redigera' : 'Ny'} budget · ${year}`}
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleSave}>Spara</Btn>
      </>}
    >
      <p className="text-mute" style={{ fontSize: '13px', marginBottom: '16px' }}>
        Belopp i EUR per år. Jämförs sen mot faktiskt registrerade hyror och kostnader.
      </p>
      <div className="grid-2">
        <FormGroup label="Förväntad bruttohyra €">
          <input className="form-input" type="number" value={revenue}
                 onChange={e => setRevenue(e.target.value)} placeholder="t.ex. 46200" />
        </FormGroup>
        <FormGroup label="Förväntade nätter">
          <input className="form-input" type="number" value={nights}
                 onChange={e => setNights(e.target.value)} placeholder="t.ex. 220" />
        </FormGroup>
        <FormGroup label="Förvaltning €">
          <input className="form-input" type="number" value={management}
                 onChange={e => setManagement(e.target.value)} />
        </FormGroup>
        <FormGroup label="Städning €">
          <input className="form-input" type="number" value={cleaning}
                 onChange={e => setCleaning(e.target.value)} />
        </FormGroup>
        <FormGroup label="Fasta (IBI + försäkring + comm. + gestor) €">
          <input className="form-input" type="number" value={fixed}
                 onChange={e => setFixed(e.target.value)} />
        </FormGroup>
        <FormGroup label="Underhåll €">
          <input className="form-input" type="number" value={maintenance}
                 onChange={e => setMaintenance(e.target.value)} />
        </FormGroup>
        <FormGroup label="Övrigt €" span2>
          <input className="form-input" type="number" value={other}
                 onChange={e => setOther(e.target.value)} />
        </FormGroup>
        <FormGroup label="Anteckning" span2>
          <input className="form-input" value={notes}
                 onChange={e => setNotes(e.target.value)} placeholder="t.ex. Konservativ — räknat med 60% beläggning" />
        </FormGroup>
      </div>
    </Modal>
  );
}
