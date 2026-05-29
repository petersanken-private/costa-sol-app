import { useState } from 'react';
import { useRecurringExpenses } from '../../hooks/useRecurringExpenses';
import { RecurringExpense } from '../../types';
import { Card, Btn, Badge, IconBtn } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';
import { EXPENSE_LABELS } from '../../data';
import { frequencyLabel, annualizedCost } from '../../utils/recurring.utils';
import { RecurringModal } from './RecurringModal';

export interface RecurringExpensesTabProps {
  propertyId: string;
}

export function RecurringExpensesTab({ propertyId }: RecurringExpensesTabProps) {
  const { items, loading, add, update, remove, generateAll } = useRecurringExpenses(propertyId);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState<RecurringExpense | null>(null);
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
      <div className="flex justify-end mb-3">
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
        <div
          className={`db-error-banner ${lastResult.startsWith('Fel') ? '' : 'db-error-banner--success'}`}
          style={{ marginBottom: '16px', background: lastResult.startsWith('Fel') ? undefined : 'var(--green)20' }}
        >
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
              <div key={r.id} className="group table-row"
                   style={{ gridTemplateColumns: '1.5fr 1fr 1fr 100px 100px 80px', opacity: r.active ? 1 : 0.5 }}>
                <span>
                  <strong>{r.description}</strong>
                  {!r.active && <span className="text-mute" style={{ marginLeft: '6px', fontSize: '12px' }}>(pausad)</span>}
                </span>
                <Badge label={EXPENSE_LABELS[r.category] ?? r.category} />
                <span className="text-mute" style={{ fontSize: '13px' }}>{frequencyLabel(r)}</span>
                <span className="font-display text-[18px]">{fmtMoney(r.amount)}</span>
                <span className="font-display text-[18px] text-gold">{fmtMoney(annualizedCost(r))}</span>
                <span style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                  <IconBtn variant="edit"   onClick={() => { setEditing(r); setShowModal(true); }} />
                  <IconBtn variant="delete" onClick={() => handleDelete(r)} />
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
