import { useState } from 'react';
import { Btn, Modal, FormGroup } from '../ui';
import { Mortgage, AmortizationType } from '../../types';

function newId() { return 'mtg-' + Math.random().toString(36).slice(2, 10); }

export interface MortgageModalProps {
  propertyId: string;
  onClose:    () => void;
  onSave:     (m: Mortgage, rate: number) => void;
}

export function MortgageModal({ propertyId, onClose, onSave }: MortgageModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [bankName,    setBankName]    = useState('');
  const [amount,      setAmount]      = useState('');
  const [startDate,   setStartDate]   = useState(today);
  const [termYears,   setTermYears]   = useState('25');
  const [amortType,   setAmortType]   = useState<AmortizationType>('annuity');
  const [initialRate, setInitialRate] = useState('4.5');
  const [notes,       setNotes]       = useState('');
  const [error,       setError]       = useState('');

  function handleSave() {
    const amt  = parseInt(amount.replace(/\D/g, ''));
    const rate = parseFloat(initialRate);
    const yrs  = parseInt(termYears);
    if (!amt || amt <= 0)   return setError('Lånebeloppet måste vara större än 0.');
    if (!rate || rate <= 0) return setError('Räntan måste vara större än 0.');
    if (!yrs  || yrs  <= 0) return setError('Löptiden måste vara större än 0.');

    onSave({
      id:               newId(),
      propertyId,
      bankName:         bankName.trim(),
      originalAmount:   amt,
      startDate,
      termYears:        yrs,
      amortizationType: amortType,
      notes:            notes.trim() || undefined,
    }, rate);
  }

  return (
    <Modal
      title="Nytt bolån"
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleSave}>Lägg till</Btn>
      </>}
    >
      {error && <p className="form-error">{error}</p>}
      <div className="grid-2">
        <FormGroup label="Bank" span2>
          <input className="form-input" value={bankName} onChange={e => setBankName(e.target.value)}
                 placeholder="t.ex. BBVA, Santander, SEB" />
        </FormGroup>
        <FormGroup label="Lånebelopp € *">
          <input className="form-input" type="number" value={amount}
                 onChange={e => setAmount(e.target.value)} placeholder="t.ex. 468000" />
        </FormGroup>
        <FormGroup label="Startdatum *">
          <input className="form-input" type="date" value={startDate}
                 onChange={e => setStartDate(e.target.value)} />
        </FormGroup>
        <FormGroup label="Löptid (år)">
          <input className="form-input" type="number" value={termYears}
                 onChange={e => setTermYears(e.target.value)} />
        </FormGroup>
        <FormGroup label="Initial ränta (%)">
          <input className="form-input" type="number" step="0.01" value={initialRate}
                 onChange={e => setInitialRate(e.target.value)} placeholder="t.ex. 4.5" />
        </FormGroup>
        <FormGroup label="Amorteringstyp" span2>
          <select className="form-input" value={amortType}
                  onChange={e => setAmortType(e.target.value as AmortizationType)}>
            <option value="annuity">Annuitet — konstant månadsbetalning</option>
            <option value="linear">Rak — sjunkande månadsbetalning</option>
            <option value="interest_only">Endast ränta — amorteringsfritt</option>
          </select>
        </FormGroup>
        <FormGroup label="Anteckning" span2>
          <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} />
        </FormGroup>
      </div>
    </Modal>
  );
}
