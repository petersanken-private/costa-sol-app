import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { Property, PropertyStatus } from '../types';
import { Card, Btn, EmptyState } from '../components/ui';
import { ExportMenu } from '../components/ExportMenu';
import { exportPortfolioCsv, exportPortfolioPdf } from '../utils/export';
import { PropertyRow, PropertyCard, PropertyModal } from '../components/portfolio';

const STATUS_FILTERS: { key: PropertyStatus | 'all'; label: string }[] = [
  { key: 'all',            label: 'Alla'           },
  { key: 'owned',          label: 'Ägs'            },
  { key: 'off-plan',       label: 'Off-plan'       },
  { key: 'under-contract', label: 'Under kontrakt' },
  { key: 'watchlist',      label: 'Bevakas'        },
];

export function Portfolio() {
  const { state, navigate, dispatch } = useApp();
  const [filter,       setFilter]       = useState<PropertyStatus | 'all'>('all');
  const [showAdd,      setShowAdd]      = useState(false);
  const [editProperty, setEditProperty] = useState<Property | null>(null);

  const filtered = filter === 'all'
    ? state.properties
    : state.properties.filter(p => p.status === filter);

  function handleDelete(property: Property) {
    const hasData =
      state.rentals.some(r => r.propertyId === property.id) ||
      state.expenses.some(e => e.propertyId === property.id);

    const msg = hasData
      ? `Ta bort "${property.name}"? All hyresdata och alla kostnader kopplade till fastigheten raderas också. Detta går inte att ångra.`
      : `Ta bort "${property.name}"? Detta går inte att ångra.`;

    if (window.confirm(msg)) {
      dispatch({ type: 'DELETE_PROPERTY', id: property.id });
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-eyebrow">Fastighetsregister</p>
        <div className="portfolio-top-bar">
          <h1 className="page-title">Portfölj</h1>
          <div className="page-actions">
            <ExportMenu
              label="Exportera portfölj"
              options={[
                { label: 'CSV (Excel)',    icon: '📊', onClick: () => exportPortfolioCsv(state.properties) },
                { label: 'PDF (utskrift)', icon: '📄', onClick: () => exportPortfolioPdf(state.properties) },
              ]}
            />
            <Btn variant="primary" onClick={() => setShowAdd(true)}>+ Ny fastighet</Btn>
          </div>
        </div>
      </div>

      <div className="filter-pills">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-pill ${filter === f.key ? 'filter-pill--active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="◈" title="Inga fastigheter" subtitle={`Inga objekt med status "${filter}".`} />
      ) : (
        <>
          {/* Desktop */}
          <Card className="portfolio-desktop-table">
            <div className="table-header portfolio-table-cols">
              <span>Fastighet</span>
              <span>Typ</span>
              <span>Status</span>
              <span>Köpeskilling</span>
              <span>Nuv. värde</span>
              <span>VFT</span>
              <span></span>
            </div>
            {filtered.map(p => (
              <PropertyRow
                key={p.id}
                property={p}
                onClick={() => navigate('property', p.id)}
                onEdit={e => { e.stopPropagation(); setEditProperty(p); }}
                onDelete={e => { e.stopPropagation(); handleDelete(p); }}
              />
            ))}
          </Card>

          {/* Mobile */}
          <div className="portfolio-mobile-cards">
            {filtered.map(p => (
              <PropertyCard
                key={p.id}
                property={p}
                onClick={() => navigate('property', p.id)}
                onEdit={() => setEditProperty(p)}
                onDelete={() => handleDelete(p)}
              />
            ))}
          </div>
        </>
      )}

      {showAdd && (
        <PropertyModal
          title="Ny fastighet"
          onClose={() => setShowAdd(false)}
          onSave={p => {
            dispatch({ type: 'ADD_PROPERTY', property: { ...p, id: `prop-${Date.now()}` } });
            setShowAdd(false);
          }}
        />
      )}

      {editProperty && (
        <PropertyModal
          title="Redigera fastighet"
          initial={editProperty}
          onClose={() => setEditProperty(null)}
          onSave={p => {
            dispatch({ type: 'UPDATE_PROPERTY', property: p });
            setEditProperty(null);
          }}
        />
      )}
    </div>
  );
}
