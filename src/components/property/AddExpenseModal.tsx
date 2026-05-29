import { useState } from 'react';
import { Btn, Modal, FormGroup } from '../ui';
import { Expense, ExpenseCategory } from '../../types';
import { EXPENSE_LABELS } from '../../data';

export interface AddExpenseModalProps {
  propertyId: string;
  initial?:   Expense;
  onClose:    () => void;
  onAdd:      (e: Expense) => void;
}

export function AddExpenseModal({ propertyId, initial, onClose, onAdd }: AddExpenseModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [date,        setDate]        = useState(initial?.date        ?? today);
  const [category,    setCategory]    = useState<ExpenseCategory>(initial?.category ?? 'management');
  const [amount,      setAmount]      = useState(initial ? String(initial.amount) : '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [deductible,  setDeductible]  = useState(initial?.deductible  ?? true);
  const [error,       setError]       = useState('');
  const isEdit = !!initial;

  // Auto-set deductible based on category
  function handleCategoryChange(cat: ExpenseCategory) {
    setCategory(cat);
    setDeductible(cat !== 'other');
    if (!description) setDescription(EXPENSE_LABELS[cat] ?? '');
  }

  function handleSubmit() {
    const a = parseInt(amount.replace(/\D/g, ''), 10);
    if (!a) { setError('Fyll i ett belopp.'); return; }
    if (!description.trim()) { setError('Fyll i en beskrivning.'); return; }
    onAdd({
      id:          `e-${Date.now()}`,
      propertyId,
      date,
      category,
      amount:      a,
      description: description.trim(),
      deductible,
    });
  }

  return (
    <Modal
      title={isEdit ? 'Redigera kostnad' : 'Logga kostnad'}
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleSubmit}>{isEdit ? 'Spara ändringar' : 'Spara'}</Btn>
      </>}
    >
      <div className="grid-2">
        <FormGroup label="Datum">
          <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </FormGroup>

        <FormGroup label="Kategori">
          <select
            className="form-input"
            value={category}
            onChange={e => handleCategoryChange(e.target.value as ExpenseCategory)}
          >
            {Object.entries(EXPENSE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </FormGroup>

        <FormGroup label="Belopp (€) *" span2>
          <input
            className="form-input"
            type="number"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="t.ex. 1200"
          />
        </FormGroup>

        <FormGroup label="Beskrivning *" span2>
          <input
            className="form-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="t.ex. IBI 2025"
          />
        </FormGroup>

        <div className="col-span-2 flex items-center gap-2.5 flex-wrap">
          <input
            type="checkbox"
            id="deductible"
            checked={deductible}
            onChange={e => setDeductible(e.target.checked)}
            style={{ accentColor: 'var(--gold)', width: '16px', height: '16px' }}
          />
          <label htmlFor="deductible" className="form-label" style={{ cursor: 'pointer', margin: 0 }}>
            Avdragsgill kostnad (IRNR)
          </label>
          <span className="text-[11px] text-text-mute basis-full -mt-1">Förvaltning, IBI, städning m.m. är avdragsgilla.</span>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}
