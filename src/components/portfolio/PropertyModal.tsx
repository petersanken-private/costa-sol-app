import { useState } from 'react';
import { Btn, Modal, FormGroup } from '../ui';
import { Property } from '../../types';

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

export interface PropertyModalProps {
  title:    string;
  initial?: Property;
  onClose:  () => void;
  onSave:   (p: Property) => void;
}

export function PropertyModal({ title, initial, onClose, onSave }: PropertyModalProps) {
  const [form, setForm]   = useState<PropertyFormState>(() => propertyToFormState(initial));
  const [error, setError] = useState('');

  function set<K extends keyof PropertyFormState>(key: K, value: PropertyFormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setError('');
  }

  function handleSave() {
    if (!form.name.trim())         { setError('Namn krävs.');         return; }
    if (!form.purchasePrice)       { setError('Köpeskilling krävs.'); return; }
    const price = parseInt(form.purchasePrice.replace(/\D/g, ''), 10);
    if (isNaN(price) || price <= 0) { setError('Ogiltigt pris.');     return; }
    onSave(formStateToProperty(form, initial));
  }

  const isEdit = !!initial;

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        {isEdit && <span className="modal-edit-hint">Ändringar sparas direkt i appen.</span>}
        <Btn variant="primary" onClick={handleSave}>
          {isEdit ? 'Spara ändringar' : 'Lägg till'}
        </Btn>
      </>}
    >
      <div className="grid-2">
        <FormGroup label="Namn *" span2>
          <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)}
                 placeholder="t.ex. Essence Residences 3B" />
        </FormGroup>

        <FormGroup label="Projekt / Development">
          <input className="form-input" value={form.development} onChange={e => set('development', e.target.value)} />
        </FormGroup>

        <FormGroup label="Område">
          <input className="form-input" value={form.area} onChange={e => set('area', e.target.value)} />
        </FormGroup>

        <FormGroup label="Köpeskilling (€) *">
          <input className="form-input" value={form.purchasePrice}
                 onChange={e => set('purchasePrice', e.target.value)} placeholder="780000" />
        </FormGroup>

        <FormGroup label="Nuvarande värde (€)">
          <input className="form-input" value={form.currentValue}
                 onChange={e => set('currentValue', e.target.value)} placeholder="Lämna tomt = köpeskilling" />
        </FormGroup>

        <FormGroup label="Status">
          <select className="form-input" value={form.status}
                  onChange={e => set('status', e.target.value as Property['status'])}>
            <option value="watchlist">Bevakas</option>
            <option value="off-plan">Off-plan</option>
            <option value="under-contract">Under kontrakt</option>
            <option value="owned">Ägs</option>
          </select>
        </FormGroup>

        <FormGroup label="Typ">
          <select className="form-input" value={form.type}
                  onChange={e => set('type', e.target.value as Property['type'])}>
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
          <select className="form-input" value={form.rentalStrategy}
                  onChange={e => set('rentalStrategy', e.target.value as Property['rentalStrategy'])}>
            <option value="short-term">Korttid (Airbnb)</option>
            <option value="mid-term">Mellanlång (1–11 mån)</option>
            <option value="long-term">Långtid (12+ mån)</option>
          </select>
        </FormGroup>

        <FormGroup label="Inflyttningsdatum (off-plan)" span2>
          <input className="form-input" type="date" value={form.completionDate}
                 onChange={e => set('completionDate', e.target.value)} />
        </FormGroup>

        <FormGroup label="Anteckningar" span2>
          <textarea className="form-input form-input--textarea" value={form.notes}
                    onChange={e => set('notes', e.target.value)} />
        </FormGroup>

        <div className="col-span-2 deductible-toggle">
          <input type="checkbox" id="vft-modal" checked={form.hasVFTLicense}
                 onChange={e => set('hasVFTLicense', e.target.checked)}
                 style={{ accentColor: 'var(--gold)', width: '16px', height: '16px' }} />
          <label htmlFor="vft-modal" className="form-label" style={{ cursor: 'pointer', margin: 0 }}>
            Har VFT-licens (turistuthyrningslicens)
          </label>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}
