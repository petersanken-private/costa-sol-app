import { useState } from 'react';
import { Btn, Modal, FormGroup } from '../ui';
import { AreaMarketData } from '../../types';

function newId() { return 'mkt-' + Math.random().toString(36).slice(2, 10); }
function today()  { return new Date().toISOString().split('T')[0]; }

export interface MarketModalProps {
  initial: AreaMarketData | null;
  onClose: () => void;
  onSave:  (m: AreaMarketData) => void;
}

export function MarketModal({ initial, onClose, onSave }: MarketModalProps) {
  const [area,        setArea]        = useState(initial?.area            ?? '');
  const [pricePerSqm, setPricePerSqm] = useState(initial ? String(initial.pricePerSqm)     : '');
  const [avgAdr,      setAvgAdr]      = useState(initial ? String(initial.avgAdr)          : '');
  const [occupancy,   setOccupancy]   = useState(initial ? String(initial.occupancyPct)    : '');
  const [growth,      setGrowth]      = useState(initial ? String(initial.annualGrowthPct) : '');
  const [source,      setSource]      = useState(initial?.source ?? 'Idealista / AirDNA');
  const [notes,       setNotes]       = useState(initial?.notes  ?? '');
  const [error,       setError]       = useState('');

  function handleSave() {
    if (!area.trim()) return setError('Område krävs.');
    if (!pricePerSqm) return setError('€/kvm krävs.');
    if (!avgAdr)      return setError('ADR krävs.');
    if (!occupancy)   return setError('Beläggning krävs.');

    onSave({
      id:              initial?.id ?? newId(),
      area:            area.trim(),
      pricePerSqm:     parseInt(pricePerSqm) || 0,
      avgAdr:          parseInt(avgAdr)      || 0,
      occupancyPct:    parseFloat(occupancy) || 0,
      annualGrowthPct: parseFloat(growth)    || 0,
      source:          source.trim()         || 'Manuell',
      updatedAt:       today(),
      notes:           notes.trim()          || undefined,
    });
  }

  return (
    <Modal
      title={initial ? 'Redigera område' : 'Lägg till område'}
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleSave}>{initial ? 'Spara ändringar' : 'Lägg till'}</Btn>
      </>}
    >
      {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
      <div className="grid-2">
        <FormGroup label="Område / Stadsdel" className="col-span-2">
          <input className="form-input" value={area} onChange={e => setArea(e.target.value)} placeholder="t.ex. Cancelada" />
        </FormGroup>
        <FormGroup label="Pris €/kvm">
          <input className="form-input" type="number" value={pricePerSqm} onChange={e => setPricePerSqm(e.target.value)} placeholder="4200" />
        </FormGroup>
        <FormGroup label="Snitt ADR (€/natt)">
          <input className="form-input" type="number" value={avgAdr} onChange={e => setAvgAdr(e.target.value)} placeholder="180" />
        </FormGroup>
        <FormGroup label="Beläggning (%)">
          <input className="form-input" type="number" value={occupancy} onChange={e => setOccupancy(e.target.value)} placeholder="62" />
        </FormGroup>
        <FormGroup label="Prisutveckling (%/år)">
          <input className="form-input" type="number" value={growth} onChange={e => setGrowth(e.target.value)} placeholder="8" />
        </FormGroup>
        <FormGroup label="Källa" className="col-span-2">
          <input className="form-input" value={source} onChange={e => setSource(e.target.value)} placeholder="Idealista mars 2025" />
        </FormGroup>
        <FormGroup label="Anteckningar" className="col-span-2">
          <textarea className="form-input form-input--textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Kommentar om området..." />
        </FormGroup>
      </div>
    </Modal>
  );
}
