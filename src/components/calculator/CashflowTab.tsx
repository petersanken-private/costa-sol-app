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
          className={`cashflow-row ${row.isFinal ? 'cashflow-row--final' : ''} ${row.isNet ? 'cashflow-row--net' : ''}`}
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
