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

      <div className="flex items-end gap-2.5 max-md:gap-1 h-[140px] max-md:h-[100px] mb-2">
        {chartData.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center h-full justify-end gap-1.5">
            <span className="text-[10px] max-md:text-[8px] text-gold min-h-3.5">{d.revenue > 0 ? fmtMoney(d.revenue) : ''}</span>
            <div
              className={`w-full rounded-t-[4px] rounded-b-[2px] transition-[height] duration-[400ms] ease-in-out min-h-[3px] ${d.hasData ? 'bg-gradient-to-b from-gold to-[rgba(184,134,11,0.4)]' : 'bg-border'}`}
              style={{ height: `${Math.max((d.revenue / maxRevenue) * 110, d.hasData ? 4 : 0)}px` }}
              title={d.hasData ? `${d.label}: ${fmtMoney(d.revenue)} · ${d.nights} nätter` : undefined}
            />
            <span className={`text-[11px] max-md:text-[9px] text-text-mute ${d.hasData ? '' : 'opacity-[0.35]'}`}>{d.label}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-3.5 flex gap-6">
        <FooterStat label={`Totalt ${year}`}    value={fmtMoney(totalRent)} accent />
        <FooterStat label="Snitt / aktiv mån"   value={activeMonths > 0 ? fmtMoney(avgPerMonth) : '—'} />
        <FooterStat label="Snitt ADR"            value={avgAdr > 0 ? `${fmtMoney(avgAdr)}/natt` : '—'} />
        <FooterStat label="Yield (est.)"         value={grossYieldEst} />
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

// ── Helpers ────────────────────────────────────────────────────────────────

function FooterStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <label className="text-[11px] text-text-mute block">{label}</label>
      <p className={`font-display text-[20px] max-md:text-[16px] mt-0.5 ${accent ? 'text-gold' : ''}`}>{value}</p>
    </div>
  );
}
