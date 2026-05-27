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
      <div className="chart-header">
        <SectionHeader title={`Hyresintäkt per månad · ${year}`} />
        {totalRent === 0 && (
          <p className="chart-empty-hint">Logga hyresintäkter på fastighetssidan för att se grafen.</p>
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
            <span className={`chart-month ${d.hasData ? '' : 'chart-month--empty'}`}>{d.label}</span>
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
        <div className="platform-breakdown">
          {platformData.map(({ platform, revenue, color }) => (
            <div key={platform} className="platform-bar-row">
              <span className="platform-dot" style={{ background: color }} />
              <span className="platform-name">{platform}</span>
              <div className="platform-bar-track">
                <div
                  className="platform-bar-fill"
                  style={{ width: `${(revenue / totalRent) * 100}%`, background: color }}
                />
              </div>
              <span className="platform-amount">{fmtMoney(revenue)}</span>
              <span className="platform-pct">{((revenue / totalRent) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
