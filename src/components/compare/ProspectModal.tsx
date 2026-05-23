import { useState } from 'react';
import { Btn, Modal, FormGroup } from '../ui';
import { ProspectProperty } from '../../types';

function newId() { return 'pro-' + Math.random().toString(36).slice(2, 10); }

export interface ProspectModalProps {
  initial: ProspectProperty | null;
  onClose: () => void;
  onSave:  (p: ProspectProperty) => void;
}

export function ProspectModal({ initial, onClose, onSave }: ProspectModalProps) {
  const [name,          setName]          = useState(initial?.name          ?? '');
  const [area,          setArea]          = useState(initial?.area          ?? '');
  const [development,   setDevelopment]   = useState(initial?.development   ?? '');
  const [purchasePrice, setPurchasePrice] = useState(initial ? String(initial.purchasePrice) : '');
  const [bedrooms,      setBedrooms]      = useState(initial ? String(initial.bedrooms)      : '2');
  const [sizeSqm,       setSizeSqm]       = useState(initial ? String(initial.sizeSqm)       : '');
  const [terraceSqm,    setTerraceSqm]    = useState(initial ? String(initial.terraceSqm)    : '0');
  const [floor,         setFloor]         = useState(initial?.floor         ?? '');
  const [link,          setLink]          = useState(initial?.link          ?? '');
  const [notes,         setNotes]         = useState(initial?.notes         ?? '');
  const [error,         setError]         = useState('');

  function handleSave() {
    if (!name.trim())   return setError('Namn krävs.');
    if (!purchasePrice) return setError('Pris krävs.');
    if (!sizeSqm)       return setError('Storlek krävs.');

    onSave({
      id:            initial?.id  ?? newId(),
      name:          name.trim(),
      area:          area.trim(),
      type:          'apartment',
      bedrooms:      parseInt(bedrooms)   || 2,
      sizeSqm:       parseInt(sizeSqm)    || 0,
      terraceSqm:    parseInt(terraceSqm) || 0,
      purchasePrice: parseInt(purchasePrice.replace(/\D/g, '')) || 0,
      floor:         floor.trim()       || undefined,
      development:   development.trim() || undefined,
      link:          link.trim()        || undefined,
      notes:         notes.trim()       || undefined,
    });
  }

  return (
    <Modal
      title={initial ? 'Redigera prospekt' : 'Lägg till objekt'}
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleSave}>{initial ? 'Spara' : 'Lägg till'}</Btn>
      </>}
    >
      {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
      <div className="grid-2">
        <FormGroup label="Namn / Beteckning" className="col-span-2">
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="t.ex. Apt 4B Cancelada" />
        </FormGroup>
        <FormGroup label="Område">
          <input className="form-input" value={area} onChange={e => setArea(e.target.value)} placeholder="t.ex. Cancelada" />
        </FormGroup>
        <FormGroup label="Projekt / Byggherre">
          <input className="form-input" value={development} onChange={e => setDevelopment(e.target.value)} placeholder="t.ex. Essence Residences" />
        </FormGroup>
        <FormGroup label="Begärt pris (€)">
          <input className="form-input" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="780000" />
        </FormGroup>
        <FormGroup label="Sovrum">
          <select className="form-input" value={bedrooms} onChange={e => setBedrooms(e.target.value)}>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} sovrum</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Bostadsyta (m²)">
          <input className="form-input" type="number" value={sizeSqm} onChange={e => setSizeSqm(e.target.value)} placeholder="93" />
        </FormGroup>
        <FormGroup label="Terrass (m²)">
          <input className="form-input" type="number" value={terraceSqm} onChange={e => setTerraceSqm(e.target.value)} placeholder="35" />
        </FormGroup>
        <FormGroup label="Våning / Läge">
          <input className="form-input" value={floor} onChange={e => setFloor(e.target.value)} placeholder="t.ex. 3:e vån, söder" />
        </FormGroup>
        <FormGroup label="Idealista-länk" className="col-span-2">
          <input className="form-input" value={link} onChange={e => setLink(e.target.value)} placeholder="https://idealista.com/..." />
        </FormGroup>
        <FormGroup label="Anteckningar" className="col-span-2">
          <textarea className="form-input form-input--textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Intryck, frågor, förbehåll..." />
        </FormGroup>
      </div>
    </Modal>
  );
}
