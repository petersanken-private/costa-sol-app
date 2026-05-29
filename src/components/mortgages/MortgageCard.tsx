import { useMemo } from 'react';
import { Card, Btn, Badge, Stat, SectionHeader, IconBtn } from '../ui';
import { MortgageWithPeriods } from '../../hooks/useMortgages';
import { AmortizationType } from '../../types';
import { fmtMoney, fmtPct } from '../../utils/calc.utils';
import {
  buildAmortizationSchedule, summarizeByYear, currentBalance, totalInterestPaid,
} from '../../utils/mortgage.utils';

const AMORT_LABELS: Record<AmortizationType, string> = {
  annuity:       'Annuitet',
  linear:        'Rak',
  interest_only: 'Endast ränta',
};

export interface MortgageCardProps {
  data:           MortgageWithPeriods;
  expanded:       boolean;
  onToggle:       () => void;
  onDelete:       () => void;
  onAddPeriod:    () => void;
  onRemovePeriod: (id: string) => void;
}

export function MortgageCard({
  data, expanded, onToggle, onDelete, onAddPeriod, onRemovePeriod,
}: MortgageCardProps) {
  const { mortgage, periods } = data;

  const schedule    = useMemo(() => buildAmortizationSchedule(mortgage, periods), [mortgage, periods]);
  const yearSummary = useMemo(() => summarizeByYear(schedule), [schedule]);
  const balance     = useMemo(() => currentBalance(schedule),  [schedule]);
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
          <IconBtn variant="delete" onClick={onDelete} alwaysVisible />
        </div>
      </div>

      <div className="grid-4">
        <Stat label="Nuv. saldo"    value={fmtMoney(balance)}      sub={`av ${fmtMoney(mortgage.originalAmount)}`} />
        <Stat label="Månadskostnad" value={fmtMoney(firstPayment)} sub="vid start"                                 color="var(--gold)" />
        <Stat label="Aktuell ränta" value={fmtPct(currentRate, 2)} sub={`${periods.length} period${periods.length === 1 ? '' : 'er'}`} />
        <Stat label="Total ränta"   value={fmtMoney(totalInt)}     sub="över hela perioden"                        color="var(--red)" />
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
            <IconBtn
              variant="delete"
              onClick={() => onRemovePeriod(p.id)}
              disabled={periods.length === 1}
              title={periods.length === 1 ? 'Måste ha minst en period' : 'Ta bort'}
              alwaysVisible
            />
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
