import { useState } from 'react';
import { AreaMarketData } from '../../types';
import { Card, SectionHeader, Tabs } from '../ui';
import { AreaCompareChart } from './AreaCompareChart';
import { YieldRanking } from './YieldRanking';
import { PriceRentScatter } from './PriceRentScatter';

type View = 'bars' | 'yield' | 'scatter';

const VIEWS = [
  { id: 'bars',    label: '📊 Pris & ADR'      },
  { id: 'yield',   label: '🏆 Yield-rang'     },
  { id: 'scatter', label: '🎯 Pris vs hyra'   },
];

interface Props { markets: AreaMarketData[]; }

/**
 * Tabbad jämförelse-vy för marknadsdata.
 * - bars:    befintlig sida-vid-sida bar-chart (€/kvm + ADR)
 * - yield:   sorterad bar-chart efter beräknad nettoyield
 * - scatter: 2D-scatter pris vs hyra med median-kvadranter
 */
export function MarketCharts({ markets }: Props) {
  const [view, setView] = useState<View>('bars');

  const titles: Record<View, string> = {
    bars:    'Prisjämförelse per område',
    yield:   'Yield-rangordning',
    scatter: 'Pris vs hyra — hitta värde-områdena',
  };

  return (
    <Card className="card-p" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <SectionHeader title={titles[view]} />
        <Tabs tabs={VIEWS} active={view} onChange={v => setView(v as View)} />
      </div>

      {view === 'bars'    && <AreaCompareChart markets={markets} />}
      {view === 'yield'   && <YieldRanking     markets={markets} />}
      {view === 'scatter' && <PriceRentScatter markets={markets} />}
    </Card>
  );
}
