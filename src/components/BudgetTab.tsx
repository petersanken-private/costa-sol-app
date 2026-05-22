import { useState, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { useBudgets, buildComparison, BudgetComparison } from '../hooks/useBudgets';
import { Budget } from '../types';
import { Card, Btn, Modal, FormGroup, SectionHeader } from './ui';
import { fmtMoney, fmtPct } from '../utils/calc.utils';

function newId() { return 'bud-' + Math.random().toString(36).slice(2, 10); }

const CURRENT_YEAR = new Date().getFullYear();

interface Props { propertyId: string; }

export function BudgetTab({ propertyId }: Props) {
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
  const comparison    = currentBudget
    ? buildComparison(currentBudget, rentals, expenses)
    : null;

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
        <ComparisonView comparison={comparison} />
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

// ── Comparison-vy ─────────────────────────────────────────────────────────────
function ComparisonView({ comparison }: { comparison: BudgetComparison }) {
  const { budget, actual, variance } = comparison;

  // Total beräkning
  const totalBudgetCosts = budget.expectedManagement + budget.expectedCleaning + budget.expectedFixed
                         + budget.expectedMaintenance + budget.expectedOther;
  const totalActualCosts = actual.management + actual.cleaning + actual.fixed
                         + actual.maintenance + actual.other;

  const budgetNet = budget.expectedRevenue - totalBudgetCosts;
  const actualNet = actual.revenue - totalActualCosts;
  const netVariance = actualNet - budgetNet;

  // Rad-konfig: revenue är "mer = bra", kostnader är "mindre = bra"
  const rows: { label: string; expected: number; actual: number; variance: number; isIncome: boolean }[] = [
    { label: 'Bruttohyra',                expected: budget.expectedRevenue,     actual: actual.revenue,     variance: variance.revenue,     isIncome: true  },
    { label: 'Förvaltning',                expected: budget.expectedManagement,  actual: actual.management,  variance: variance.management,  isIncome: false },
    { label: 'Städning',                   expected: budget.expectedCleaning,    actual: actual.cleaning,    variance: variance.cleaning,    isIncome: false },
    { label: 'Fasta (IBI, försäkring m.m.)', expected: budget.expectedFixed,       actual: actual.fixed,       variance: variance.fixed,       isIncome: false },
    { label: 'Underhåll',                  expected: budget.expectedMaintenance, actual: actual.maintenance, variance: variance.maintenance, isIncome: false },
    { label: 'Övrigt',                     expected: budget.expectedOther,       actual: actual.other,       variance: variance.other,       isIncome: false },
  ];

  function varianceColor(v: number, isIncome: boolean): string {
    if (v === 0) return 'var(--text-mute)';
    const isGood = isIncome ? v > 0 : v < 0;
    return isGood ? 'var(--green)' : 'var(--red)';
  }

  return (
    <>
      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <Card className="card-p-md">
          <p className="stat-label">Budget netto</p>
          <p className="stat-value">{fmtMoney(budgetNet)}</p>
          <p className="stat-sub">Planerat utfall</p>
        </Card>
        <Card className="card-p-md">
          <p className="stat-label">Faktiskt netto</p>
          <p className="stat-value" style={{ color: actualNet >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {fmtMoney(actualNet)}
          </p>
          <p className="stat-sub">Verkligt utfall</p>
        </Card>
        <Card className="card-p-md">
          <p className="stat-label">Avvikelse</p>
          <p className="stat-value" style={{ color: varianceColor(netVariance, true) }}>
            {netVariance >= 0 ? '+' : ''}{fmtMoney(netVariance)}
          </p>
          <p className="stat-sub">
            {budgetNet !== 0 ? `${fmtPct((netVariance / Math.abs(budgetNet)) * 100, 1)} vs budget` : '—'}
          </p>
        </Card>
        <Card className="card-p-md">
          <p className="stat-label">Nätter</p>
          <p className="stat-value">{actual.nights}</p>
          <p className="stat-sub">Budget: {budget.expectedNights} ({variance.nights >= 0 ? '+' : ''}{variance.nights})</p>
        </Card>
      </div>

      <Card className="card-p">
        <SectionHeader title={`Detaljerad jämförelse · ${budget.year}`} />
        <div className="table-header" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 80px' }}>
          <span></span>
          <span>Budget</span>
          <span>Faktiskt</span>
          <span>Avvikelse</span>
          <span>% utfall</span>
        </div>
        {rows.map((row, i) => {
          const pctOf = row.expected !== 0 ? (row.actual / row.expected) * 100 : 0;
          return (
            <div key={i} className="table-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 80px' }}>
              <span><strong>{row.label}</strong></span>
              <span className="cell-amount text-mute">{fmtMoney(row.expected)}</span>
              <span className="cell-amount">{fmtMoney(row.actual)}</span>
              <span className="cell-amount" style={{ color: varianceColor(row.variance, row.isIncome) }}>
                {row.variance >= 0 ? '+' : ''}{fmtMoney(row.variance)}
              </span>
              <span className="cell-amount text-mute" style={{ fontSize: '13px' }}>
                {row.expected !== 0 ? `${pctOf.toFixed(0)}%` : '—'}
              </span>
            </div>
          );
        })}
      </Card>

      {budget.notes && (
        <Card className="card-p" style={{ marginTop: '16px' }}>
          <p className="text-mute" style={{ fontSize: '13px' }}>Anteckning: {budget.notes}</p>
        </Card>
      )}
    </>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface BudgetModalProps {
  initial:    Budget | null;
  propertyId: string;
  year:       number;
  onClose:    () => void;
  onSave:     (b: Budget) => void;
}

function BudgetModal({ initial, propertyId, year, onClose, onSave }: BudgetModalProps) {
  const [revenue,     setRevenue]     = useState(String(initial?.expectedRevenue     ?? 0));
  const [nights,      setNights]      = useState(String(initial?.expectedNights      ?? 0));
  const [management,  setManagement]  = useState(String(initial?.expectedManagement  ?? 0));
  const [cleaning,    setCleaning]    = useState(String(initial?.expectedCleaning    ?? 0));
  const [fixed,       setFixed]       = useState(String(initial?.expectedFixed       ?? 0));
  const [maintenance, setMaintenance] = useState(String(initial?.expectedMaintenance ?? 0));
  const [other,       setOther]       = useState(String(initial?.expectedOther       ?? 0));
  const [notes,       setNotes]       = useState(initial?.notes ?? '');

  function n(s: string): number { return parseInt(s.replace(/\D/g, '')) || 0; }

  function handleSave() {
    onSave({
      id:                  initial?.id ?? newId(),
      propertyId,
      year,
      expectedRevenue:     n(revenue),
      expectedNights:      n(nights),
      expectedManagement:  n(management),
      expectedCleaning:    n(cleaning),
      expectedFixed:       n(fixed),
      expectedMaintenance: n(maintenance),
      expectedOther:       n(other),
      notes:               notes.trim() || undefined,
    });
  }

  return (
    <Modal
      title={`${initial ? 'Redigera' : 'Ny'} budget · ${year}`}
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleSave}>Spara</Btn>
      </>}
    >
      <p className="text-mute" style={{ fontSize: '13px', marginBottom: '16px' }}>
        Belopp i EUR per år. Jämförs sen mot faktiskt registrerade hyror och kostnader.
      </p>
      <div className="grid-2">
        <FormGroup label="Förväntad bruttohyra €">
          <input className="form-input" type="number" value={revenue}
                 onChange={e => setRevenue(e.target.value)} placeholder="t.ex. 46200" />
        </FormGroup>
        <FormGroup label="Förväntade nätter">
          <input className="form-input" type="number" value={nights}
                 onChange={e => setNights(e.target.value)} placeholder="t.ex. 220" />
        </FormGroup>

        <FormGroup label="Förvaltning €">
          <input className="form-input" type="number" value={management}
                 onChange={e => setManagement(e.target.value)} />
        </FormGroup>
        <FormGroup label="Städning €">
          <input className="form-input" type="number" value={cleaning}
                 onChange={e => setCleaning(e.target.value)} />
        </FormGroup>

        <FormGroup label="Fasta (IBI + försäkring + comm. + gestor) €">
          <input className="form-input" type="number" value={fixed}
                 onChange={e => setFixed(e.target.value)} />
        </FormGroup>
        <FormGroup label="Underhåll €">
          <input className="form-input" type="number" value={maintenance}
                 onChange={e => setMaintenance(e.target.value)} />
        </FormGroup>

        <FormGroup label="Övrigt €" span2>
          <input className="form-input" type="number" value={other}
                 onChange={e => setOther(e.target.value)} />
        </FormGroup>

        <FormGroup label="Anteckning" span2>
          <input className="form-input" value={notes}
                 onChange={e => setNotes(e.target.value)} placeholder="t.ex. Konservativ — räknat med 60% beläggning" />
        </FormGroup>
      </div>
    </Modal>
  );
}
