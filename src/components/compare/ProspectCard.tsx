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
    <Card className={`card-p compare-card ${isWinner ? 'compare-card--winner' : ''}`}>
      {isWinner && <div className="compare-winner-badge">★ Bäst yield</div>}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <p className="compare-card__name">{p.name}</p>
          <p className="compare-card__meta">{p.area} · {p.bedrooms} sov · {p.sizeSqm}m²</p>
          {p.development && <p className="text-mute" style={{ fontSize: '11px' }}>{p.development}</p>}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <IconBtn variant="edit"   onClick={onEdit}   alwaysVisible />
          <IconBtn variant="delete" onClick={onDelete} alwaysVisible />
        </div>
      </div>

      {/* Price */}
      <div className="compare-price-row">
        <span className="compare-price">{fmtMoney(p.purchasePrice)}</span>
        <span className="compare-price-sqm">{fmtMoney(pricePerSqmObj)}/kvm</span>
      </div>

      {/* Vs market */}
      {vsMarket !== null && (
        <p className="compare-vs-market" style={{ color: vsMarket <= 0 ? 'var(--green)' : 'var(--red)' }}>
          {vsMarket <= 0 ? '▼' : '▲'} {Math.abs(vsMarket).toFixed(1)}% vs marknadssnitt
          {usedMarket && <span className="text-mute"> · {mkt?.area}</span>}
        </p>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />

      {/* KPIs */}
      <div className="compare-kpis">
        <div className="compare-kpi">
          <span className="compare-kpi__label">Netto/år</span>
          <span className="compare-kpi__value" style={{ color: result.netAfterTax > 0 ? 'var(--green)' : 'var(--red)' }}>
            {fmtMoney(result.netAfterTax)}
          </span>
        </div>
        <div className="compare-kpi">
          <span className="compare-kpi__label">Nettoyield</span>
          <span className="compare-kpi__value" style={{ color: 'var(--gold)' }}>
            {fmtPct(result.netYield)}
          </span>
        </div>
        <div className="compare-kpi">
          <span className="compare-kpi__label">Exit {horizon}å</span>
          <span className="compare-kpi__value">{fmtMoney(result.exitPrice)}</span>
        </div>
        <div className="compare-kpi">
          <span className="compare-kpi__label">Total förmög. {horizon}å</span>
          <span className="compare-kpi__value" style={{ color: 'var(--gold)', fontWeight: 600 }}>
            {fmtMoney(lastYear?.totalWealth ?? 0)}
          </span>
        </div>
        <div className="compare-kpi">
          <span className="compare-kpi__label">Kapitalinsats</span>
          <span className="compare-kpi__value">{fmtMoney(p.purchasePrice + costs.total)}</span>
        </div>
        <div className="compare-kpi">
          <span className="compare-kpi__label">Ann. avkastning</span>
          <span className="compare-kpi__value">{fmtPct(result.annualizedReturn)}</span>
        </div>
      </div>

      {/* Mini wealth chart */}
      <div className="compare-mini-chart">
        {projection.map((yr, idx) => {
          const h = Math.max((yr.totalWealth / (lastYear?.totalWealth || 1)) * 40, yr.totalWealth > 0 ? 3 : 0);
          return (
            <div
              key={idx}
              className="compare-mini-bar"
              style={{ height: `${h}px`, background: isWinner ? 'var(--gold)' : 'var(--border-hi)' }}
              title={`${yr.calendarYear}: ${fmtMoney(yr.totalWealth)}`}
            />
          );
        })}
      </div>

      {/* Data source note */}
      {usedMarket ? (
        <p className="compare-data-note compare-data-note--live">
          📍 Marknadsdata: {mkt?.area} ({mkt?.source})
        </p>
      ) : (
        <p className="compare-data-note">
          ⚠ Scenariots defaultvärden (ingen marknadsdata för {p.area})
        </p>
      )}

      <button
        className="compare-bank-btn"
        onClick={() => exportBankPdf(p, mkt ?? undefined, scenario, horizon)}
      >
        📄 Bankkalkyl PDF
      </button>
      {p.link && (
        <a href={p.link} target="_blank" rel="noopener noreferrer" className="compare-link">
          Öppna på Idealista →
        </a>
      )}
    </Card>
  );
}
