import { useReducer } from 'react';
import { AreaMarketData } from '../../types';
import { Btn } from '../ui';
import { useMarketRefresh } from '../../hooks/useMarketRefresh';
import { useMarketData } from '../../hooks/useMarketData';
import { MarketModal, RefreshBanner } from '.';
import { OverviewCards } from './OverviewCards';
import { AreaCompareChart } from './AreaCompareChart';
import { MarketTable } from './MarketTable';
import { MarketMobileCards } from './MarketMobileCards';
import '../../styles/pages.css';

// ── Modal-state-reducer ───────────────────────────────────────────────────────
type Modal =
  | { kind: 'closed' }
  | { kind: 'add' }
  | { kind: 'edit'; item: AreaMarketData };

type Action =
  | { type: 'open-add' }
  | { type: 'open-edit'; item: AreaMarketData }
  | { type: 'close' };

function modalReducer(_: Modal, action: Action): Modal {
  switch (action.type) {
    case 'open-add':  return { kind: 'add' };
    case 'open-edit': return { kind: 'edit', item: action.item };
    case 'close':     return { kind: 'closed' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export function Market() {
  const { markets, loading, upsert, remove, reload } = useMarketData();
  const [modal, dispatch] = useReducer(modalReducer, { kind: 'closed' });
  const { refresh, running, last } = useMarketRefresh();

  async function handleRefresh() {
    await refresh();
    await reload();
  }

  async function handleSave(m: AreaMarketData) {
    await upsert(m);
    dispatch({ type: 'close' });
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Ta bort detta område?')) return;
    await remove(id);
  }

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-eyebrow">Costa del Sol</p>
        <div className="dashboard-top-bar">
          <h1 className="page-title">Marknadsdata</h1>
          <Btn variant="primary" size="sm" onClick={() => dispatch({ type: 'open-add' })}>
            + Lägg till område
          </Btn>
        </div>
      </div>

      <RefreshBanner running={running} last={last} onRun={handleRefresh} />

      {loading ? (
        <p className="text-mute">Laddar…</p>
      ) : (
        <>
          <OverviewCards markets={markets} />
          <AreaCompareChart markets={markets} />
          <MarketTable        markets={markets} onEdit={m => dispatch({ type: 'open-edit', item: m })} onDelete={handleDelete} />
          <MarketMobileCards  markets={markets} onEdit={m => dispatch({ type: 'open-edit', item: m })} onDelete={handleDelete} />

          <p style={{ fontSize: '11px', color: 'var(--text-mute)', marginTop: '12px' }}>
            Yield-estimat baserat på 80kvm, 60% netto efter OPEX. Uppdatera siffrorna manuellt från Idealista och AirDNA.
          </p>
        </>
      )}

      {modal.kind !== 'closed' && (
        <MarketModal
          initial={modal.kind === 'edit' ? modal.item : null}
          onClose={() => dispatch({ type: 'close' })}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
