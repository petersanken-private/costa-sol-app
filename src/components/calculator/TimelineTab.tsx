import { Card } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';
import { ScenarioConfig, CalcResult } from '../../types';
import { TAX } from '../../constants/tax';

const START_YEAR = new Date().getFullYear() + 1;

export interface TimelineTabProps {
  result:        CalcResult;
  purchasePrice: number;
  scenario:      ScenarioConfig;
  horizonYears:  number;
}

export function TimelineTab({ result, purchasePrice, scenario, horizonYears }: TimelineTabProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: horizonYears }, (_, i) => i + 1).map(yr => {
        const rentAccum = result.netAfterTax * yr;
        const projPrice = purchasePrice * Math.pow(1 + scenario.annualGrowthPct / 100, yr);
        const gain      = projPrice - purchasePrice;
        const gainTax   = gain * TAX.CAPITAL_GAINS_PCT;
        const total     = rentAccum + gain - gainTax;
        const pct       = Math.max(0, Math.min(100, (total / (result.equity * 1.5)) * 100));

        return (
          <Card key={yr} className="card-p-sm">
            <div className="flex justify-between items-center gap-3 max-md:flex-col max-md:items-start max-md:gap-1">
              <div className="flex flex-wrap items-center gap-2 max-md:gap-2 text-[12px] text-text-mute">
                <span>År {START_YEAR + yr}</span>
                <span>Hyra: {fmtMoney(rentAccum)}</span>
                <span>Värdestegring: {fmtMoney(gain - gainTax)}</span>
              </div>
              <span className="font-display text-[16px]" style={{ color: scenario.color }}>
                {fmtMoney(total)}
              </span>
            </div>
            <div className="h-1.5 bg-border rounded-[2px] overflow-hidden mt-2">
              <div className="h-full rounded-[2px] transition-[width] duration-[400ms] ease-in-out" style={{ width: `${pct}%`, background: scenario.color }} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
