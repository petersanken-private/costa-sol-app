import { Card } from '../ui';
import {
  fmtMoney, buyingCostRowStyle, BuyingCostRowMeta,
} from '../../utils/calc.utils';

export interface BuyingCostRow extends BuyingCostRowMeta {
  label: string;
  value: number;
  note?: string;
}

export interface CostsTabProps {
  rows: BuyingCostRow[];
}

export function CostsTab({ rows }: CostsTabProps) {
  return (
    <Card>
      {rows.map((row, i) => (
        <div
          key={i}
          className={[
            'flex justify-between items-center border-t border-border first:border-t-0',
            row.highlight
              ? 'py-3.5 max-md:py-3 px-5 max-md:px-3.5 !border-t-border-hi bg-bg-subtle text-[14px] font-semibold'
              : 'py-2.5 max-md:py-2.5 px-5 max-md:px-3.5 text-[13px]',
            row.bold && !row.highlight ? '!border-t-border-hi' : '',
          ].join(' ')}
        >
          <div>
            <span style={buyingCostRowStyle(row)}>
              {row.label}
            </span>
            {row.note && (
              <span className="text-mute" style={{ fontSize: '11px', marginLeft: '8px' }}>· {row.note}</span>
            )}
          </div>
          <span style={{
            fontFamily: row.highlight ? 'var(--font-display)' : undefined,
            fontSize:   row.highlight ? '20px' : '14px',
            color:      row.highlight ? 'var(--gold)' : row.bold ? 'var(--text)' : 'var(--text-mute)',
            fontWeight: row.bold ? 600 : 400,
          }}>
            {fmtMoney(row.value)}
          </span>
        </div>
      ))}
    </Card>
  );
}
