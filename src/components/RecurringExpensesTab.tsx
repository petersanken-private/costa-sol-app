import { useState } from 'react';
import { useRecurringExpenses } from '../hooks/useRecurringExpenses';
import { RecurringExpense, RecurringFrequency, ExpenseCategory } from '../types';
import { Card, Btn, Modal, FormGroup, Badge } from './ui';
import { fmtMoney } from '../utils/calc.utils';
import { EXPENSE_LABELS } from '../data';
import { frequencyLabel, annualizedCost } from '../utils/recurring.utils';

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

interface Props { propertyId: string; }

export function RecurringExpensesTab({ propertyId }: Props) {
  const { items, loading, add, update, remove, generateAll } = useRecurringExpenses(propertyId);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState<RecurringExpense | null>(null);
  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function handleSave(rec: RecurringExpense) {
    if (editing) await update(rec);
    else         await add(rec);
    setShowModal(false);
    setEditing(null);
  }

  async function handleGenerate() {
    setGenerating(true);
    setLastResult(null);
    const { created, error } = await generateAll();
    setGenerating(false);
    if (error) setLastResult(`Fel: ${error}`);
    else       setLastResult(`${created} ny${created === 1 ? '' : 'a'} kostnadspost${created === 1 ? '' : 'er'} genererade.`);
  }

  async function handleDelete(rec: RecurringExpense) {
    if (!window.confirm(`Ta bort "${rec.description}"? (Tidigare genererade poster påverkas inte.)`)) return;
    await remove(rec.id);
  }

  const totalAnnualized = items.filter(r => r.active).reduce((s, r) => s + annualizedCost(r), 0);

  return (
    <>
      <div className="tab-action-bar">
        <span className="text-mute" style={{ fontSize: '13px' }}>
          Totalt årligen: <strong className="text-gold">{fmtMoney(totalAnnualized)}</strong>
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Btn size="sm" onClick={handleGenerate} disabled={generating || items.length === 0}>
            {generating ? 'Genererar…' : '↻ Generera saknade poster'}
          </Btn>
          <Btn variant="primary" size="sm" onClick={() => { setEditing(null); setShowModal(true); }}>
            + Ny mall
          </Btn>
        </div>
      </div>

      {lastResult && (
        <div className={`db-error-banner ${lastResult.startsWith('Fel') ? '' : 'db-error-banner--success'}`}
             style={{ marginBottom: '16px', background: lastResult.startsWith('Fel') ? undefined : 'var(--green)20' }}>
          <span>{lastResult.startsWith('Fel') ? '⚠' : '✓'} {lastResult}</span>
        </div>
      )}

      <Card>
        {loading ? (
          <p className="text-mute" style={{ padding: '20px' }}>Laddar…</p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__icon">🔁</p>
            <p className="empty-state__title">Inga återkommande utgifter</p>
            <p className="empty-state__sub">
              Skapa mallar för IBI, community, försäkring etc. som genereras automatiskt.
            </p>
          </div>
        ) : (
          <>
            <div className="table-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 100px 100px 80px' }}>
              <span>Beskrivning</span>
              <span>Kategori</span>
              <span>Frekvens</span>
              <span>Belopp</span>
              <span>Per år</span>
              <span></span>
            </div>
            {items.map(r => (
              <div key={r.id} className="table-row"
                   style={{ gridTemplateColumns: '1.5fr 1fr 1fr 100px 100px 80px', opacity: r.active ? 1 : 0.5 }}>
                <span>
                  <strong>{r.description}</strong>
                  {!r.active && <span className="text-mute" style={{ marginLeft: '6px', fontSize: '12px' }}>(pausad)</span>}
                </span>
                <Badge label={EXPENSE_LABELS[r.category] ?? r.category} />
                <span className="text-mute" style={{ fontSize: '13px' }}>{frequencyLabel(r)}</span>
                <span className="cell-amount">{fmtMoney(r.amount)}</span>
                <span className="cell-amount text-gold">{fmtMoney(annualizedCost(r))}</span>
                <span style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  <button className="edit-btn"  onClick={() => { setEditing(r); setShowModal(true); }}>✎</button>
                  <button className="delete-btn" onClick={() => handleDelete(r)}>×</button>
                </span>
              </div>
            ))}
          </>
        )}
      </Card>

      {showModal && (
        <RecurringModal
          initial={editing}
          propertyId={propertyId}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </>
  );
}

interface ModalProps {
  initial:    RecurringExpense | null;
  propertyId: string;
  onClose:    () => void;
  onSave:     (rec: RecurringExpense) => void;
}

function RecurringModal({ initial, propertyId, onClose, onSave }: ModalProps) {
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
