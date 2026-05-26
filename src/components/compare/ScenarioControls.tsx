import { ScenarioKey } from '../../types';
import { SCENARIOS } from '../../data';

interface Props {
  scenario:         ScenarioKey;
  horizon:          number;
  usingMarketCount: number;
  totalProspects:   number;
  onScenario:       (key: ScenarioKey) => void;
  onHorizon:        (years: number) => void;
}

/** Scenario-pills + horisont-knappar + meta-text ovanför prospect-grid. */
export function ScenarioControls({
  scenario, horizon, usingMarketCount, totalProspects, onScenario, onHorizon,
}: Props) {
  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {SCENARIOS.map(s => (
          <button
            key={s.key}
            className={`filter-pill ${scenario === s.key ? 'filter-pill--active' : ''}`}
            style={{ borderColor: scenario === s.key ? s.color : undefined, color: scenario === s.key ? s.color : undefined }}
            onClick={() => onScenario(s.key)}
          >{s.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[5, 10].map(y => (
          <button key={y} className={`year-btn ${horizon === y ? 'year-btn--active' : ''}`} onClick={() => onHorizon(y)}>
            {y} år
          </button>
        ))}
      </div>
      <p className="text-mute" style={{ fontSize: '12px' }}>
        {usingMarketCount} av {totalProspects} objekt använder lokal marknadsdata
      </p>
    </div>
  );
}
