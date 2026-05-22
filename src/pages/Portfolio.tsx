import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { Property, PropertyStatus } from '../types';
import { Card, Badge, Btn, EmptyState, Modal, FormGroup } from '../components/ui';
import { fmtMoney } from '../utils/calc.utils';
import { STATUS_LABELS, STATUS_COLORS } from '../data';
import { ExportMenu } from '../components/ExportMenu';
import { exportPortfolioCsv, exportPortfolioPdf } from '../utils/export';

const STATUS_FILTERS: { key: PropertyStatus | 'all'; label: string }[] = [
  { key: 'all',            label: 'Alla'           },
  { key: 'owned',          label: 'Ägs'            },
  { key: 'off-plan',       label: 'Off-plan'       },
  { key: 'under-contract', label: 'Under kontrakt' },
  { key: 'watchlist',      label: 'Bevakas'        },
];

// ── Portfolio page ────────────────────────────────────────────────────────────

export function Portfolio() {
  const { state, navigate, dispatch } = useApp();
  const [filter, setFilter]             = useState<PropertyStatus | 'all'>('all');
  const [showAdd, setShowAdd]           = useState(false);
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
                { label: 'CSV (Excel)', icon: '📊', onClick: () => exportPortfolioCsv(state.properties) },
                { label: 'PDF (utskrift)', icon: '📄', onClick: () => exportPortfolioPdf(state.properties) },
              ]}
            />
            <Btn variant="primary" onClick={() => setShowAdd(true)}>+ Ny fastighet</Btn>
          </div>
        </div>
      </div>

      {/* Filter pills */}
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

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon="◈" title="Inga fastigheter" subtitle={`Inga objekt med status "${filter}".`} />
      ) : (
        <>
          {/* Desktop table */}
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

          {/* Mobile cards */}
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

      {/* Add modal */}
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

      {/* Edit modal */}
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

// ── Property row ──────────────────────────────────────────────────────────────

interface PropertyRowProps {
  property: Property;
  onClick:  () => void;
  onEdit:   (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function PropertyRow({ property: p, onClick, onEdit, onDelete }: PropertyRowProps) {
  const gain = p.currentValue - p.purchasePrice;
  return (
    <div className="table-row table-row--clickable portfolio-table-cols" onClick={onClick}>
      <div>
        <p className="property-row__name">{p.name}</p>
        <p className="property-row__meta">{p.area} · {p.sizeSqm}m² · {p.bedrooms} sovrum</p>
      </div>
      <p className="property-row__type">{p.type}</p>
      <Badge label={STATUS_LABELS[p.status]} color={STATUS_COLORS[p.status]} />
      <p className="property-row__price">{fmtMoney(p.purchasePrice)}</p>
      <div>
        <p className="property-row__value">{fmtMoney(p.currentValue)}</p>
        <p className="property-row__gain" style={{ color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {gain >= 0 ? '+' : ''}{fmtMoney(gain)}
        </p>
      </div>
      <p className="property-row__vft" style={{ color: p.hasVFTLicense ? 'var(--green)' : 'var(--text-mute)' }}>
        {p.hasVFTLicense ? '✓ Licens' : '— Saknas'}
      </p>
      <div className="property-row__actions">
        <button className="row-action-btn row-action-btn--edit" onClick={onEdit} title="Redigera">✎</button>
        <button className="row-action-btn row-action-btn--delete" onClick={onDelete} title="Ta bort">×</button>
      </div>
    </div>
  );
}


interface PropertyCardProps {
  property: import('../types').Property;
  onClick:  () => void;
  onEdit:   () => void;
  onDelete: () => void;
}

function PropertyCard({ property: p, onClick, onEdit, onDelete }: PropertyCardProps) {
  const gain = p.currentValue - p.purchasePrice;
  return (
    <div className="prop-mobile-card" onClick={onClick}>
      <div className="prop-mobile-card__top">
        <div>
          <p className="prop-mobile-card__name">{p.name}</p>
          <p className="prop-mobile-card__meta">{p.area} · {p.sizeSqm}m² · {p.bedrooms} sov</p>
        </div>
        <div className="prop-mobile-card__actions" onClick={e => e.stopPropagation()}>
          <button className="row-action-btn row-action-btn--edit" onClick={onEdit}>✎</button>
          <button className="row-action-btn row-action-btn--delete" onClick={onDelete}>×</button>
        </div>
      </div>
      <div className="prop-mobile-card__row">
        <span className="prop-mobile-card__label">Köpeskilling</span>
        <span className="prop-mobile-card__price">{fmtMoney(p.purchasePrice)}</span>
      </div>
      <div className="prop-mobile-card__row">
        <span className="prop-mobile-card__label">Nuv. värde</span>
        <div style={{ textAlign: "right" }}>
          <span className="prop-mobile-card__value">{fmtMoney(p.currentValue)}</span>
          <span style={{ fontSize: "11px", color: gain >= 0 ? "var(--green)" : "var(--red)" }}>
            {" "}{gain >= 0 ? "+" : ""}{fmtMoney(gain)}
          </span>
        </div>
      </div>
      <div className="prop-mobile-card__row">
        <Badge label={STATUS_LABELS[p.status]} color={STATUS_COLORS[p.status]} />
        <span style={{ fontSize: "12px", color: p.hasVFTLicense ? "var(--green)" : "var(--text-mute)" }}>
          {p.hasVFTLicense ? "✓ VFT" : "— Ingen licens"}
        </span>
      </div>
    </div>
  );
}
// ── Shared property form ──────────────────────────────────────────────────────

interface PropertyFormState {
  name:            string;
  development:     string;
  area:            string;
  type:            Property['type'];
  status:          Property['status'];
  bedrooms:        string;
  bathrooms:       string;
  sizeSqm:         string;
  terraceSqm:      string;
  purchasePrice:   string;
  currentValue:    string;
  completionDate:  string;
  rentalStrategy:  Property['rentalStrategy'];
  hasVFTLicense:   boolean;
  notes:           string;
}

function propertyToFormState(p?: Property): PropertyFormState {
  if (!p) {
    return {
      name: '', development: '', area: 'Cancelada',
      type: 'apartment', status: 'watchlist',
      bedrooms: '2', bathrooms: '2',
      sizeSqm: '90', terraceSqm: '30',
      purchasePrice: '', currentValue: '',
      completionDate: '',
      rentalStrategy: 'short-term',
      hasVFTLicense: false, notes: '',
    };
  }
  return {
    name:           p.name,
    development:    p.development,
    area:           p.area,
    type:           p.type,
    status:         p.status,
    bedrooms:       String(p.bedrooms),
    bathrooms:      String(p.bathrooms),
    sizeSqm:        String(p.sizeSqm),
    terraceSqm:     String(p.terraceSqm),
    purchasePrice:  String(p.purchasePrice),
    currentValue:   String(p.currentValue),
    completionDate: p.completionDate ?? '',
    rentalStrategy: p.rentalStrategy,
    hasVFTLicense:  p.hasVFTLicense,
    notes:          p.notes ?? '',
  };
}

function formStateToProperty(f: PropertyFormState, existing?: Property): Property {
  const purchasePrice = parseInt(f.purchasePrice.replace(/\D/g, ''), 10);
  const currentValue  = f.currentValue
    ? parseInt(f.currentValue.replace(/\D/g, ''), 10)
    : purchasePrice;

  return {
    id:             existing?.id ?? `prop-${Date.now()}`,
    name:           f.name.trim(),
    development:    f.development.trim(),
    area:           f.area.trim(),
    type:           f.type,
    status:         f.status,
    bedrooms:       parseInt(f.bedrooms, 10),
    bathrooms:      parseInt(f.bathrooms, 10),
    sizeSqm:        parseInt(f.sizeSqm, 10),
    terraceSqm:     parseInt(f.terraceSqm, 10),
    purchasePrice,
    currentValue,
    completionDate: f.completionDate || undefined,
    rentalStrategy: f.rentalStrategy,
    hasVFTLicense:  f.hasVFTLicense,
    notes:          f.notes.trim() || undefined,
  };
}

// ── Property modal (add + edit) ───────────────────────────────────────────────

interface PropertyModalProps {
  title:    string;
  initial?: Property;
  onClose:  () => void;
  onSave:   (p: Property) => void;
}

function PropertyModal({ title, initial, onClose, onSave }: PropertyModalProps) {
  const [form, setForm] = useState<PropertyFormState>(() => propertyToFormState(initial));
  const [error, setError] = useState('');

  function set<K extends keyof PropertyFormState>(key: K, value: PropertyFormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setError('');
  }

  function handleSave() {
    if (!form.name.trim())        { setError('Namn krävs.');           return; }
    if (!form.purchasePrice)      { setError('Köpeskilling krävs.');   return; }
    const price = parseInt(form.purchasePrice.replace(/\D/g, ''), 10);
    if (isNaN(price) || price <= 0) { setError('Ogiltigt pris.');      return; }
    onSave(formStateToProperty(form, initial));
  }

  const isEdit = !!initial;

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
          {isEdit && (
            <span className="modal-edit-hint">Ändringar sparas direkt i appen.</span>
          )}
          <Btn variant="primary" onClick={handleSave}>
            {isEdit ? 'Spara ändringar' : 'Lägg till'}
          </Btn>
        </>
      }
    >
      <div className="grid-2">
        <FormGroup label="Namn *" span2>
          <input
            className="form-input"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="t.ex. Essence Residences 3B"
          />
        </FormGroup>

        <FormGroup label="Projekt / Development">
          <input
            className="form-input"
            value={form.development}
            onChange={e => set('development', e.target.value)}
          />
        </FormGroup>

        <FormGroup label="Område">
          <input
            className="form-input"
            value={form.area}
            onChange={e => set('area', e.target.value)}
          />
        </FormGroup>

        <FormGroup label="Köpeskilling (€) *">
          <input
            className="form-input"
            value={form.purchasePrice}
            onChange={e => set('purchasePrice', e.target.value)}
            placeholder="780000"
          />
        </FormGroup>

        <FormGroup label="Nuvarande värde (€)">
          <input
            className="form-input"
            value={form.currentValue}
            onChange={e => set('currentValue', e.target.value)}
            placeholder="Lämna tomt = köpeskilling"
          />
        </FormGroup>

        <FormGroup label="Status">
          <select
            className="form-input"
            value={form.status}
            onChange={e => set('status', e.target.value as Property['status'])}
          >
            <option value="watchlist">Bevakas</option>
            <option value="off-plan">Off-plan</option>
            <option value="under-contract">Under kontrakt</option>
            <option value="owned">Ägs</option>
          </select>
        </FormGroup>

        <FormGroup label="Typ">
          <select
            className="form-input"
            value={form.type}
            onChange={e => set('type', e.target.value as Property['type'])}
          >
            <option value="apartment">Lägenhet</option>
            <option value="penthouse">Penthouse</option>
            <option value="villa">Villa</option>
            <option value="townhouse">Radhus</option>
          </select>
        </FormGroup>

        <FormGroup label="Sovrum">
          <select className="form-input" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)}>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </FormGroup>

        <FormGroup label="Badrum">
          <select className="form-input" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)}>
            {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </FormGroup>

        <FormGroup label="Storlek (kvm)">
          <input className="form-input" value={form.sizeSqm} onChange={e => set('sizeSqm', e.target.value)} />
        </FormGroup>

        <FormGroup label="Terrass (kvm)">
          <input className="form-input" value={form.terraceSqm} onChange={e => set('terraceSqm', e.target.value)} />
        </FormGroup>

        <FormGroup label="Uthyrningsstrategi" span2>
          <select
            className="form-input"
            value={form.rentalStrategy}
            onChange={e => set('rentalStrategy', e.target.value as Property['rentalStrategy'])}
          >
            <option value="short-term">Korttid (Airbnb)</option>
            <option value="mid-term">Mellanlång (1–11 mån)</option>
            <option value="long-term">Långtid (12+ mån)</option>
          </select>
        </FormGroup>

        <FormGroup label="Inflyttningsdatum (off-plan)" span2>
          <input
            className="form-input"
            type="date"
            value={form.completionDate}
            onChange={e => set('completionDate', e.target.value)}
          />
        </FormGroup>

        <FormGroup label="Anteckningar" span2>
          <textarea
            className="form-input form-input--textarea"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </FormGroup>

        <div className="col-span-2 deductible-toggle">
          <input
            type="checkbox"
            id="vft-modal"
            checked={form.hasVFTLicense}
            onChange={e => set('hasVFTLicense', e.target.checked)}
            style={{ accentColor: 'var(--gold)', width: '16px', height: '16px' }}
          />
          <label htmlFor="vft-modal" className="form-label" style={{ cursor: 'pointer', margin: 0 }}>
            Har VFT-licens (turistuthyrningslicens)
          </label>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}
