import { useState } from 'react';
import { Btn, Modal, FormGroup } from '../ui';
import { MortgageRatePeriod, RateType } from '../../types';

function newId() { return 'rp-' + Math.random().toString(36).slice(2, 10); }

export interface RatePeriodModalProps {
  mortgageId: string;
  onClose:    () => void;
  onSave:     (p: MortgageRatePeriod) => void;
}

export function RatePeriodModal({ mortgageId, onClose, onSave }: RatePeriodModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate,   setEndDate]   = useState('');
  const [ratePct,   setRatePct]   = useState('');
  const [rateType,  setRateType]  = useState<RateType>('fixed');
  const [notes,     setNotes]     = useState('');
  const [error,     setError]     = useState('');

  function handleSave() {
    const r = parseFloat(ratePct);
    if (!r || r <= 0) return setError('Räntan måste vara större än 0.');
    if (!startDate)   return setError('Startdatum krävs.');

    onSave({
      id:         newId(),
      mortgageId,
      startDate,
      endDate:    endDate || undefined,
      ratePct:    r,
      rateType,
      notes:      notes.trim() || undefined,
    });
  }

  return (
    <Modal
      title="Ny ränteperiod"
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleSave}>Lägg till</Btn>
      </>}
    >
      {error && <p className="form-error">{error}</p>}
      <p className="text-mute" style={{ fontSize: '13px', marginBottom: '12px' }}>
        Använd t.ex. när räntan binds om eller rörlig ränta uppdateras.
      </p>
      <div className="grid-2">
        <FormGroup label="Från datum *">
          <input className="form-input" type="date" value={startDate}
                 onChange={e => setStartDate(e.target.value)} />
        </FormGroup>
        <FormGroup label="Till datum (valfritt)">
          <input className="form-input" type="date" value={endDate}
                 onChange={e => setEndDate(e.target.value)} />
        </FormGroup>
        <FormGroup label="Ränta % *">
          <input className="form-input" type="number" step="0.001" value={ratePct}
                 onChange={e => setRatePct(e.target.value)} placeholder="t.ex. 3.85" />
        </FormGroup>
        <FormGroup label="Typ">
          <select className="form-input" value={rateType}
                  onChange={e => setRateType(e.target.value as RateType)}>
            <option value="fixed">Fast</option>
            <option value="variable">Rörlig</option>
          </select>
        </FormGroup>
        <FormGroup label="Anteckning" span2>
          <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} />
        </FormGroup>
      </div>
    </Modal>
  );
}
