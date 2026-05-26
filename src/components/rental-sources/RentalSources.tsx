import { useState } from 'react';
import { useRentalSources, ImportResult } from '../../hooks/useRentalSources';
import { RentalSource } from '../../types';
import { Card, Btn } from '../ui';
import { SourceRow } from './SourceRow';
import { SourceModal } from './SourceModal';

interface Props { propertyId: string; }

export function RentalSources({ propertyId }: Props) {
  const { sources, loading, importing, add, update, remove, importSource, importAll } = useRentalSources(propertyId);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState<RentalSource | null>(null);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  async function handleSave(s: RentalSource) {
    if (editing) await update(s);
    else         await add(s);
    setShowModal(false);
    setEditing(null);
  }

  async function handleImportAll() {
    setLastResult(null);
    setLastResult(await importAll());
  }

  async function handleImportOne(id: string) {
    setLastResult(null);
    setLastResult(await importSource(id));
  }

  async function handleDelete(s: RentalSource) {
    if (!window.confirm(`Ta bort "${s.displayName || s.feedUrl}"? Tidigare importerade bokningar påverkas inte.`)) return;
    await remove(s.id);
  }

  if (loading) return null;

  // Empty state
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
          <SourceRow
            key={s.id}
            source={s}
            importing={importing}
            onImport={() => handleImportOne(s.id)}
            onEdit={() => { setEditing(s); setShowModal(true); }}
            onDelete={() => handleDelete(s)}
          />
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
