import { useState } from 'react';
import { useRentalSources, ImportResult } from '../hooks/useRentalSources';
import { RentalSource, RentalPlatform } from '../types';
import { Card, Btn, Modal, FormGroup, Badge } from './ui';
import { PLATFORM_COLORS } from '../data';

const PLATFORM_OPTIONS: RentalPlatform[] = ['airbnb', 'booking', 'direct', 'long-term'];

const PLATFORM_HELP: Record<RentalPlatform, string> = {
  'airbnb':    'Hitta i Airbnb: Listing → Availability → Calendar → Sync calendars → Export calendar',
  'booking':   'Hitta i Booking.com Extranet: Rates & Availability → Sync calendars',
  'direct':    'iCal-feed från egen kalender (Google Calendar, etc.)',
  'long-term': 'Långtidshyra — sällan iCal, oftast manuellt',
};

function newId() { return 'src-' + Math.random().toString(36).slice(2, 10); }

interface Props { propertyId: string; }

export function RentalSources({ propertyId }: Props) {
  const { sources, loading, importing, add, update, remove, importSource, importAll } = useRentalSources(propertyId);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState<RentalSource | null>(null);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  async function handleSave(s: RentalSource) {
    if (editing) await update(s);
    else         await add(s);
    setShowModal(false);
    setEditing(null);
  }

  async function handleImportAll() {
    setLastResult(null);
    const res = await importAll();
    setLastResult(res);
  }

  async function handleImportOne(id: string) {
    setLastResult(null);
    const res = await importSource(id);
    setLastResult(res);
  }

  async function handleDelete(s: RentalSource) {
    if (!window.confirm(`Ta bort "${s.displayName || s.feedUrl}"? Tidigare importerade bokningar påverkas inte.`)) return;
    await remove(s.id);
  }

  if (loading) return null;
  if (sources.length === 0) {
    return (
      <Card className="card-p mb-4 bg-surface-2">
        <div className="flex justify-between items-center gap-3">
          <div>
            <p className="m-0 font-medium">🔗 iCal-import</p>
            <p className="text-text-mute mt-1 text-[13px]">
              Importera bokningar automatiskt från Airbnb, Booking eller egen kalender.
            </p>
          </div>
          <Btn size="sm" variant="primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            + Lägg till feed
          </Btn>
        </div>
        {showModal && (
          <SourceModal
            initial={null}
            propertyId={propertyId}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </Card>
    );
  }

  return (
    <Card className="card-p mb-4 bg-surface-2">
      <div className="flex justify-between items-center mb-3">
        <div>
          <p className="m-0 font-medium">🔗 iCal-källor ({sources.length})</p>
          <p className="text-text-mute mt-1 text-[12px]">
            Importera bokningar från externa kalendrar
          </p>
        </div>
        <div className="flex gap-2">
          <Btn size="sm" onClick={handleImportAll} disabled={importing}>
            {importing ? 'Importerar…' : '↻ Importera alla nu'}
          </Btn>
          <Btn size="sm" variant="primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            + Lägg till
          </Btn>
        </div>
      </div>

      {lastResult && (
        <div className={`px-3 py-2 rounded-md mb-3 text-[13px] ${lastResult.ok ? 'bg-green/10' : 'bg-red/10'}`}>
          {lastResult.ok
            ? `✓ ${lastResult.results?.reduce((s, r) => s + r.imported, 0) ?? 0} bokningar importerade`
            : `⚠ Fel: ${lastResult.error}`}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {sources.map(s => (
          <div
            key={s.id}
            className={`flex items-center gap-3 px-3 py-2.5 bg-surface rounded-md ${s.active ? '' : 'opacity-50'}`}
          >
            <Badge label={s.platform} color={PLATFORM_COLORS[s.platform]} />
            <div className="flex-1 min-w-0">
              <p className="m-0 font-medium text-[14px]">
                {s.displayName || s.feedUrl.substring(0, 50) + '…'}
              </p>
              <p className="text-text-mute mt-0.5 text-[12px]">
                €{s.defaultRate}/natt · {s.bookingsImported} importerade
                {s.lastImportedAt && ` · senast ${new Date(s.lastImportedAt).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                {s.lastStatus === 'error' && <span className="text-red"> · FEL</span>}
              </p>
              {s.lastError && (
                <p className="mt-0.5 text-[11px] text-red">
                  {s.lastError}
                </p>
              )}
            </div>
            <Btn size="sm" onClick={() => handleImportOne(s.id)} disabled={importing || !s.active}>↻</Btn>
            <button className="edit-btn"  onClick={() => { setEditing(s); setShowModal(true); }}>✎</button>
            <button className="delete-btn" onClick={() => handleDelete(s)}>×</button>
          </div>
        ))}
      </div>

      {showModal && (
        <SourceModal
          initial={editing}
          propertyId={propertyId}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </Card>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  initial:    RentalSource | null;
  propertyId: string;
  onClose:    () => void;
  onSave:     (s: RentalSource) => void;
}

function SourceModal({ initial, propertyId, onClose, onSave }: ModalProps) {
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
