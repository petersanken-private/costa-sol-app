import { useState } from 'react';
import { Btn, Modal, FormGroup } from '../ui';
import { RentalEntry, RentalPlatform } from '../../types';
import { MONTHS_SV } from '../../data';
import { fmtMoney } from '../../utils/calc.utils';

const CURRENT_YEAR = new Date().getFullYear();

export interface AddRentalModalProps {
  propertyId: string;
  initial?:   RentalEntry;
  onClose:    () => void;
  onAdd:      (r: RentalEntry) => void;
}

export function AddRentalModal({ propertyId, initial, onClose, onAdd }: AddRentalModalProps) {
  const [year,     setYear]     = useState(initial ? String(initial.year)     : String(CURRENT_YEAR));
  const [month,    setMonth]    = useState(initial ? String(initial.month)    : String(new Date().getMonth() + 1));
  const [nights,   setNights]   = useState(initial ? String(initial.nights)   : '');
  const [revenue,  setRevenue]  = useState(initial ? String(initial.revenue)  : '');
  const [platform, setPlatform] = useState<RentalPlatform>(initial?.platform ?? 'airbnb');
  const [notes,    setNotes]    = useState(initial?.notes ?? '');
  const [error,    setError]    = useState('');
  const isEdit = !!initial;

  function handleSubmit() {
    const n = parseInt(nights, 10);
    const r = parseInt(revenue.replace(/\D/g, ''), 10);
    if (!n || !r) { setError('Fyll i antal nätter och intäkt.'); return; }
    if (n < 1 || n > 31) { setError('Ogiltigt antal nätter (1–31).'); return; }
    onAdd({
      id:         `r-${Date.now()}`,
      propertyId,
      year:       parseInt(year, 10),
      month:      parseInt(month, 10),
      nights:     n,
      revenue:    r,
      platform,
      notes:      notes || undefined,
    });
  }

  return (
    <Modal
      title={isEdit ? 'Redigera hyresintäkt' : 'Logga hyresintäkt'}
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleSubmit}>{isEdit ? 'Spara ändringar' : 'Spara'}</Btn>
      </>}
    >
      <div className="grid-2">
        <FormGroup label="År">
          <select className="form-input" value={year} onChange={e => setYear(e.target.value)}>
            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </FormGroup>

        <FormGroup label="Månad">
          <select className="form-input" value={month} onChange={e => setMonth(e.target.value)}>
            {MONTHS_SV.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </FormGroup>

        <FormGroup label="Antal nätter *">
          <input
            className="form-input"
            type="number"
            min="1"
            max="31"
            value={nights}
            onChange={e => setNights(e.target.value)}
            placeholder="t.ex. 14"
          />
        </FormGroup>

        <FormGroup label="Intäkt (€) *">
          <input
            className="form-input"
            type="number"
            min="0"
            value={revenue}
            onChange={e => setRevenue(e.target.value)}
            placeholder="t.ex. 3500"
          />
        </FormGroup>

        <FormGroup label="Plattform" span2>
          <div className="platform-picker">
            {(['airbnb', 'booking', 'direct', 'long-term'] as RentalPlatform[]).map(p => (
              <button
                key={p}
                type="button"
                className={`platform-btn ${platform === p ? 'platform-btn--active' : ''}`}
                onClick={() => setPlatform(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </FormGroup>

        <FormGroup label="Anteckning (valfri)" span2>
          <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="t.ex. Pris inkl. städavgift" />
        </FormGroup>
      </div>

      {error && <p className="form-error">{error}</p>}

      {nights && revenue && (
        <div className="modal-preview">
          <span>Snitt per natt</span>
          <strong>{fmtMoney(parseInt(revenue.replace(/\D/g, ''), 10) / parseInt(nights, 10))}</strong>
        </div>
      )}
    </Modal>
  );
}
