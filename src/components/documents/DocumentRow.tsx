import { PropertyDocument } from '../../types';
import { catInfo, fmtSize, fmtDate } from './categories';

interface Props {
  doc:         PropertyDocument;
  isOpening:   boolean;
  isDeleting:  boolean;
  onOpen:      () => void;
  onDelete:    () => void;
}

const ACTION_BTN_BASE = 'w-9 h-9 rounded-[6px] border border-border bg-transparent text-[16px] text-text-mute flex items-center justify-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed';

/** En rad i dokumentlistan: ikon + namn + meta + actions. */
export function DocumentRow({ doc, isOpening, isDeleting, onOpen, onDelete }: Props) {
  const cat   = catInfo(doc.category);
  const isPdf = doc.name.toLowerCase().endsWith('.pdf');
  const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.name);

  return (
    <div className="flex items-start gap-3 p-3.5 bg-bg-card border border-border rounded-[10px] transition-colors duration-150 hover:bg-bg-subtle hover:border-border-hi">
      <div className="text-[22px] leading-none flex-shrink-0 mt-0.5">
        {isPdf ? '📄' : isImg ? '🖼️' : '📎'}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-text whitespace-nowrap overflow-hidden text-ellipsis mb-1">{doc.name}</p>
        <div className="flex flex-wrap gap-2 text-[11px] text-text-mute items-center">
          <span className="bg-bg-subtle border border-border rounded-[10px] py-px px-2 text-text-dim">{cat.icon} {cat.label}</span>
          <span>{fmtSize(doc.sizeBytes)}</span>
          <span>{fmtDate(doc.uploadedAt)}</span>
        </div>
        {doc.notes && <p className="text-[12px] text-text-mute mt-1 italic">{doc.notes}</p>}
      </div>

      <div className="flex gap-1.5 flex-shrink-0">
        <button
          className={`${ACTION_BTN_BASE} enabled:hover:border-gold enabled:hover:text-gold enabled:hover:bg-gold-faint`}
          onClick={onOpen}
          disabled={isOpening}
          title="Öppna"
        >
          {isOpening ? '…' : '↗'}
        </button>
        <button
          className={`${ACTION_BTN_BASE} enabled:hover:border-red enabled:hover:text-red enabled:hover:bg-red-bg`}
          onClick={onDelete}
          disabled={isDeleting}
          title="Ta bort"
        >
          {isDeleting ? '…' : '×'}
        </button>
      </div>
    </div>
  );
}
