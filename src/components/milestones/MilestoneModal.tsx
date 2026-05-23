import { useState } from 'react';
import { Btn, Modal, FormGroup } from '../ui';
import { Milestone, MilestoneCategory } from '../../types';
import { MILESTONE_CATS } from './milestoneCategories';

function newId() { return 'ms-' + Math.random().toString(36).slice(2, 10); }

export interface MilestoneModalProps {
  initial:    Milestone | null;
  properties: { id: string; name: string }[];
  saving:     boolean;
  onClose:    () => void;
  onSave:     (m: Milestone) => void;
}

export function MilestoneModal({ initial, properties, saving, onClose, onSave }: MilestoneModalProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [title,      setTitle]      = useState(initial?.title      ?? '');
  const [category,   setCategory]   = useState<MilestoneCategory>(initial?.category ?? 'payment');
  const [dueDate,    setDueDate]    = useState(initial?.dueDate    ?? defaultDate);
  const [propertyId, setPropertyId] = useState(initial?.propertyId ?? '');
  const [amount,     setAmount]     = useState(initial?.amount ? String(initial.amount) : '');
  const [notes,      setNotes]      = useState(initial?.notes ?? '');
  const [error,      setError]      = useState('');

  // Föreslå titel när kategori ändras om fältet är tomt
  function handleCategoryChange(cat: MilestoneCategory) {
    setCategory(cat);
    if (!title) {
      const suggestions: Record<MilestoneCategory, string> = {
        payment:    'Betalningsetapp',
        completion: 'Inflyttning',
        vft:        'VFT-licensansökan',
        tax:        'Modelo 210 inlämning',
        inspection: 'Besiktning',
        legal:      'Juridisk deadline',
        bank:       'Bankärende',
        renovation: 'Renovering / möblering',
        rental:     'Hyresrelaterat',
        other:      '',
      };
      setTitle(suggestions[cat] ?? '');
    }
  }

  function handleSave() {
    if (!title.trim()) return setError('Titel krävs.');
    if (!dueDate)      return setError('Datum krävs.');
    onSave({
      id:          initial?.id ?? newId(),
      propertyId,
      title:       title.trim(),
      category,
      dueDate,
      status:      initial?.status ?? 'upcoming',
      amount:      amount ? parseInt(amount.replace(/\D/g, '')) || undefined : undefined,
      notes:       notes.trim() || undefined,
      completedAt: initial?.completedAt,
    });
  }

  return (
    <Modal
      title={initial ? 'Redigera milstolpe' : 'Ny milstolpe'}
      onClose={onClose}
      footer={<>
        <Btn variant="ghost"   onClick={onClose}    disabled={saving}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Sparar…' : initial ? 'Spara' : 'Lägg till'}
        </Btn>
      </>}
    >
      {error && <p className="form-error">{error}</p>}

      <FormGroup label="Kategori">
        <div className="ms-cat-grid">
          {MILESTONE_CATS.map(c => (
            <button
              key={c.key}
              type="button"
              className={`ms-cat-btn ${category === c.key ? 'ms-cat-btn--active' : ''}`}
              onClick={() => handleCategoryChange(c.key)}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </FormGroup>

      <div className="grid-2" style={{ marginTop: '16px' }}>
        <FormGroup label="Titel *" className="col-span-2">
          <input className="form-input" value={title} onChange={e => setTitle(e.target.value)}
                 placeholder="t.ex. Betalningsetapp 2 — 20%" />
        </FormGroup>

        <FormGroup label="Datum *">
          <input className="form-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </FormGroup>

        <FormGroup label="Belopp (€, valfritt)">
          <input className="form-input" type="number" value={amount}
                 onChange={e => setAmount(e.target.value)} placeholder="t.ex. 156000" />
        </FormGroup>

        <FormGroup label="Fastighet (valfritt)" className="col-span-2">
          <select className="form-input" value={propertyId} onChange={e => setPropertyId(e.target.value)}>
            <option value="">— Hela portföljen —</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </FormGroup>

        <FormGroup label="Anteckning" className="col-span-2">
          <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)}
                 placeholder="t.ex. Betalas via Handelsbanken utlandsöverföring" />
        </FormGroup>
      </div>
    </Modal>
  );
}
