import { useState } from 'react';
import { RentalSource, RentalPlatform } from '../../types';
import { Btn, Modal, FormGroup } from '../ui';

const PLATFORM_OPTIONS: RentalPlatform[] = ['airbnb', 'booking', 'direct', 'long-term'];

const PLATFORM_HELP: Record<RentalPlatform, string> = {
  'airbnb':    'Hitta i Airbnb: Listing → Availability → Calendar → Sync calendars → Export calendar',
  'booking':   'Hitta i Booking.com Extranet: Rates & Availability → Sync calendars',
  'direct':    'iCal-feed från egen kalender (Google Calendar, etc.)',
  'long-term': 'Långtidshyra — sällan iCal, oftast manuellt',
};

function newId() { return 'src-' + Math.random().toString(36).slice(2, 10); }

interface Props {
  initial:    RentalSource | null;
  propertyId: string;
  onClose:    () => void;
  onSave:     (s: RentalSource) => void;
}

export function SourceModal({ initial, propertyId, onClose, onSave }: Props) {
  const [platform,    setPlatform]    = useState<RentalPlatform>(initial?.platform ?? 'airbnb');
  const [displayName, setDisplayName] = useState(initial?.displayName ?? '');
  const [feedUrl,     setFeedUrl]     = useState(initial?.feedUrl ?? '');
  const [defaultRate, setDefaultRate] = useState(String(initial?.defaultRate ?? 200));
  const [active,      setActive]      = useState(initial?.active ?? true);
  const [error,       setError]       = useState('');

  function handleSave() {
    if (!feedUrl.trim() || !feedUrl.startsWith('http')) return setError('Giltig iCal-URL krävs (börjar med https://).');
    const rate = parseInt(defaultRate.replace(/\D/g, ''));
    if (!rate || rate <= 0) return setError('Default-pris per natt måste vara > 0.');

    onSave({
      id:               initial?.id ?? newId(),
      propertyId,
      platform,
      feedUrl:          feedUrl.trim(),
      displayName:      displayName.trim(),
      defaultRate:      rate,
      active,
      lastImportedAt:   initial?.lastImportedAt,
      lastStatus:       initial?.lastStatus,
      lastError:        initial?.lastError,
      bookingsImported: initial?.bookingsImported ?? 0,
    });
  }

  return (
    <Modal
      title={initial ? 'Redigera iCal-källa' : 'Ny iCal-källa'}
      onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Avbryt</Btn>
        <Btn variant="primary" onClick={handleSave}>{initial ? 'Spara' : 'Lägg till'}</Btn>
      </>}
    >
      {error && <p className="form-error">{error}</p>}
      <p className="text-text-mute text-[13px] mb-4">
        {PLATFORM_HELP[platform]}
      </p>
      <div className="grid-2">
        <FormGroup label="Plattform">
          <select className="form-input" value={platform}
                  onChange={e => setPlatform(e.target.value as RentalPlatform)}>
            {PLATFORM_OPTIONS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </FormGroup>

        <FormGroup label="Pris per natt €">
          <input className="form-input" type="number" value={defaultRate}
                 onChange={e => setDefaultRate(e.target.value)} />
        </FormGroup>

        <FormGroup label="Visningsnamn" span2>
          <input className="form-input" value={displayName}
                 onChange={e => setDisplayName(e.target.value)}
                 placeholder="t.ex. Estepona Airbnb" />
        </FormGroup>

        <FormGroup label="iCal-URL *" span2>
          <input className="form-input" value={feedUrl}
                 onChange={e => setFeedUrl(e.target.value)}
                 placeholder="https://www.airbnb.com/calendar/ical/..." />
        </FormGroup>

        <FormGroup label="Aktiv?">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
            <span>Inkluderas i "Importera alla"</span>
          </label>
        </FormGroup>
      </div>
      <p className="text-text-mute text-[12px] mt-4">
        💡 iCal-feeds innehåller bara datum + status, inte pris. Vi använder ditt "pris per natt" × antal nätter
        som intäkt för importerade bokningar.
        Du kan justera enskilda poster manuellt efter import om priset varierar.
      </p>
    </Modal>
  );
}
