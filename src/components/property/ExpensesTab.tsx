import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { Card, Badge, Btn, IconBtn } from '../ui';
import { Property, Expense } from '../../types';
import { EXPENSE_LABELS } from '../../data';
import { fmtMoney } from '../../utils/calc.utils';
import { ExportMenu } from '../ExportMenu';
import { AddExpenseModal } from './AddExpenseModal';
import { exportExpensesCsv, exportExpensesPdf } from '../../utils/export';

export interface ExpensesTabProps {
  property: Property;
  expenses: Expense[];
}

export function ExpensesTab({ property, expenses }: ExpensesTabProps) {
  const { dispatch } = useApp();
  const [showAdd,     setShowAdd]     = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  function handleDelete(id: string) {
    if (window.confirm('Ta bort denna kostnad?')) {
      dispatch({ type: 'DELETE_EXPENSE', id });
    }
  }

  const totalExpenses   = expenses.reduce((s, e) => s + e.amount, 0);
  const deductibleTotal = expenses.filter(e => e.deductible).reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <div className="tab-action-bar">
        <ExportMenu
          label="Exportera"
          options={[
            { label: 'CSV (Excel)',    icon: '📊', onClick: () => exportExpensesCsv(property.name, expenses) },
            { label: 'PDF (utskrift)', icon: '📄', onClick: () => exportExpensesPdf(property.name, expenses) },
          ]}
        />
        <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>+ Logga kostnad</Btn>
      </div>
      <Card>
        {expenses.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__icon">🧾</p>
            <p className="empty-state__title">Inga kostnader ännu</p>
            <p className="empty-state__sub">Klicka "+ Logga kostnad" för att lägga till din första post.</p>
          </div>
        ) : (
          <>
            <div className="table-header grid-cols-[110px_1fr_140px_100px_70px_36px] gap-3 max-md:!grid-cols-[90px_1fr_90px_70px_44px] max-md:!gap-2">
              <span>Datum</span>
              <span>Beskrivning</span>
              <span>Kategori</span>
              <span>Belopp</span>
              <span>Avdrag</span>
              <span></span>
            </div>
            {expenses.map(e => (
              <div key={e.id} className="group table-row grid-cols-[110px_1fr_140px_100px_70px_36px] gap-3 max-md:!grid-cols-[90px_1fr_90px_70px_44px] max-md:!gap-2">
                <span className="text-mute" style={{ fontSize: '12px' }}>{e.date}</span>
                <span>{e.description}</span>
                <Badge label={EXPENSE_LABELS[e.category] ?? e.category} color="var(--text-mute)" />
                <span style={{ color: 'var(--red)', fontSize: '14px' }}>−{fmtMoney(e.amount)}</span>
                <span style={{ color: e.deductible ? 'var(--green)' : 'var(--text-mute)', fontSize: '12px' }}>
                  {e.deductible ? '✓ Ja' : '—'}
                </span>
                <IconBtn variant="edit"   onClick={() => setEditExpense(e)} />
                <IconBtn variant="delete" onClick={() => handleDelete(e.id)} />
              </div>
            ))}
            <div className="table-footer">
              <span className="text-mute">Totalt: <strong style={{ color: 'var(--red)' }}>−{fmtMoney(totalExpenses)}</strong></span>
              <span className="text-mute">Avdragsgillt: <strong style={{ color: 'var(--green)' }}>{fmtMoney(deductibleTotal)}</strong></span>
            </div>
          </>
        )}
      </Card>

      {showAdd && (
        <AddExpenseModal
          propertyId={property.id}
          onClose={() => setShowAdd(false)}
          onAdd={expense => { dispatch({ type: 'ADD_EXPENSE', expense }); setShowAdd(false); }}
        />
      )}
      {editExpense && (
        <AddExpenseModal
          propertyId={property.id}
          initial={editExpense}
          onClose={() => setEditExpense(null)}
          onAdd={expense => {
            dispatch({ type: 'DELETE_EXPENSE', id: editExpense.id });
            dispatch({ type: 'ADD_EXPENSE', expense });
            setEditExpense(null);
          }}
        />
      )}
    </>
  );
}
