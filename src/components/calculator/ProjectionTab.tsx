import { Card, SectionHeader } from '../ui';
import { fmtMoney, ProjectionYear } from '../../utils/calc.utils';

export interface ProjectionTabProps {
  projection:    ProjectionYear[];
  scenarioColor: string;
  horizonYears:  number;
  amortPct:      number;
}

export function ProjectionTab({ projection, scenarioColor, horizonYears, amortPct }: ProjectionTabProps) {
  const maxWealth = Math.max(...projection.map(p => p.totalWealth), 1);
  const maxRent   = Math.max(...projection.map(p => p.netAfterTax), 1);
  const last      = projection[projection.length - 1];

  return (
    <div className="flex flex-col gap-4">
      {/* Wealth chart */}
      <Card className="card-p">
        <SectionHeader title="Total förmögenhetstillväxt" />
        <div className="proj-chart">
          {projection.map((p, i) => {
            const wealthH = Math.max((p.totalWealth / maxWealth) * 120, p.totalWealth > 0 ? 4 : 0);
            const rentH   = Math.max((p.netAfterTax / maxRent) * 120, 4);
            return (
              <div key={i} className="proj-bar-group">
                <div className="proj-bar-pair">
                  <div
                    className="proj-bar proj-bar--wealth"
                    style={{ height: `${wealthH}px`, background: scenarioColor }}
                    title={`År ${p.calendarYear}: Total förmögenhet ${fmtMoney(p.totalWealth)}`}
                  />
                  <div
                    className="proj-bar proj-bar--rent"
                    style={{ height: `${rentH}px` }}
                    title={`År ${p.calendarYear}: Driftnetto ${fmtMoney(p.netAfterTax)}`}
                  />
                </div>
                <span className="proj-bar-label">{p.calendarYear}</span>
              </div>
            );
          })}
        </div>
        <div className="proj-legend">
          <span className="proj-legend-item">
            <span className="proj-legend-dot" style={{ background: scenarioColor }} /> Total förmögenhet
          </span>
          <span className="proj-legend-item">
            <span className="proj-legend-dot proj-legend-dot--rent" /> Driftnetto per år
          </span>
        </div>
      </Card>

      {/* Year-by-year table */}
      <Card>
        <div className="calc-projection-scroll">
          <div className="table-header proj-cols">
            <span>År</span>
            <span>Fastighetsvärde</span>
            <span>Lånesaldo</span>
            <span>Eget kapital</span>
            <span>Driftnetto</span>
            <span>Ackum. kassafl.</span>
            <span>Total förmögenhet</span>
          </div>
          {projection.map((p, i) => (
            <div key={i} className={`table-row proj-cols ${i % 2 === 1 ? 'proj-row--alt' : ''}`}>
              <span className="text-mute">{p.calendarYear}</span>
              <span data-label="Fastighetsvärde" style={{ color: 'var(--gold)' }}>{fmtMoney(p.propertyValue)}</span>
              <span data-label="Lånesaldo" className="text-mute">{p.loanBalance > 0 ? `−${fmtMoney(p.loanBalance)}` : '—'}</span>
              <span data-label="Eget kapital">{fmtMoney(p.equity)}</span>
              <span data-label="Driftnetto" style={{ color: p.netAfterTax >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {p.netAfterTax >= 0 ? '+' : '−'}{fmtMoney(Math.abs(p.netAfterTax))}
              </span>
              <span data-label="Ackum. kassafl." style={{ color: p.cumulativeCashflow >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {p.cumulativeCashflow >= 0 ? '+' : '−'}{fmtMoney(Math.abs(p.cumulativeCashflow))}
              </span>
              <span data-label="Total förmögenhet" style={{
                color: p.totalWealth >= 0 ? scenarioColor : 'var(--red)',
                fontWeight: 600,
              }}>
                {p.totalWealth >= 0 ? '+' : '−'}{fmtMoney(Math.abs(p.totalWealth))}
              </span>
            </div>
          ))}
        </div>
        <div className="table-footer justify-end gap-6">
          <span className="text-mute">
            Equity år {horizonYears}: <strong style={{ color: 'var(--gold)' }}>{fmtMoney(last?.equity ?? 0)}</strong>
          </span>
          <span className="text-mute">
            Total förmögenhet: <strong style={{ color: scenarioColor }}>{fmtMoney(last?.totalWealth ?? 0)}</strong>
          </span>
        </div>
      </Card>

      <p className="calc-disclaimer">
        Projektion inkluderar inflation (2%/år på opex), realt ADR-tillväxt (max 5%/år), amortering {amortPct}%/år
        och IRNR-skatt 19%. Fastighetsvärde växer enligt valt scenario. Total förmögenhet = eget kapital +
        ackumulerat driftnetto − köpkostnader.
      </p>
    </div>
  );
}
