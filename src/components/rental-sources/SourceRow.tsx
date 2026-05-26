import { RentalSource } from '../../types';
import { Btn, Badge } from '../ui';
import { PLATFORM_COLORS } from '../../data';

interface Props {
  source:      RentalSource;
  importing:   boolean;
  onImport:    () => void;
  onEdit:      () => void;
  onDelete:    () => void;
}

/** En rad i iCal-listan. */
export function SourceRow({ source: s, importing, onImport, onEdit, onDelete }: Props) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 bg-surface rounded-md ${s.active ? '' : 'opacity-50'}`}>
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
        {s.lastError && <p className="mt-0.5 text-[11px] text-red">{s.lastError}</p>}
      </div>
      <Btn size="sm" onClick={onImport} disabled={importing || !s.active}>↻</Btn>
      <button className="edit-btn"  onClick={onEdit}>✎</button>
      <button className="delete-btn" onClick={onDelete}>×</button>
    </div>
  );
}
