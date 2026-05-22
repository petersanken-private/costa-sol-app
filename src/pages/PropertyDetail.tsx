import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { Card, Badge, Btn, SectionHeader, Stat, Divider, Tabs, Modal, FormGroup } from '../components/ui';
import { fmtMoney, fmtPct, calcInvestment, calcBuyingCosts, cashflowLabelColor, cashflowValueColor } from '../utils/calc';
import { OPERATING } from '../constants/tax';
import { SCENARIOS, MONTHS_SV, EXPENSE_LABELS, PLATFORM_COLORS, STATUS_LABELS, STATUS_COLORS } from '../data';
import { ScenarioKey, RentalEntry, Expense, ExpenseCategory, RentalPlatform } from '../types';
import { ExportMenu } from '../components/ExportMenu';
import { DocumentsTab } from '../components/DocumentsTab';
import { RecurringExpensesTab } from '../components/RecurringExpensesTab';
import { MortgagesTab } from '../components/MortgagesTab';
import { BudgetTab } from '../components/BudgetTab';
import { AIPanel } from '../components/AIPanel';
import { RentalSources } from '../components/RentalSources';
import { exportRentalsCsv, exportRentalsPdf, exportExpensesCsv, exportExpensesPdf } from '../utils/export';

const DETAIL_TABS = [
  { id: 'calc',       label: 'Kalkylator'      },
  { id: 'rentals',    label: 'Hyreshistorik'   },
  { id: 'expenses',   label: 'Kostnader'       },
  { id: 'recurring',  label: 'Återkommande'    },
  { id: 'mortgage',   label: 'Bolån'           },
  { id: 'budget',     label: 'Budget vs utfall' },
  { id: 'ai',         label: '🤖 AI-analys'    },
  { id: 'docs',       label: 'Dokument'        },
];

const CURRENT_YEAR = new Date().getFullYear();

// ── Main component ────────────────────────────────────────────────────────────

export function PropertyDetail() {
  const { state, navigate, dispatch, getProperty, getRentalsForProperty, getExpensesForProperty } = useApp();
  const [scenario, setScenario]       = useState<ScenarioKey>('base');
  const [tab, setTab]                 = useState('calc');
  const [showAddRental, setShowAddRental]   = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editRental,  setEditRental]  = useState<RentalEntry | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  const property = getProperty(state.selectedPropertyId ?? '');
  if (!property) {
    return (
      <div className="page">
        <p className="text-mute">Fastigheten hittades inte.</p>
        <Btn onClick={() => navigate('portfolio')}>← Tillbaka</Btn>
      </div>
    );
  }

  const rentals  = getRentalsForProperty(property.id);
  const expenses = getExpensesForProperty(property.id);
  const sc       = SCENARIOS.find(s => s.key === scenario)!;

  const result = calcInvestment({
    purchasePrice: property.purchasePrice,
    scenario:      sc,
    horizonYears:  5,
    useMortgage:   false,
    mortgagePct:   60,
    mortgageRate:  0.045,
  });

  const costs = calcBuyingCosts(property.purchasePrice);
  const gain  = property.currentValue - property.purchasePrice;

  const totalRentRevenue = rentals.reduce((s, r) => s + r.revenue, 0);
  const totalNights      = rentals.reduce((s, r) => s + r.nights, 0);
  const totalExpenses    = expenses.reduce((s, e) => s + e.amount, 0);
  const deductibleTotal  = expenses.filter(e => e.deductible).reduce((s, e) => s + e.amount, 0);

  function handleDeleteRental(id: string) {
    if (window.confirm('Ta bort denna hyrespost?')) {
      dispatch({ type: 'DELETE_RENTAL', id });
    }
  }

  function handleDeleteExpense(id: string) {
    if (window.confirm('Ta bort denna kostnad?')) {
      dispatch({ type: 'DELETE_EXPENSE', id });
    }
  }

  return (
    <div className="page">
      <button className="link-btn" style={{ marginBottom: '20px' }} onClick={() => navigate('portfolio')}>
        ← Tillbaka till portfölj
      </button>

      {/* Header */}
      <div className="detail-top">
        <div>
          <div className="detail-badges">
            <Badge label={STATUS_LABELS[property.status]} color={STATUS_COLORS[property.status]} />
            {property.hasVFTLicense && <Badge label="VFT-licens" color="var(--green)" />}
          </div>
          <h1 className="page-title" style={{ fontSize: '32px' }}>{property.name}</h1>
          <p className="text-mute" style={{ marginTop: '4px', fontSize: '14px' }}>
            {property.area} · {property.development} · {property.bedrooms} sovrum · {property.sizeSqm} m²
          </p>
        </div>
        <div className="detail-price-block">
          <p className="detail-price-eyebrow">Köpeskilling</p>
          <p className="detail-price-value">{fmtMoney(property.purchasePrice)}</p>
          <p className="detail-price-sub" style={{ color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
            Nuv. värde {fmtMoney(property.currentValue)} ({gain >= 0 ? '+' : ''}{fmtMoney(gain)})
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Hyresintäkt (log)',   value: fmtMoney(totalRentRevenue), sub: `${totalNights} nätter totalt`  },
          { label: 'Kostnader (log)',      value: fmtMoney(totalExpenses),    sub: 'Bokförda utgifter'             },
          { label: 'Netto f. skatt (log)', value: fmtMoney(totalRentRevenue - totalExpenses), sub: 'Faktiskt utfall' },
          { label: 'Total kapitalinsats',  value: fmtMoney(property.purchasePrice + costs.total), sub: '≈ +12% omkostnader' },
        ].map((s, i) => (
          <Card key={i} className="card-p-md">
            <Stat label={s.label} value={s.value} sub={s.sub} />
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs tabs={DETAIL_TABS} active={tab} onChange={setTab} />

      {/* ── Kalkylator ── */}
      {tab === 'calc' && (
        <div>
          <div className="scenario-list" style={{ marginBottom: '20px', maxWidth: '600px' }}>
            {SCENARIOS.map(s => (
              <button
                key={s.key}
                className="scenario-btn"
                style={{
                  borderColor: scenario === s.key ? s.color : undefined,
                  background:  scenario === s.key ? s.color + '10' : undefined,
                }}
                onClick={() => setScenario(s.key)}
              >
                <span className="scenario-btn__label" style={{ color: scenario === s.key ? s.color : undefined }}>
                  {s.label}
                </span>
                <span className="scenario-btn__meta">
                  {s.nights} nätter · €{s.adr}/natt · +{s.annualGrowthPct}%/år
                </span>
              </button>
            ))}
          </div>

          <div className="grid-2">
            <Card>
              <div className="card-p" style={{ paddingBottom: 0 }}>
                <SectionHeader title="Kassaflöde / år (est.)" />
              </div>
              {[
                { label: 'Bruttohyra',                            value:  result.grossRent,                isIncome: true },
                { label: 'Förvaltning (18%)',                     value: -result.managementFee                            },
                { label: `Städning (${sc.nights} nätter)`,        value: -result.cleaningCost                             },
                { label: 'IBI + Försäkring + Community + Gestor', value: -result.fixedCosts                               },
                { label: `Underhåll (${(OPERATING.MAINTENANCE_PCT * 100).toFixed(1)}%)`, value: -(property.purchasePrice * OPERATING.MAINTENANCE_PCT) },
                { label: 'Netto f. skatt',                        value:  result.netBeforeTax,             isNet: true    },
                { label: 'IRNR-skatt (19%)',                      value: -result.tax                                      },
                { label: 'Netto e. skatt',                        value:  result.netAfterTax,              isFinal: true  },
              ].map((row, i) => (
                <div key={i} className={`cashflow-row ${row.isFinal ? 'cashflow-row--final' : ''} ${row.isNet ? 'cashflow-row--net' : ''}`}>
                  <span style={{ color: cashflowLabelColor(row) }}>
                    {row.label}
                  </span>
                  <span style={{ color: cashflowValueColor({ ...row, value: row.value }, sc.color) }}>
                    {row.value >= 0 ? '+' : '−'}{fmtMoney(Math.abs(row.value))}
                  </span>
                </div>
              ))}
            </Card>

            <Card className="card-p">
              <SectionHeader title="Avkastning & exit (5 år)" />
              <div className="grid-2" style={{ marginBottom: '20px' }}>
                <Stat label="Direktavkastning" value={fmtPct(result.netYield)}         sub="Netto på eget kapital"   color={sc.color}       />
                <Stat label="Bruttoyield"       value={fmtPct(result.grossYield)}       sub="Brutto på köpeskilling"                          />
                <Stat label="Exit-pris (5 år)"  value={fmtMoney(result.exitPrice)}        sub={`+${sc.annualGrowthPct}%/år`} color="var(--gold)" />
                <Stat label="Totalavkastning"   value={fmtPct(result.annualizedReturn)} sub="Annualiserat inkl. exit"  color={sc.color}       />
              </div>
              <Divider />
              <div className="exit-highlight" style={{ background: sc.color + '10', border: `1px solid ${sc.color}30`, marginTop: '16px' }}>
                <label>Total vinst efter 5 år</label>
                <p style={{ color: sc.color }}>{fmtMoney(result.totalReturn)}</p>
                <small>{fmtMoney(result.cumulativeRent)} hyra + {fmtMoney(result.saleProfit)} värdeökning (e. skatt)</small>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── Hyreshistorik ── */}
      {tab === 'rentals' && (
        <>
          <RentalSources propertyId={property.id} />
          <div className="tab-action-bar">
            <ExportMenu
              label="Exportera"
              options={[
                { label: 'CSV (Excel)', icon: '📊', onClick: () => exportRentalsCsv(property.name, rentals) },
                { label: 'PDF (utskrift)', icon: '📄', onClick: () => exportRentalsPdf(property.name, rentals) },
              ]}
            />
            <Btn variant="primary" size="sm" onClick={() => setShowAddRental(true)}>
              + Logga hyresintäkt
            </Btn>
          </div>
          <Card>
            {rentals.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state__icon">📅</p>
                <p className="empty-state__title">Ingen hyresdata ännu</p>
                <p className="empty-state__sub">Klicka "+ Logga hyresintäkt" för att lägga till din första post.</p>
              </div>
            ) : (
              <>
                <div className="table-header rentals-cols">
                  <span>År</span>
                  <span>Mån</span>
                  <span>Nätter</span>
                  <span>Intäkt</span>
                  <span>Plattform</span>
                  <span>Snitt/natt</span>
                  <span></span>
                </div>
                {rentals.map(r => (
                  <div key={r.id} className="table-row rentals-cols">
                    <span className="text-mute">{r.year}</span>
                    <span className="text-mute">{MONTHS_SV[r.month - 1]}</span>
                    <span>{r.nights}</span>
                    <span className="cell-amount text-gold">{fmtMoney(r.revenue)}</span>
                    <Badge label={r.platform} color={PLATFORM_COLORS[r.platform]} />
                    <span className="text-mute">{fmtMoney(r.revenue / r.nights)}/natt</span>
                    <button className="edit-btn" onClick={() => setEditRental(r)} title="Redigera">✎</button>
                    <button className="delete-btn" onClick={() => handleDeleteRental(r.id)} title="Ta bort">×</button>
                  </div>
                ))}
                <div className="table-footer">
                  <span className="text-mute">
                    Totalt: <strong className="text-gold">{fmtMoney(totalRentRevenue)}</strong>
                  </span>
                  <span className="text-mute">{totalNights} nätter</span>
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {/* ── Återkommande utgifter ── */}
      {tab === 'recurring' && (
        <RecurringExpensesTab propertyId={property.id} />
      )}

      {/* ── Bolån ── */}
      {tab === 'mortgage' && (
        <MortgagesTab propertyId={property.id} />
      )}

      {/* ── Budget vs faktiskt ── */}
      {tab === 'budget' && (
        <BudgetTab propertyId={property.id} />
      )}

      {/* ── AI-analys ── */}
      {tab === 'ai' && (
        <AIPanel
          scope="property"
          propertyId={property.id}
          title={`🤖 AI-djupanalys · ${property.name}`}
          presets={[
            { key: 'property-deepdive', icon: '🔬', label: 'Djupanalys av objektet' },
          ]}
        />
      )}

      {/* ── Dokument ── */}
      {tab === 'docs' && (
        <DocumentsTab propertyId={property.id} />
      )}

      {tab === 'expenses' && (
        <>
          <div className="tab-action-bar">
            <ExportMenu
              label="Exportera"
              options={[
                { label: 'CSV (Excel)', icon: '📊', onClick: () => exportExpensesCsv(property.name, expenses) },
                { label: 'PDF (utskrift)', icon: '📄', onClick: () => exportExpensesPdf(property.name, expenses) },
              ]}
            />
            <Btn variant="primary" size="sm" onClick={() => setShowAddExpense(true)}>
              + Logga kostnad
            </Btn>
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
                <div className="table-header expenses-cols">
                  <span>Datum</span>
                  <span>Beskrivning</span>
                  <span>Kategori</span>
                  <span>Belopp</span>
                  <span>Avdrag</span>
                  <span></span>
                </div>
                {expenses.map(e => (
                  <div key={e.id} className="table-row expenses-cols">
                    <span className="text-mute" style={{ fontSize: '12px' }}>{e.date}</span>
                    <span>{e.description}</span>
                    <Badge label={EXPENSE_LABELS[e.category] ?? e.category} color="var(--text-mute)" />
                    <span style={{ color: 'var(--red)', fontSize: '14px' }}>−{fmtMoney(e.amount)}</span>
                    <span style={{ color: e.deductible ? 'var(--green)' : 'var(--text-mute)', fontSize: '12px' }}>
                      {e.deductible ? '✓ Ja' : '—'}
                    </span>
                    <button className="edit-btn" onClick={() => setEditExpense(e)} title="Redigera">✎</button>
                    <button className="delete-btn" onClick={() => handleDeleteExpense(e.id)} title="Ta bort">×</button>
                  </div>
                ))}
                <div className="table-footer">
                  <span className="text-mute">
                    Totalt: <strong style={{ color: 'var(--red)' }}>−{fmtMoney(totalExpenses)}</strong>
                  </span>
                  <span className="text-mute">
                    Avdragsgillt: <strong style={{ color: 'var(--green)' }}>{fmtMoney(deductibleTotal)}</strong>
                  </span>
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {/* Notes */}
      {property.notes && (
        <Card className="card-p-sm" style={{ marginTop: '16px' }}>
          <p className="text-mute" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>
            Anteckningar
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6 }}>{property.notes}</p>
        </Card>
      )}

      {/* Edit modals */}
      {editRental && (
        <AddRentalModal
          propertyId={property.id}
          initial={editRental}
          onClose={() => setEditRental(null)}
          onAdd={rental => {
            dispatch({ type: 'DELETE_RENTAL', id: editRental.id });
            dispatch({ type: 'ADD_RENTAL', rental });
            setEditRental(null);
          }}
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
      {/* Add modals */}
      {showAddRental && (
        <AddRentalModal
          propertyId={property.id}
          onClose={() => setShowAddRental(false)}
          onAdd={rental => { dispatch({ type: 'ADD_RENTAL', rental }); setShowAddRental(false); }}
        />
      )}
      {showAddExpense && (
        <AddExpenseModal
          propertyId={property.id}
          onClose={() => setShowAddExpense(false)}
          onAdd={expense => { dispatch({ type: 'ADD_EXPENSE', expense }); setShowAddExpense(false); }}
        />
      )}
    </div>
  );
}

// ── Add Rental Modal ──────────────────────────────────────────────────────────

interface AddRentalModalProps {
  propertyId: string;
  initial?:   RentalEntry;
  onClose:    () => void;
  onAdd:      (r: RentalEntry) => void;
}

function AddRentalModal({ propertyId, initial, onClose, onAdd }: AddRentalModalProps) {
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
      title={isEdit ? "Redigera hyresintäkt" : "Logga hyresintäkt"}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
          <Btn variant="primary" onClick={handleSubmit}>{isEdit ? "Spara ändringar" : "Spara"}</Btn>
        </>
      }
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

// ── Add Expense Modal ─────────────────────────────────────────────────────────

interface AddExpenseModalProps {
  propertyId: string;
  initial?:   Expense;
  onClose:    () => void;
  onAdd:      (e: Expense) => void;
}

function AddExpenseModal({ propertyId, initial, onClose, onAdd }: AddExpenseModalProps) {
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
      title={isEdit ? "Redigera kostnad" : "Logga kostnad"}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
          <Btn variant="primary" onClick={handleSubmit}>{isEdit ? "Spara ändringar" : "Spara"}</Btn>
        </>
      }
    >
      <div className="grid-2">
        <FormGroup label="Datum">
          <input
            className="form-input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
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

        <div className="col-span-2 deductible-toggle">
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
          <span className="deductible-hint">Förvaltning, IBI, städning m.m. är avdragsgilla.</span>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}
