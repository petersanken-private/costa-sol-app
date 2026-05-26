import { useState } from 'react';
import { AreaMarketData } from '../../types';
import { Btn } from '../ui';
import { useMarketRefresh } from '../../hooks/useMarketRefresh';
import { useMarketData } from '../../hooks/useMarketData';
import { MarketModal, RefreshBanner } from '.';
import { OverviewCards } from './OverviewCards';
import { MarketCharts } from './MarketCharts';
import { MarketTable } from './MarketTable';
import { MarketMobileCards } from './MarketMobileCards';
import '../../styles/pages.css';

export function Market() {
  const { markets, loading, upsert, remove, reload } = useMarketData();
  const [showModal, setShowModal] = useState(false);
  const [editItem,  setEditItem]  = useState<AreaMarketData | null>(null);
  const { refresh, running, last } = useMarketRefresh();

  async function handleRefresh() {
    await refresh();
    await reload();
  }

  async function handleSave(m: AreaMarketData) {
    await upsert(m);
    setShowModal(false);
    setEditItem(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Ta bort detta område?')) return;
    await remove(id);
  }

  function handleEdit(m: AreaMarketData) {
    setEditItem(m);
    setShowModal(true);
  }

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-eyebrow">Costa del Sol</p>
        <div className="dashboard-top-bar">
          <h1 className="page-title">Marknadsdata</h1>
          <Btn variant="primary" size="sm" onClick={() => { setEditItem(null); setShowModal(true); }}>
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
          <MarketCharts  markets={markets} />
          <MarketTable        markets={markets} onEdit={handleEdit} onDelete={handleDelete} />
          <MarketMobileCards  markets={markets} onEdit={handleEdit} onDelete={handleDelete} />

          <p style={{ fontSize: '11px', color: 'var(--text-mute)', marginTop: '12px' }}>
            Yield-estimat baserat på 80kvm, 60% netto efter OPEX. Uppdatera siffrorna manuellt från Idealista och AirDNA.
          </p>
        </>
      )}

      {showModal && (
        <MarketModal
          initial={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
