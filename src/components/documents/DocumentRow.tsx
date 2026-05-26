import { PropertyDocument } from '../../types';
import { catInfo, fmtSize, fmtDate } from './categories';

interface Props {
  doc:         PropertyDocument;
  isOpening:   boolean;
  isDeleting:  boolean;
  onOpen:      () => void;
  onDelete:    () => void;
}

/** En rad i dokumentlistan: ikon + namn + meta + actions. */
export function DocumentRow({ doc, isOpening, isDeleting, onOpen, onDelete }: Props) {
  const cat   = catInfo(doc.category);
  const isPdf = doc.name.toLowerCase().endsWith('.pdf');
  const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.name);

  return (
    <div className="doc-row">
      <div className="doc-row__icon">
        {isPdf ? '📄' : isImg ? '🖼️' : '📎'}
      </div>

      <div className="doc-row__info">
        <p className="doc-row__name">{doc.name}</p>
        <div className="doc-row__meta">
          <span className="doc-cat-tag">{cat.icon} {cat.label}</span>
          <span>{fmtSize(doc.sizeBytes)}</span>
          <span>{fmtDate(doc.uploadedAt)}</span>
        </div>
        {doc.notes && <p className="doc-row__notes">{doc.notes}</p>}
      </div>

      <div className="doc-row__actions">
        <button
          className="doc-action-btn doc-action-btn--open"
          onClick={onOpen}
          disabled={isOpening}
          title="Öppna"
        >
          {isOpening ? '…' : '↗'}
        </button>
        <button
          className="doc-action-btn doc-action-btn--delete"
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
