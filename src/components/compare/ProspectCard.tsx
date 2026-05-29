import { ProspectProperty, ScenarioKey } from '../../types';
import { Card, IconBtn } from '../ui';
import { fmtMoney, fmtPct } from '../../utils/calc.utils';
import { evaluateProspect } from '../../utils/prospect.utils';
import { exportBankPdf } from '../../utils/export';

type Evaluation = ReturnType<typeof evaluateProspect>;

interface Props {
  prospect:   ProspectProperty;
  evaluation: Evaluation;
  scenario:   ScenarioKey;
  horizon:    number;
  isWinner:   boolean;
  onEdit:     () => void;
  onDelete:   () => void;
}

/** En "stor" prospect-jämförelsekort med KPIer + mini wealth-chart + actions. */
export function ProspectCard({
  prospect: p, evaluation, scenario, horizon, isWinner, onEdit, onDelete,
}: Props) {
  const { result, projection, costs, pricePerSqmObj, vsMarket, mkt, usedMarket } = evaluation;
  const lastYear = projection[projection.length - 1];

  return (
    <Card
      className={`card-p relative ${isWinner ? '!border-gold shadow-[0_0_0_1px_var(--gold),var(--shadow-md)]' : ''}`}
    >
      {isWinner && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gold text-white text-[10px] font-semibold tracking-[0.5px] py-[3px] px-2.5 rounded-[20px] whitespace-nowrap">
          ★ Bäst yield
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="font-display text-[18px] font-normal text-text">{p.name}</p>
          <p className="text-[12px] text-text-mute mt-0.5">{p.area} · {p.bedrooms} sov · {p.sizeSqm}m²</p>
          {p.development && <p className="text-mute text-[11px]">{p.development}</p>}
        </div>
        <div className="flex gap-1.5">
          <IconBtn variant="edit"   onClick={onEdit}   alwaysVisible />
          <IconBtn variant="delete" onClick={onDelete} alwaysVisible />
        </div>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-display text-[22px] md:text-[24px] font-normal text-text">{fmtMoney(p.purchasePrice)}</span>
        <span className="text-[12px] text-text-mute">{fmtMoney(pricePerSqmObj)}/kvm</span>
      </div>

      {/* Vs market */}
      {vsMarket !== null && (
        <p
          className="text-[12px] font-medium mb-1"
          style={{ color: vsMarket <= 0 ? 'var(--green)' : 'var(--red)' }}
        >
          {vsMarket <= 0 ? '▼' : '▲'} {Math.abs(vsMarket).toFixed(1)}% vs marknadssnitt
          {usedMarket && <span className="text-mute"> · {mkt?.area}</span>}
        </p>
      )}

      <hr className="border-0 border-t border-border my-4" />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <Kpi label="Netto/år"             value={fmtMoney(result.netAfterTax)} color={result.netAfterTax > 0 ? 'var(--green)' : 'var(--red)'} />
        <Kpi label="Nettoyield"           value={fmtPct(result.netYield)} color="var(--gold)" />
        <Kpi label={`Exit ${horizon}å`}    value={fmtMoney(result.exitPrice)} />
        <Kpi label={`Total förmög. ${horizon}å`} value={fmtMoney(lastYear?.totalWealth ?? 0)} color="var(--gold)" bold />
        <Kpi label="Kapitalinsats"        value={fmtMoney(p.purchasePrice + costs.total)} />
        <Kpi label="Ann. avkastning"      value={fmtPct(result.annualizedReturn)} />
      </div>

      {/* Mini wealth chart */}
      <div className="flex items-end gap-[3px] h-11 mb-3 py-1 border-b border-border">
        {projection.map((yr, idx) => {
          const h = Math.max((yr.totalWealth / (lastYear?.totalWealth || 1)) * 40, yr.totalWealth > 0 ? 3 : 0);
          return (
            <div
              key={idx}
              className="flex-1 rounded-t-[2px] min-h-[3px] opacity-70 transition-opacity duration-150 hover:opacity-100"
              style={{ height: `${h}px`, background: isWinner ? 'var(--gold)' : 'var(--border-hi)' }}
              title={`${yr.calendarYear}: ${fmtMoney(yr.totalWealth)}`}
            />
          );
        })}
      </div>

      {/* Data source note */}
      {usedMarket ? (
        <p className="text-[11px] text-green mb-2">
          📍 Marknadsdata: {mkt?.area} ({mkt?.source})
        </p>
      ) : (
        <p className="text-[11px] text-text-mute mb-2">
          ⚠ Scenariots defaultvärden (ingen marknadsdata för {p.area})
        </p>
      )}

      <button
        className="block w-full mt-2 py-2 px-2 bg-bg-subtle border border-border rounded-[6px] text-[12px] text-text-dim text-center transition-all duration-150 hover:bg-gold-faint hover:border-gold hover:text-gold max-md:min-h-[44px]"
        onClick={() => exportBankPdf(p, mkt ?? undefined, scenario, horizon)}
      >
        📄 Bankkalkyl PDF
      </button>
      {p.link && (
        <a
          href={p.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[12px] text-gold text-center mt-1.5 no-underline transition-colors duration-150 hover:text-[#9a7009]"
        >
          Öppna på Idealista →
        </a>
      )}
    </Card>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function Kpi({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div className="bg-bg-subtle rounded-[6px] py-2.5 px-3">
      <span className="block text-[10px] tracking-[1px] uppercase text-text-mute mb-[3px]">{label}</span>
      <span
        className="block font-display text-[16px] md:text-[18px] font-normal text-text"
        style={{ color, fontWeight: bold ? 600 : undefined }}
      >
        {value}
      </span>
    </div>
  );
}
