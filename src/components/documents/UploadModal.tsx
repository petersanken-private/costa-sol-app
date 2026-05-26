import { useState, useRef } from 'react';
import { DocCategory } from '../../types';
import { Btn, FormGroup, Modal } from '../ui';
import { CATEGORIES, fmtSize, guessCategory } from './categories';

interface Props {
  propertyId: string;
  onClose:    () => void;
  onUploaded: () => void;
  uploadFn:   (file: File, cat: DocCategory, notes?: string, onProgress?: (pct: number) => void) => Promise<{ error: string | null }>;
}

export function UploadModal({ onClose, onUploaded, uploadFn }: Props) {
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
    if (f.size > 20 * 1024 * 1024) { setError('Filen är för stor (max 20 MB).'); return; }
    setFile(f);
    setError('');
    setCat(guessCategory(f.name));
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
          className="hidden"
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

      <div className="grid-2 mt-4">
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
