import { ScenarioKey } from '../../types';
import { SCENARIOS } from '../../data';
import { YearButton } from '../ui';

interface Props {
  scenario:         ScenarioKey;
  horizon:          number;
  usingMarketCount: number;
  totalProspects:   number;
  onScenario:       (key: ScenarioKey) => void;
  onHorizon:        (years: number) => void;
}

/** Scenario-picker (dot + label + meta) + horisont-knappar, designens .a-scen. */
export function ScenarioControls({
  scenario, horizon, usingMarketCount, totalProspects, onScenario, onHorizon,
}: Props) {
  return (
    <section className="card rounded-[14px] p-5 md:p-6 mb-6">
      <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
        <h2 className="font-display text-[20px] font-medium text-text">Hyresscenario</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1.5">
            {[5, 10].map(y => (
              <YearButton key={y} label={`${y} år`} active={horizon === y} onClick={() => onHorizon(y)} />
            ))}
          </div>
          <p className="text-[12px] text-text-mute">
            {usingMarketCount} av {totalProspects} objekt använder marknadsdata
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SCENARIOS.map(s => {
          const active = scenario === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onScenario(s.key)}
              className={`text-left rounded-[10px] border p-3.5 transition-all duration-150 ${
                active
                  ? 'border-green bg-green-soft'
                  : 'border-border bg-bg-card hover:border-border-hi hover:bg-bg-hover'
              }`}
            >
              <span className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className={`text-[13.5px] font-semibold ${active ? 'text-green' : 'text-text'}`}>{s.label}</span>
              </span>
              <span className="block text-[11.5px] text-text-mute">
                {s.nights} nätter · €{s.adr} ADR · {s.annualGrowthPct}%/år
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
