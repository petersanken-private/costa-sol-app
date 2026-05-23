import { Card, Stat } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';

export interface PropertyQuickStatsProps {
  totalRentRevenue: number;
  totalNights:      number;
  totalExpenses:    number;
  totalKapital:     number;
}

export function PropertyQuickStats({
  totalRentRevenue, totalNights, totalExpenses, totalKapital,
}: PropertyQuickStatsProps) {
  const items = [
    { label: 'Hyresintäkt (log)',    value: fmtMoney(totalRentRevenue),                  sub: `${totalNights} nätter totalt` },
    { label: 'Kostnader (log)',      value: fmtMoney(totalExpenses),                     sub: 'Bokförda utgifter'            },
    { label: 'Netto f. skatt (log)', value: fmtMoney(totalRentRevenue - totalExpenses),  sub: 'Faktiskt utfall'              },
    { label: 'Total kapitalinsats',  value: fmtMoney(totalKapital),                      sub: '≈ +12% omkostnader'           },
  ];

  return (
    <div className="grid-4" style={{ marginBottom: '24px' }}>
      {items.map((s, i) => (
        <Card key={i} className="card-p-md">
          <Stat label={s.label} value={s.value} sub={s.sub} />
        </Card>
      ))}
    </div>
  );
}
