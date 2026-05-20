import { useState, useRef } from 'react';
import { PropertyDocument, DocCategory } from '../types';
import { useDocuments } from '../hooks/useDocuments';
import { Card, Btn, FormGroup, Modal } from './ui';

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORIES: { key: DocCategory; label: string; icon: string }[] = [
  { key: 'contract',   label: 'Köpekontrakt',  icon: '📋' },
  { key: 'floor_plan', label: 'Planritning',   icon: '📐' },
  { key: 'inspection', label: 'Besiktning',    icon: '🔍' },
  { key: 'vft_license',label: 'VFT-licens',    icon: '📜' },
  { key: 'tax',        label: 'Skatt/Modelo',  icon: '🧾' },
  { key: 'insurance',  label: 'Försäkring',    icon: '🛡️' },
  { key: 'bank',       label: 'Bank',          icon: '🏦' },
  { key: 'other',      label: 'Övrigt',        icon: '📁' },
];

function catInfo(key: DocCategory) {
  return CATEGORIES.find(c => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

function fmtSize(bytes: number): string {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props { propertyId: string; }

export function DocumentsTab({ propertyId }: Props) {
  const { docs, loading, error, upload, getUrl, remove } = useDocuments(propertyId);
  const [showUpload,   setShowUpload]   = useState(false);
  const [filterCat,    setFilterCat]    = useState<DocCategory | 'all'>('all');
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);

  const filtered = filterCat === 'all'
    ? docs
    : docs.filter(d => d.category === filterCat);

  // Group by category for the overview bar
  const byCat = CATEGORIES.map(c => ({
    ...c,
    count: docs.filter(d => d.category === c.key).length,
  })).filter(c => c.count > 0);

  async function handleOpen(doc: PropertyDocument) {
    setOpeningDocId(doc.id);
    const url = await getUrl(doc);
    setOpeningDocId(null);
    if (url) window.open(url, '_blank');
    else alert('Kunde inte hämta länk. Försök igen.');
  }

  async function handleDelete(doc: PropertyDocument) {
    if (!window.confirm(`Ta bort "${doc.name}"? Detta går inte att ångra.`)) return;
    setDeletingId(doc.id);
    await remove(doc);
    setDeletingId(null);
  }

  if (loading) return <p className="text-mute" style={{ padding: '16px 0' }}>Laddar dokument…</p>;
  if (error)   return <p style={{ color: 'var(--red)', padding: '16px 0' }}>Fel: {error}</p>;

  return (
    <div>
      {/* Action bar */}
      <div className="tab-action-bar">
        <Btn variant="primary" size="sm" onClick={() => setShowUpload(true)}>
          + Ladda upp dokument
        </Btn>
      </div>

      {docs.length === 0 ? (
        /* Empty state with drop hint */
        <Card className="card-p">
          <div className="empty-state">
            <p className="empty-state__icon">📂</p>
            <p className="empty-state__title">Inga dokument ännu</p>
            <p className="empty-state__sub">
              Ladda upp kontrakt, planritningar, besiktningar och andra handlingar kopplade till fastigheten.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Btn variant="primary" size="sm" onClick={() => setShowUpload(true)}>
                + Ladda upp första dokumentet
              </Btn>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Category overview pills */}
          {byCat.length > 1 && (
            <div className="doc-cat-bar">
              <button
                className={`doc-cat-pill ${filterCat === 'all' ? 'doc-cat-pill--active' : ''}`}
                onClick={() => setFilterCat('all')}
              >
                Alla <span className="doc-cat-count">{docs.length}</span>
              </button>
              {byCat.map(c => (
                <button
                  key={c.key}
                  className={`doc-cat-pill ${filterCat === c.key ? 'doc-cat-pill--active' : ''}`}
                  onClick={() => setFilterCat(filterCat === c.key ? 'all' : c.key)}
                >
                  {c.icon} {c.label} <span className="doc-cat-count">{c.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Document list */}
          <div className="doc-list">
            {filtered.map(doc => {
              const cat      = catInfo(doc.category);
              const isPdf    = doc.name.toLowerCase().endsWith('.pdf');
              const isImg    = /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.name);
              const isOpening  = openingDocId === doc.id;
              const isDeleting = deletingId   === doc.id;

              return (
                <div key={doc.id} className="doc-row">
                  {/* Icon */}
                  <div className="doc-row__icon">
                    {isPdf ? '📄' : isImg ? '🖼️' : '📎'}
                  </div>

                  {/* Main info */}
                  <div className="doc-row__info">
                    <p className="doc-row__name">{doc.name}</p>
                    <div className="doc-row__meta">
                      <span className="doc-cat-tag">{cat.icon} {cat.label}</span>
                      <span>{fmtSize(doc.sizeBytes)}</span>
                      <span>{fmtDate(doc.uploadedAt)}</span>
                    </div>
                    {doc.notes && (
                      <p className="doc-row__notes">{doc.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="doc-row__actions">
                    <button
                      className="doc-action-btn doc-action-btn--open"
                      onClick={() => handleOpen(doc)}
                      disabled={isOpening}
                      title="Öppna"
                    >
                      {isOpening ? '…' : '↗'}
                    </button>
                    <button
                      className="doc-action-btn doc-action-btn--delete"
                      onClick={() => handleDelete(doc)}
                      disabled={isDeleting}
                      title="Ta bort"
                    >
                      {isDeleting ? '…' : '×'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          propertyId={propertyId}
          onClose={() => setShowUpload(false)}
          onUploaded={() => setShowUpload(false)}
          uploadFn={upload}
        />
      )}
    </div>
  );
}

// ── Upload modal ──────────────────────────────────────────────────────────────
interface UploadModalProps {
  propertyId: string;
  onClose:    () => void;
  onUploaded: () => void;
  uploadFn:   (file: File, cat: DocCategory, notes?: string, onProgress?: (pct: number) => void) => Promise<{ error: string | null }>;
}

function UploadModal({ onClose, onUploaded, uploadFn }: UploadModalProps) {
  const fileRef              = useRef<HTMLInputElement>(null);
  const [file,     setFile]  = useState<File | null>(null);
  const [category, setCat]   = useState<DocCategory>('contract');
  const [notes,    setNotes] = useState('');
  const [progress, setProg]  = useState(0);
  const [uploading,setUpl]   = useState(false);
  const [error,    setError] = useState('');
  const [dragOver, setDrag]  = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const f = files[0];
    // 20 MB limit
    if (f.size > 20 * 1024 * 1024) { setError('Filen är för stor (max 20 MB).'); return; }
    setFile(f);
    setError('');
    // Auto-detect category
    const name = f.name.toLowerCase();
    if (name.includes('kontrakt') || name.includes('contract')) setCat('contract');
    else if (name.includes('ritning') || name.includes('plan'))  setCat('floor_plan');
    else if (name.includes('besiktning'))                        setCat('inspection');
    else if (name.includes('vft') || name.includes('licens'))    setCat('vft_license');
    else if (name.includes('modelo') || name.includes('skatt'))  setCat('tax');
    else if (name.includes('försäkring') || name.includes('insurance')) setCat('insurance');
    else if (name.includes('bank') || name.includes('lån'))      setCat('bank');
  }

  async function handleUpload() {
    if (!file) { setError('Välj en fil.'); return; }
    setUpl(true);
    setError('');
    const { error: err } = await uploadFn(file, category, notes.trim() || undefined, setProg);
    setUpl(false);
    if (err) { setError(err); setProg(0); }
    else     { onUploaded(); }
  }

  return (
    <Modal
      title="Ladda upp dokument"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose} disabled={uploading}>Avbryt</Btn>
          <Btn variant="primary" onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? `Laddar upp… ${progress}%` : 'Ladda upp'}
          </Btn>
        </>
      }
    >
      {/* Drop zone */}
      <div
        className={`doc-dropzone ${dragOver ? 'doc-dropzone--over' : ''} ${file ? 'doc-dropzone--has-file' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.xls,.xlsx"
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        {file ? (
          <div className="doc-dropzone__file">
            <span className="doc-dropzone__file-icon">
              {file.name.toLowerCase().endsWith('.pdf') ? '📄' : '📎'}
            </span>
            <div>
              <p className="doc-dropzone__file-name">{file.name}</p>
              <p className="doc-dropzone__file-size">{fmtSize(file.size)}</p>
            </div>
            <button
              className="doc-dropzone__clear"
              onClick={e => { e.stopPropagation(); setFile(null); setProg(0); }}
            >×</button>
          </div>
        ) : (
          <div className="doc-dropzone__prompt">
            <p className="doc-dropzone__icon">📂</p>
            <p className="doc-dropzone__text">Klicka eller dra hit en fil</p>
            <p className="doc-dropzone__hint">PDF, Word, Excel, PNG, JPG · Max 20 MB</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="doc-progress">
          <div className="doc-progress__bar" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="grid-2" style={{ marginTop: '16px' }}>
        {/* Category */}
        <FormGroup label="Kategori" className="col-span-2">
          <div className="doc-cat-grid">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                className={`doc-cat-btn ${category === c.key ? 'doc-cat-btn--active' : ''}`}
                onClick={() => setCat(c.key)}
                type="button"
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </FormGroup>

        {/* Notes */}
        <FormGroup label="Anteckning (valfritt)" className="col-span-2">
          <input
            className="form-input"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="t.ex. Signerat av båda parter 2025-03-15"
          />
        </FormGroup>
      </div>

      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}
