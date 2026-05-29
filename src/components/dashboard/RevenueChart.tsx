import { SectionHeader } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';
import type { ChartBar, PlatformShare, DashboardKPIs } from '../../hooks/useDashboard';

interface RevenueChartProps {
  year:         number;
  chartData:    ChartBar[];
  platformData: PlatformShare[];
  kpis:         Pick<DashboardKPIs, 'totalRent' | 'totalNights' | 'activeMonths' | 'avgPerMonth' | 'avgAdr' | 'grossYieldEst' | 'maxRevenue'>;
}

export function RevenueChart({ year, chartData, platformData, kpis }: RevenueChartProps) {
  const { totalRent, activeMonths, avgPerMonth, avgAdr, grossYieldEst, maxRevenue } = kpis;

  return (
    <>
      <div className="mb-1">
        <SectionHeader title={`Hyresintäkt per månad · ${year}`} />
        {totalRent === 0 && (
          <p className="text-[12px] text-text-mute -mt-2 mb-3">Logga hyresintäkter på fastighetssidan för att se grafen.</p>
        )}
      </div>

      <div className="chart-bars">
        {chartData.map((d, i) => (
          <div key={i} className="chart-bar-col">
            <span className="chart-bar-label">{d.revenue > 0 ? fmtMoney(d.revenue) : ''}</span>
            <div
              className={`chart-bar ${!d.hasData ? 'chart-bar--empty' : ''}`}
              style={{ height: `${Math.max((d.revenue / maxRevenue) * 110, d.hasData ? 4 : 0)}px` }}
              title={d.hasData ? `${d.label}: ${fmtMoney(d.revenue)} · ${d.nights} nätter` : undefined}
            />
            <span className={`chart-month ${d.hasData ? '' : 'opacity-[0.35]'}`}>{d.label}</span>
          </div>
        ))}
      </div>

      <div className="chart-footer">
        <div className="chart-footer-stat">
          <label>Totalt {year}</label>
          <p className="text-gold">{fmtMoney(totalRent)}</p>
        </div>
        <div className="chart-footer-stat">
          <label>Snitt / aktiv mån</label>
          <p>{activeMonths > 0 ? fmtMoney(avgPerMonth) : '—'}</p>
        </div>
        <div className="chart-footer-stat">
          <label>Snitt ADR</label>
          <p>{avgAdr > 0 ? `${fmtMoney(avgAdr)}/natt` : '—'}</p>
        </div>
        <div className="chart-footer-stat">
          <label>Yield (est.)</label>
          <p>{grossYieldEst}</p>
        </div>
      </div>

      {platformData.length > 0 && (
        <div className="mt-5 pt-4 border-t border-border flex flex-col gap-2">
          {platformData.map(({ platform, revenue, color }) => (
            <div key={platform} className="grid grid-cols-[10px_72px_1fr_80px_36px] items-center gap-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[12px] text-text-dim capitalize">{platform}</span>
              <div className="h-1 bg-border rounded-[2px] overflow-hidden">
                <div
                  className="h-full rounded-[2px] opacity-75 transition-[width] duration-[400ms] ease-in-out"
                  style={{ width: `${(revenue / totalRent) * 100}%`, background: color }}
                />
              </div>
              <span className="text-[12px] text-text-dim text-right">{fmtMoney(revenue)}</span>
              <span className="text-[11px] text-text-mute text-right">{((revenue / totalRent) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
