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
            <div className="timeline-row">
              <div className="timeline-row__meta">
                <span>År {START_YEAR + yr}</span>
                <span>Hyra: {fmtMoney(rentAccum)}</span>
                <span>Värdestegring: {fmtMoney(gain - gainTax)}</span>
              </div>
              <span className="timeline-row__value" style={{ color: scenario.color }}>
                {fmtMoney(total)}
              </span>
            </div>
            <div className="timeline-bar-wrap">
              <div className="timeline-bar" style={{ width: `${pct}%`, background: scenario.color }} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
