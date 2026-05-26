import { Card } from '../ui';
import { fmtMoney, fmtPct } from '../../utils/calc.utils';
import { evaluateProspect } from '../../utils/prospect.utils';

type Evaluation = ReturnType<typeof evaluateProspect>;

interface Props {
  ranked:  Evaluation[];
  horizon: number;
}

/** Sammanfattningstabell under prospect-grid. Bara med när > 1 prospekt. */
export function SummaryTable({ ranked, horizon }: Props) {
  const cols = '1fr 100px 100px 100px 100px 110px';
  return (
    <Card style={{ marginTop: '20px' }}>
      <div className="table-header" style={{ gridTemplateColumns: cols }}>
        <span>Objekt</span>
        <span>Pris</span>
        <span>Nettoyield</span>
        <span>Netto/år</span>
        <span>Ann. avk.</span>
        <span>Total {horizon}å</span>
      </div>
      {ranked.map(({ p, result, projection }, i) => (
        <div key={p.id} className="table-row" style={{ gridTemplateColumns: cols }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {i === 0 && ranked.length > 1 && <span style={{ color: 'var(--gold)', fontSize: '12px' }}>★</span>}
            <span style={{ fontWeight: 500 }}>{p.name}</span>
            <span className="text-mute" style={{ fontSize: '12px' }}>{p.area}</span>
          </span>
          <span>{fmtMoney(p.purchasePrice)}</span>
          <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{fmtPct(result.netYield)}</span>
          <span style={{ color: result.netAfterTax > 0 ? 'var(--green)' : 'var(--red)' }}>
            {fmtMoney(result.netAfterTax)}
          </span>
          <span>{fmtPct(result.annualizedReturn)}</span>
          <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
            {fmtMoney(projection[projection.length - 1]?.totalWealth ?? 0)}
          </span>
        </div>
      ))}
    </Card>
  );
}
