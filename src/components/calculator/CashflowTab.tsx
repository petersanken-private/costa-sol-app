import { Card } from '../ui';
import {
  fmtMoney, cashflowLabelColor, cashflowValueColor, CashflowRowMeta,
} from '../../utils/calc.utils';

export interface CashflowRow extends CashflowRowMeta {
  label: string;
}

export interface CashflowTabProps {
  rows:           CashflowRow[];
  scenarioColor:  string;
}

export function CashflowTab({ rows, scenarioColor }: CashflowTabProps) {
  return (
    <Card>
      {rows.map((row, i) => (
        <div
          key={i}
          className={[
            'flex justify-between items-center border-t border-border first:border-t-0',
            row.isFinal
              ? 'py-3.5 max-md:py-3 px-5 max-md:px-3.5 !border-t-border-hi bg-bg-subtle text-[14px] font-semibold'
              : 'py-2.5 max-md:py-2.5 px-5 max-md:px-3.5 text-[13px]',
            row.isNet && !row.isFinal ? '!border-t-border-hi' : '',
          ].join(' ')}
        >
          <span style={{ color: cashflowLabelColor(row) }}>
            {row.label}
          </span>
          <span style={{ color: cashflowValueColor(row, scenarioColor) }}>
            {row.value >= 0 ? '+' : '−'}{fmtMoney(Math.abs(row.value))}
          </span>
        </div>
      ))}
    </Card>
  );
}
