import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { Property, PropertyStatus } from '../../types';
import { Btn, EmptyState, Stat, Icon } from '../ui';
import { fmtMoney } from '../../utils/calc.utils';
import { ExportMenu } from '../ExportMenu';
import { exportPortfolioCsv, exportPortfolioPdf } from '../../utils/export';
import { PropertyCard, PropertyModal } from '.';

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

  const all          = state.properties;
  const totalValue   = all.reduce((s, p) => s + p.currentValue, 0);
  const totalInvested = all.reduce((s, p) => s + p.purchasePrice, 0);
  const rentableCount = all.filter(p => p.hasVFTLicense).length;
  const avgGainPct   = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;
  const fmtPct1      = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1).replace('.', ',')} %`;

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
        <p className="page-eyebrow">Portfölj · {all.length} {all.length === 1 ? 'fastighet' : 'fastigheter'}</p>
        <div className="flex justify-between items-end">
          <h1 className="page-title">Dina objekt</h1>
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

      {/* Summering — joined stat-grid */}
      {all.length > 0 && (
        <div className="stat-grid mb-6">
          <div className="stat-cell"><Stat label="Totalt värde"   value={fmtMoney(totalValue)}    sub={`${all.length} fastigheter`} /></div>
          <div className="stat-cell"><Stat label="Investerat"     value={fmtMoney(totalInvested)} sub="Köpeskilling totalt" /></div>
          <div className="stat-cell"><Stat label="Hyrs ut idag"   value={String(rentableCount)}   sub="Med VFT-licens" /></div>
          <div className="stat-cell"><Stat label="Genomsn. avk."  value={fmtPct1(avgGainPct)}     sub="Värdeökning" color={avgGainPct >= 0 ? 'var(--green)' : 'var(--red)'} /></div>
        </div>
      )}

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

      {all.length === 0 ? (
        <EmptyState icon="◈" title="Inga fastigheter" subtitle="Lägg till ditt första objekt för att komma igång." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(p => (
            <PropertyCard
              key={p.id}
              property={p}
              onClick={() => navigate('property', p.id)}
              onEdit={() => setEditProperty(p)}
              onDelete={() => handleDelete(p)}
            />
          ))}
          {/* Dashed "lägg till" — visas bara i ofiltrerad vy */}
          {filter === 'all' && (
            <button
              className="card--dashed flex flex-col items-center justify-center gap-2 min-h-[200px] bg-bg-card border border-dashed border-border rounded-[14px] text-text-mute transition-all duration-150 hover:bg-bg-hover hover:border-green hover:text-green"
              onClick={() => setShowAdd(true)}
            >
              <Icon name="plus" size={22} />
              <span className="text-[13px] font-medium">Lägg till nytt objekt</span>
            </button>
          )}
        </div>
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
