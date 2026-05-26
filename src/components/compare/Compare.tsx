import { useState, useMemo } from 'react';
import { ProspectProperty, ScenarioKey } from '../../types';
import { Card, Btn } from '../ui';
import { SCENARIOS } from '../../data';
import { evaluateProspect, rankByNetYield } from '../../utils/prospect.utils';
import { exportBankPdf } from '../../utils/export';
import { AIPanel } from '../ai';
import { ProspectModal } from '.';
import { ScenarioControls } from './ScenarioControls';
import { ProspectCard } from './ProspectCard';
import { SummaryTable } from './SummaryTable';
import { useProspects } from '../../hooks/useProspects';
import { useMarketData } from '../../hooks/useMarketData';
import '../../styles/pages.css';

export function Compare() {
  const { prospects, loading: prospectsLoading, upsert: upsertProspect, remove: removeProspect } = useProspects();
  const { markets,   loading: marketsLoading }   = useMarketData();
  const [showModal, setShowModal] = useState(false);
  const [editItem,  setEditItem]  = useState<ProspectProperty | null>(null);
  const [scenario,  setScenario]  = useState<ScenarioKey>('base');
  const [horizon,   setHorizon]   = useState(10);

  const loading = prospectsLoading || marketsLoading;

  async function handleSave(p: ProspectProperty) {
    await upsertProspect(p);
    setShowModal(false);
    setEditItem(null);
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
        <div className="dashboard-top-bar">
          <h1 className="page-title">Objektjämförelse</h1>
          <Btn variant="primary" size="sm" onClick={() => { setEditItem(null); setShowModal(true); }}>
            + Lägg till objekt
          </Btn>
        </div>
      </div>

      <ScenarioControls
        scenario={scenario}
        horizon={horizon}
        usingMarketCount={calcResults.filter(r => r.usedMarket).length}
        totalProspects={prospects.length}
        onScenario={setScenario}
        onHorizon={setHorizon}
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
          <div className="compare-grid" style={{ gridTemplateColumns: `repeat(${Math.min(prospects.length, 3)}, 1fr)` }}>
            {ranked.map(evaluation => (
              <ProspectCard
                key={evaluation.p.id}
                prospect={evaluation.p}
                evaluation={evaluation}
                scenario={scenario}
                horizon={horizon}
                isWinner={evaluation.p.id === winner && prospects.length > 1}
                onEdit={() => { setEditItem(evaluation.p); setShowModal(true); }}
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

      {showModal && (
        <ProspectModal
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
