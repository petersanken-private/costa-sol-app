import { useState } from 'react';
import { Btn, Modal, FormGroup } from '../ui';
import { RecurringExpense, RecurringFrequency, ExpenseCategory } from '../../types';
import { EXPENSE_LABELS } from '../../data';

const FREQ_LABELS: Record<RecurringFrequency, string> = {
  monthly:   'Månadsvis',
  quarterly: 'Kvartalsvis',
  yearly:    'Årligen',
};

const CATEGORY_OPTIONS: ExpenseCategory[] = [
  'ibi', 'community', 'insurance', 'gestor', 'management',
  'cleaning', 'maintenance', 'mortgage', 'legal', 'utilities', 'other',
];

function newId() { return 'rec-' + Math.random().toString(36).slice(2, 10); }

export interface RecurringModalProps {
  initial:    RecurringExpense | null;
  propertyId: string;
  onClose:    () => void;
  onSave:     (rec: RecurringExpense) => void;
}

export function RecurringModal({ initial, propertyId, onClose, onSave }: RecurringModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [description, setDescription] = useState(initial?.description ?? '');
  const [category,    setCategory]    = useState<ExpenseCategory>(initial?.category ?? 'ibi');
  const [amount,      setAmount]      = useState(String(initial?.amount ?? ''));
  const [frequency,   setFrequency]   = useState<RecurringFrequency>(initial?.frequency ?? 'yearly');
  const [startDate,   setStartDate]   = useState(initial?.startDate ?? today);
  const [endDate,     setEndDate]     = useState(initial?.endDate ?? '');
  const [dayOfMonth,  setDayOfMonth]  = useState(String(initial?.dayOfMonth ?? 1));
  const [monthOfYear, setMonthOfYear] = useState(String(initial?.monthOfYear ?? 1));
  const [deductible,  setDeductible]  = useState(initial?.deductible ?? true);
  const [active,      setActive]      = useState(initial?.active ?? true);
  const [notes,       setNotes]       = useState(initial?.notes ?? '');
  const [error,       setError]       = useState('');

  function handleSave() {
    const amt = parseInt(amount.replace(/\D/g, ''));
    if (!description.trim()) return setError('Beskrivning krävs.');
    if (!amt || amt <= 0)    return setError('Belopp måste vara större än 0.');
    if (!startDate)          return setError('Startdatum krävs.');

    onSave({
      id:               initial?.id ?? newId(),
      propertyId,
      category,
      description:      description.trim(),
      amount:           amt,
      frequency,
      startDate,
      endDate:          endDate || undefined,
      dayOfMonth:       parseInt(dayOfMonth) || 1,
      monthOfYear:      frequency === 'yearly' ? (parseInt(monthOfYear) || 1) : undefined,
      deductible,
      lastGeneratedDate: initial?.lastGeneratedDate,
      active,
      notes:            notes.trim() || undefined,
    });
  }

  return (
    <Modal
      title={initial ? 'Redigera mall' : 'Ny återkommande utgift'}
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleSave}>{initial ? 'Spara' : 'Lägg till'}</Btn>
      </>}
    >
      {error && <p className="form-error">{error}</p>}

      <div className="grid-2">
        <FormGroup label="Beskrivning *" span2>
          <input className="form-input" value={description} onChange={e => setDescription(e.target.value)}
                 placeholder="t.ex. IBI årlig" />
        </FormGroup>
        <FormGroup label="Kategori">
          <select className="form-input" value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{EXPENSE_LABELS[c] ?? c}</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Belopp € *">
          <input className="form-input" type="number" value={amount}
                 onChange={e => setAmount(e.target.value)} placeholder="t.ex. 1100" />
        </FormGroup>
        <FormGroup label="Frekvens">
          <select className="form-input" value={frequency}
                  onChange={e => setFrequency(e.target.value as RecurringFrequency)}>
            {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Dag i månaden (1-28)">
          <input className="form-input" type="number" min={1} max={28}
                 value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} />
        </FormGroup>
        {frequency === 'yearly' && (
          <FormGroup label="Månad (1-12)">
            <input className="form-input" type="number" min={1} max={12}
                   value={monthOfYear} onChange={e => setMonthOfYear(e.target.value)} />
          </FormGroup>
        )}
        <FormGroup label="Startdatum *">
          <input className="form-input" type="date" value={startDate}
                 onChange={e => setStartDate(e.target.value)} />
        </FormGroup>
        <FormGroup label="Slutdatum (valfritt)">
          <input className="form-input" type="date" value={endDate}
                 onChange={e => setEndDate(e.target.value)} />
        </FormGroup>
        <FormGroup label="Anteckning" span2>
          <input className="form-input" value={notes}
                 onChange={e => setNotes(e.target.value)} placeholder="t.ex. Betalas via SEB autogiro" />
        </FormGroup>
        <FormGroup label="Avdragsgill?">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={deductible} onChange={e => setDeductible(e.target.checked)} />
            <span>Ja, dra av mot hyresintäkter</span>
          </label>
        </FormGroup>
        <FormGroup label="Aktiv?">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
            <span>Generera framöver</span>
          </label>
        </FormGroup>
      </div>
    </Modal>
  );
}
