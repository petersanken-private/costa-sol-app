import { useState, useMemo } from 'react';
import { useMortgages, MortgageWithPeriods } from '../hooks/useMortgages';
import { Mortgage, MortgageRatePeriod, AmortizationType, RateType } from '../types';
import { Card, Btn, Modal, FormGroup, Badge, Stat, SectionHeader } from './ui';
import { fmtMoney, fmtPct } from '../utils/calc.utils';
import {
  buildAmortizationSchedule, summarizeByYear, currentBalance,
  totalInterestPaid,
} from '../utils/mortgage.utils';

const AMORT_LABELS: Record<AmortizationType, string> = {
  annuity:       'Annuitet',
  linear:        'Rak',
  interest_only: 'Endast ränta',
};

function newMortgageId() { return 'mtg-' + Math.random().toString(36).slice(2, 10); }
function newPeriodId()   { return 'rp-'  + Math.random().toString(36).slice(2, 10); }

interface Props { propertyId: string; }

export function MortgagesTab({ propertyId }: Props) {
  const { items, loading, add, remove, addRatePeriod, removeRatePeriod } = useMortgages(propertyId);
  const [showMortgageModal, setShowMortgageModal] = useState(false);
  const [showPeriodModal,   setShowPeriodModal]   = useState<string | null>(null);
  const [expandedId,        setExpandedId]        = useState<string | null>(null);

  async function handleAddMortgage(m: Mortgage, rate: number) {
    await add(m, rate);
    setShowMortgageModal(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Ta bort detta bolån? Alla ränteperioder försvinner också.')) return;
    await remove(id);
  }

  return (
    <>
      <div className="tab-action-bar">
        <span className="text-mute" style={{ fontSize: '13px' }}>
          {items.length} bolån registrera{items.length === 1 ? 't' : 'de'}
        </span>
        <Btn variant="primary" size="sm" onClick={() => setShowMortgageModal(true)}>
          + Nytt bolån
        </Btn>
      </div>

      {loading ? (
        <p className="text-mute">Laddar…</p>
      ) : items.length === 0 ? (
        <Card>
          <div className="empty-state">
            <p className="empty-state__icon">🏦</p>
            <p className="empty-state__title">Inget bolån registrerat</p>
            <p className="empty-state__sub">
              Lägg till bolånedetaljer för att se amorteringsplan och total räntekostnad.
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map(it => (
            <MortgageCard
              key={it.mortgage.id}
              data={it}
              expanded={expandedId === it.mortgage.id}
              onToggle={() => setExpandedId(expandedId === it.mortgage.id ? null : it.mortgage.id)}
              onDelete={() => handleDelete(it.mortgage.id)}
              onAddPeriod={() => setShowPeriodModal(it.mortgage.id)}
              onRemovePeriod={id => removeRatePeriod(id)}
            />
          ))}
        </div>
      )}

      {showMortgageModal && (
        <MortgageModal
          propertyId={propertyId}
          onClose={() => setShowMortgageModal(false)}
          onSave={handleAddMortgage}
        />
      )}

      {showPeriodModal && (
        <RatePeriodModal
          mortgageId={showPeriodModal}
          onClose={() => setShowPeriodModal(null)}
          onSave={async (p) => { await addRatePeriod(p); setShowPeriodModal(null); }}
        />
      )}
    </>
  );
}

// ── Per-bolån-kort ────────────────────────────────────────────────────────────
interface MortgageCardProps {
  data:          MortgageWithPeriods;
  expanded:      boolean;
  onToggle:      () => void;
  onDelete:      () => void;
  onAddPeriod:   () => void;
  onRemovePeriod: (id: string) => void;
}

function MortgageCard({ data, expanded, onToggle, onDelete, onAddPeriod, onRemovePeriod }: MortgageCardProps) {
  const { mortgage, periods } = data;

  const schedule = useMemo(
    () => buildAmortizationSchedule(mortgage, periods),
    [mortgage, periods],
  );
  const yearSummary = useMemo(() => summarizeByYear(schedule), [schedule]);
  const balance     = useMemo(() => currentBalance(schedule), [schedule]);
  const totalInt    = useMemo(() => totalInterestPaid(schedule), [schedule]);

  const firstPayment = schedule[0]?.payment ?? 0;
  const currentRate  = periods[periods.length - 1]?.ratePct ?? 0;

  return (
    <Card className="card-p">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div className="detail-badges" style={{ marginBottom: '6px' }}>
            <Badge label={AMORT_LABELS[mortgage.amortizationType]} />
            <Badge label={`${mortgage.termYears} år`} />
          </div>
          <h3 style={{ margin: 0, fontSize: '18px' }}>{mortgage.bankName || 'Bolån'}</h3>
          <p className="text-mute" style={{ fontSize: '13px', marginTop: '4px' }}>
            Start {mortgage.startDate} · Ursprungligt {fmtMoney(mortgage.originalAmount)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Btn size="sm" onClick={onToggle}>{expanded ? 'Dölj plan' : 'Visa plan'}</Btn>
          <button className="delete-btn" onClick={onDelete} title="Ta bort">×</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4">
        <Stat label="Nuv. saldo"      value={fmtMoney(balance)}      sub={`av ${fmtMoney(mortgage.originalAmount)}`} />
        <Stat label="Månadskostnad"   value={fmtMoney(firstPayment)} sub="vid start"                                color="var(--gold)" />
        <Stat label="Aktuell ränta"   value={fmtPct(currentRate, 2)} sub={`${periods.length} period${periods.length === 1 ? '' : 'er'}`} />
        <Stat label="Total ränta"     value={fmtMoney(totalInt)}     sub="över hela perioden"                       color="var(--red)" />
      </div>

      {/* Räntehistorik */}
      <div style={{ marginTop: '20px' }}>
        <SectionHeader
          title="Ränteperioder"
          action={<Btn size="sm" onClick={onAddPeriod}>+ Lägg till räntebyte</Btn>}
        />
        <div className="table-header" style={{ gridTemplateColumns: '1fr 1fr 80px 100px 60px' }}>
          <span>Från</span>
          <span>Till</span>
          <span>Typ</span>
          <span>Ränta</span>
          <span></span>
        </div>
        {periods.map(p => (
          <div key={p.id} className="table-row" style={{ gridTemplateColumns: '1fr 1fr 80px 100px 60px' }}>
            <span>{p.startDate}</span>
            <span className="text-mute">{p.endDate ?? 'pågående'}</span>
            <Badge label={p.rateType === 'fixed' ? 'Fast' : 'Rörlig'} />
            <span className="cell-amount">{fmtPct(p.ratePct, 3)}</span>
            <button className="delete-btn" onClick={() => onRemovePeriod(p.id)}
                    disabled={periods.length === 1}
                    title={periods.length === 1 ? 'Måste ha minst en period' : 'Ta bort'}>×</button>
          </div>
        ))}
      </div>

      {/* Amorteringsplan */}
      {expanded && (
        <div style={{ marginTop: '20px' }}>
          <SectionHeader title="Amorteringsplan per år" />
          <div className="table-header" style={{ gridTemplateColumns: '80px 1fr 1fr 1fr 1fr' }}>
            <span>År</span>
            <span>Total betalning</span>
            <span>Ränta</span>
            <span>Amortering</span>
            <span>Återstår</span>
          </div>
          {yearSummary.map(y => (
            <div key={y.year} className="table-row" style={{ gridTemplateColumns: '80px 1fr 1fr 1fr 1fr' }}>
              <span><strong>{y.year}</strong></span>
              <span className="cell-amount">{fmtMoney(y.totalPayment)}</span>
              <span className="cell-amount" style={{ color: 'var(--red)' }}>{fmtMoney(y.totalInterest)}</span>
              <span className="cell-amount" style={{ color: 'var(--green)' }}>{fmtMoney(y.totalAmort)}</span>
              <span className="cell-amount text-mute">{fmtMoney(y.endBalance)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Modaler ───────────────────────────────────────────────────────────────────
interface MortgageModalProps {
  propertyId: string;
  onClose:    () => void;
  onSave:     (m: Mortgage, rate: number) => void;
}

function MortgageModal({ propertyId, onClose, onSave }: MortgageModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [bankName,    setBankName]     = useState('');
  const [amount,      setAmount]       = useState('');
  const [startDate,   setStartDate]    = useState(today);
  const [termYears,   setTermYears]    = useState('25');
  const [amortType,   setAmortType]    = useState<AmortizationType>('annuity');
  const [initialRate, setInitialRate]  = useState('4.5');
  const [notes,       setNotes]        = useState('');
  const [error,       setError]        = useState('');

  function handleSave() {
    const amt  = parseInt(amount.replace(/\D/g, ''));
    const rate = parseFloat(initialRate);
    const yrs  = parseInt(termYears);
    if (!amt || amt <= 0) return setError('Lånebeloppet måste vara större än 0.');
    if (!rate || rate <= 0) return setError('Räntan måste vara större än 0.');
    if (!yrs  || yrs  <= 0) return setError('Löptiden måste vara större än 0.');

    onSave({
      id:               newMortgageId(),
      propertyId,
      bankName:         bankName.trim(),
      originalAmount:   amt,
      startDate,
      termYears:        yrs,
      amortizationType: amortType,
      notes:            notes.trim() || undefined,
    }, rate);
  }

  return (
    <Modal
      title="Nytt bolån"
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleSave}>Lägg till</Btn>
      </>}
    >
      {error && <p className="form-error">{error}</p>}
      <div className="grid-2">
        <FormGroup label="Bank" span2>
          <input className="form-input" value={bankName} onChange={e => setBankName(e.target.value)}
                 placeholder="t.ex. BBVA, Santander, SEB" />
        </FormGroup>
        <FormGroup label="Lånebelopp € *">
          <input className="form-input" type="number" value={amount}
                 onChange={e => setAmount(e.target.value)} placeholder="t.ex. 468000" />
        </FormGroup>
        <FormGroup label="Startdatum *">
          <input className="form-input" type="date" value={startDate}
                 onChange={e => setStartDate(e.target.value)} />
        </FormGroup>
        <FormGroup label="Löptid (år)">
          <input className="form-input" type="number" value={termYears}
                 onChange={e => setTermYears(e.target.value)} />
        </FormGroup>
        <FormGroup label="Initial ränta (%)">
          <input className="form-input" type="number" step="0.01" value={initialRate}
                 onChange={e => setInitialRate(e.target.value)} placeholder="t.ex. 4.5" />
        </FormGroup>
        <FormGroup label="Amorteringstyp" span2>
          <select className="form-input" value={amortType}
                  onChange={e => setAmortType(e.target.value as AmortizationType)}>
            <option value="annuity">Annuitet — konstant månadsbetalning</option>
            <option value="linear">Rak — sjunkande månadsbetalning</option>
            <option value="interest_only">Endast ränta — amorteringsfritt</option>
          </select>
        </FormGroup>
        <FormGroup label="Anteckning" span2>
          <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} />
        </FormGroup>
      </div>
    </Modal>
  );
}

interface RatePeriodModalProps {
  mortgageId: string;
  onClose:    () => void;
  onSave:     (p: MortgageRatePeriod) => void;
}

function RatePeriodModal({ mortgageId, onClose, onSave }: RatePeriodModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate,   setEndDate]   = useState('');
  const [ratePct,   setRatePct]   = useState('');
  const [rateType,  setRateType]  = useState<RateType>('fixed');
  const [notes,     setNotes]     = useState('');
  const [error,     setError]     = useState('');

  function handleSave() {
    const r = parseFloat(ratePct);
    if (!r || r <= 0) return setError('Räntan måste vara större än 0.');
    if (!startDate)   return setError('Startdatum krävs.');

    onSave({
      id:         newPeriodId(),
      mortgageId,
      startDate,
      endDate:    endDate || undefined,
      ratePct:    r,
      rateType,
      notes:      notes.trim() || undefined,
    });
  }

  return (
    <Modal
      title="Ny ränteperiod"
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleSave}>Lägg till</Btn>
      </>}
    >
      {error && <p className="form-error">{error}</p>}
      <p className="text-mute" style={{ fontSize: '13px', marginBottom: '12px' }}>
        Använd t.ex. när räntan binds om eller rörlig ränta uppdateras.
      </p>
      <div className="grid-2">
        <FormGroup label="Från datum *">
          <input className="form-input" type="date" value={startDate}
                 onChange={e => setStartDate(e.target.value)} />
        </FormGroup>
        <FormGroup label="Till datum (valfritt)">
          <input className="form-input" type="date" value={endDate}
                 onChange={e => setEndDate(e.target.value)} />
        </FormGroup>
        <FormGroup label="Ränta % *">
          <input className="form-input" type="number" step="0.001" value={ratePct}
                 onChange={e => setRatePct(e.target.value)} placeholder="t.ex. 3.85" />
        </FormGroup>
        <FormGroup label="Typ">
          <select className="form-input" value={rateType}
                  onChange={e => setRateType(e.target.value as RateType)}>
            <option value="fixed">Fast</option>
            <option value="variable">Rörlig</option>
          </select>
        </FormGroup>
        <FormGroup label="Anteckning" span2>
          <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} />
        </FormGroup>
      </div>
    </Modal>
  );
}
