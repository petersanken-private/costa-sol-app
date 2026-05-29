import { useMemo, useReducer } from 'react';
import { ProspectProperty, ScenarioKey } from '../../types';
import { Card, Btn } from '../ui';
import { SCENARIOS } from '../../data';
import { evaluateProspect, rankByNetYield } from '../../utils/prospect.utils';
import { AIPanel } from '../ai';
import { ProspectModal } from '.';
import { ScenarioControls } from './ScenarioControls';
import { ProspectCard } from './ProspectCard';
import { SummaryTable } from './SummaryTable';
import { useProspects } from '../../hooks/useProspects';
import { useMarketData } from '../../hooks/useMarketData';

// ── Reducer ───────────────────────────────────────────────────────────────────
type Modal =
  | { kind: 'closed' }
  | { kind: 'add' }
  | { kind: 'edit'; item: ProspectProperty };

interface State {
  modal:    Modal;
  scenario: ScenarioKey;
  horizon:  number;
}

type Action =
  | { type: 'open-add' }
  | { type: 'open-edit'; item: ProspectProperty }
  | { type: 'close' }
  | { type: 'set-scenario'; scenario: ScenarioKey }
  | { type: 'set-horizon'; horizon: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'open-add':     return { ...state, modal: { kind: 'add' } };
    case 'open-edit':    return { ...state, modal: { kind: 'edit', item: action.item } };
    case 'close':        return { ...state, modal: { kind: 'closed' } };
    case 'set-scenario': return { ...state, scenario: action.scenario };
    case 'set-horizon':  return { ...state, horizon: action.horizon };
  }
}

const INITIAL: State = { modal: { kind: 'closed' }, scenario: 'base', horizon: 10 };

// ─────────────────────────────────────────────────────────────────────────────
export function Compare() {
  const { prospects, loading: prospectsLoading, upsert: upsertProspect, remove: removeProspect } = useProspects();
  const { markets,   loading: marketsLoading }   = useMarketData();
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const { modal, scenario, horizon } = state;

  const loading = prospectsLoading || marketsLoading;

  async function handleSave(p: ProspectProperty) {
    await upsertProspect(p);
    dispatch({ type: 'close' });
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Ta bort detta prospekt?')) return;
    await removeProspect(id);
  }

  const sc = SCENARIOS.find(s => s.key === scenario)!;

  // Bygg utvärdering för varje prospekt (med marknadsdata om tillgänglig).
  const calcResults = useMemo(
    () => prospects.map(p => evaluateProspect(p, markets, sc, horizon)),
    [prospects, markets, sc, horizon],
  );

  const ranked = rankByNetYield(calcResults);
  const winner = ranked[0]?.p.id;

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-eyebrow">Investeringsanalys</p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="page-title">Objektjämförelse</h1>
          <Btn variant="primary" size="sm" onClick={() => dispatch({ type: 'open-add' })}>
            + Lägg till objekt
          </Btn>
        </div>
      </div>

      <ScenarioControls
        scenario={scenario}
        horizon={horizon}
        usingMarketCount={calcResults.filter(r => r.usedMarket).length}
        totalProspects={prospects.length}
        onScenario={s => dispatch({ type: 'set-scenario', scenario: s })}
        onHorizon={h  => dispatch({ type: 'set-horizon',  horizon: h  })}
      />

      {loading ? (
        <p className="text-mute">Laddar…</p>
      ) : prospects.length === 0 ? (
        <Card className="card-p">
          <div className="empty-state">
            <p className="empty-state__icon">🏠</p>
            <p className="empty-state__title">Inga prospekt ännu</p>
            <p className="empty-state__sub">Lägg till objekt du hittat på Idealista för att jämföra dem.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Side-by-side comparison cards */}
          <div className="grid gap-4 mb-2 max-md:!grid-cols-1" style={{ gridTemplateColumns: `repeat(${Math.min(prospects.length, 3)}, 1fr)` }}>
            {ranked.map(evaluation => (
              <ProspectCard
                key={evaluation.p.id}
                prospect={evaluation.p}
                evaluation={evaluation}
                scenario={scenario}
                horizon={horizon}
                isWinner={evaluation.p.id === winner && prospects.length > 1}
                onEdit={() => dispatch({ type: 'open-edit', item: evaluation.p })}
                onDelete={() => handleDelete(evaluation.p.id)}
              />
            ))}
          </div>

          {prospects.length > 1 && <SummaryTable ranked={ranked} horizon={horizon} />}

          {prospects.length > 0 && (
            <AIPanel
              scope="portfolio"
              title="🤖 AI-rådgivning för prospekt"
              presets={[
                { key: 'rank-prospects', icon: '🏆', label: 'Rangordna prospekt' },
              ]}
            />
          )}
        </>
      )}

      {modal.kind !== 'closed' && (
        <ProspectModal
          initial={modal.kind === 'edit' ? modal.item : null}
          onClose={() => dispatch({ type: 'close' })}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
