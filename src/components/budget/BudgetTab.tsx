import { useState, useMemo } from 'react';
import { useApp } from '../../hooks/useApp';
import { useBudgets, buildComparison } from '../../hooks/useBudgets';
import { Budget } from '../../types';
import { Card, Btn } from '../ui';
import { BudgetModal } from './BudgetModal';
import { BudgetComparisonView } from './BudgetComparisonView';

const CURRENT_YEAR = new Date().getFullYear();

export interface BudgetTabProps {
  propertyId: string;
}

export function BudgetTab({ propertyId }: BudgetTabProps) {
  const { getRentalsForProperty, getExpensesForProperty } = useApp();
  const { budgets, loading, upsert, remove } = useBudgets(propertyId);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [showModal,    setShowModal]    = useState(false);
  const [editing,      setEditing]      = useState<Budget | null>(null);

  const rentals  = getRentalsForProperty(propertyId);
  const expenses = getExpensesForProperty(propertyId);

  const availableYears = useMemo(() => {
    const ys = new Set<number>();
    ys.add(CURRENT_YEAR);
    budgets.forEach(b => ys.add(b.year));
    rentals.forEach(r => ys.add(r.year));
    expenses.forEach(e => ys.add(parseInt(e.date.substring(0, 4), 10)));
    return Array.from(ys).sort((a, b) => b - a);
  }, [budgets, rentals, expenses]);

  const currentBudget = budgets.find(b => b.year === selectedYear);
  const comparison    = currentBudget ? buildComparison(currentBudget, rentals, expenses) : null;

  async function handleSave(b: Budget) {
    await upsert(b);
    setShowModal(false);
    setEditing(null);
  }

  async function handleDelete() {
    if (!currentBudget) return;
    if (!window.confirm(`Ta bort budget för ${selectedYear}?`)) return;
    await remove(currentBudget.id);
  }

  return (
    <>
      <div className="tab-action-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="text-mute" style={{ fontSize: '13px' }}>År:</span>
          <select
            className="form-input"
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            style={{ width: 'auto', minWidth: '100px' }}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>
                {y}{budgets.some(b => b.year === y) ? ' ★' : ''}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {currentBudget && (
            <Btn size="sm" variant="danger" onClick={handleDelete}>Ta bort</Btn>
          )}
          <Btn variant="primary" size="sm" onClick={() => {
            setEditing(currentBudget ?? null);
            setShowModal(true);
          }}>
            {currentBudget ? '✎ Redigera budget' : '+ Skapa budget'}
          </Btn>
        </div>
      </div>

      {loading ? (
        <p className="text-mute">Laddar…</p>
      ) : !currentBudget ? (
        <Card>
          <div className="empty-state">
            <p className="empty-state__icon">📊</p>
            <p className="empty-state__title">Ingen budget för {selectedYear}</p>
            <p className="empty-state__sub">
              Skapa en budget för att jämföra mot verkligt utfall (hyror + kostnader).
            </p>
          </div>
        </Card>
      ) : comparison && (
        <BudgetComparisonView comparison={comparison} />
      )}

      {showModal && (
        <BudgetModal
          initial={editing}
          propertyId={propertyId}
          year={selectedYear}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </>
  );
}
