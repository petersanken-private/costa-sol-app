// ── MortgageCard ──────────────────────────────────────────────────────────────
// Tidshorisont + bolåns-inställningar för kalkylatorn.

import { Card } from '../ui';
import { rateForDate } from '../../utils/mortgage.utils';
import type { MortgageWithPeriods } from '../../hooks/useMortgages';
import type { Property } from '../../types';

const HORIZON_OPTIONS = [3, 5, 7, 10] as const;
const LTV_OPTIONS     = [50, 60, 70]  as const;
const AMORT_OPTIONS   = [1, 2, 3]     as const;

interface MortgageCardProps {
  mortgages:         MortgageWithPeriods[];
  properties:        Property[];
  purchasePrice:     number;
  horizonYears:      number;
  onHorizonChange:   (y: number) => void;
  useMortgage:       boolean;
  onMortgageToggle:  (v: boolean) => void;
  mortgageRatePct:   number;
  onRateChange:      (v: number) => void;
  mortgagePct:       number;
  onLtvChange:       (v: number) => void;
  amortPct:          number;
  onAmortChange:     (v: number) => void;
}

export function MortgageCard({
  mortgages, properties, purchasePrice,
  horizonYears, onHorizonChange,
  useMortgage, onMortgageToggle,
  mortgageRatePct, onRateChange,
  mortgagePct, onLtvChange,
  amortPct, onAmortChange,
}: MortgageCardProps) {
  function handleSavedMortgage(id: string) {
    const m = mortgages.find(x => x.mortgage.id === id);
    if (!m) return;
    const ltv  = Math.round((m.mortgage.originalAmount / purchasePrice) * 100);
    const rate = rateForDate(m.periods, new Date().toISOString().split('T')[0]);
    onLtvChange(Math.min(80, Math.max(10, ltv)));
    onRateChange(rate);
  }

  return (
    <div>
      <p className="form-label mb-2.5 uppercase tracking-[0.094em]">Tidshorisont &amp; bolån</p>
      <Card className="card-p">
        <p className="form-label mb-2">Horisont (år)</p>
        <div className="flex gap-2 mb-4">
          {HORIZON_OPTIONS.map(y => {
            const active = horizonYears === y;
            return (
              <button
                key={y}
                className={[
                  'flex-1 py-2 px-3 min-h-[40px] max-md:min-h-[44px] rounded-[6px] border text-[13px] transition-all duration-150',
                  active
                    ? 'border-gold bg-gold-faint text-gold font-medium'
                    : 'border-border bg-transparent text-text-mute hover:border-border-hi hover:text-text-dim',
                ].join(' ')}
                onClick={() => onHorizonChange(y)}
              >{y}</button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            className="toggle"
            id="mortgage"
            checked={useMortgage}
            onChange={e => onMortgageToggle(e.target.checked)}
          />
          <span>Inkludera bolån ({mortgageRatePct}%)</span>
        </div>

        {useMortgage && (
          <>
            {mortgages.length > 0 && (
              <div className="mb-3">
                <p className="form-label mb-2">Använd sparat bolån som mall</p>
                <select
                  className="form-input"
                  onChange={e => { if (e.target.value) handleSavedMortgage(e.target.value); }}
                  defaultValue=""
                >
                  <option value="">— Välj sparat bolån —</option>
                  {mortgages.map(m => {
                    const prop = properties.find(p => p.id === m.mortgage.propertyId);
                    const rate = rateForDate(m.periods, new Date().toISOString().split('T')[0]);
                    return (
                      <option key={m.mortgage.id} value={m.mortgage.id}>
                        {prop?.name ?? 'Okänt objekt'} · {m.mortgage.bankName || 'Bolån'} · {rate}%
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="mb-3">
              <p className="form-label mb-2">Ränta (%)</p>
              <input
                className="form-input max-w-[120px]"
                type="number"
                step="0.01"
                value={mortgageRatePct}
                onChange={e => onRateChange(parseFloat(e.target.value) || 0)}
              />
            </div>

            <p className="form-label mb-2">Belåningsgrad (LTV)</p>
            <div className="flex gap-2">
              {LTV_OPTIONS.map(p => (
                <button
                  key={p}
                  className={[
                    'flex-1 py-2 px-3 min-h-[40px] rounded-[6px] border text-[13px] transition-all duration-150',
                    mortgagePct === p
                      ? 'border-gold bg-gold-faint text-gold font-medium'
                      : 'border-border bg-transparent text-text-mute hover:border-border-hi hover:text-text-dim',
                  ].join(' ')}
                  onClick={() => onLtvChange(p)}
                >{p}% LTV</button>
              ))}
            </div>

            <div className="mt-3">
              <p className="form-label mb-2">Amortering per år</p>
              <div className="flex gap-2">
                {AMORT_OPTIONS.map(p => (
                  <button
                    key={p}
                    className={[
                      'flex-1 py-2 px-3 min-h-[40px] rounded-[6px] border text-[13px] transition-all duration-150',
                      amortPct === p
                        ? 'border-gold bg-gold-faint text-gold font-medium'
                        : 'border-border bg-transparent text-text-mute hover:border-border-hi hover:text-text-dim',
                    ].join(' ')}
                    onClick={() => onAmortChange(p)}
                  >{p}%</button>
                ))}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
