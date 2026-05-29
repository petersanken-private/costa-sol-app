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
        className={[
          'border-2 rounded-[10px] text-center cursor-pointer transition-all duration-150',
          file
            ? 'border-solid border-gold bg-gold-faint p-4'
            : 'border-dashed py-8 px-4 bg-bg-subtle',
          dragOver || file
            ? 'border-gold bg-gold-faint'
            : 'border-border hover:border-gold hover:bg-gold-faint',
        ].join(' ')}
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
          <div className="flex items-center gap-3 text-left">
            <span className="text-[28px] flex-shrink-0">
              {file.name.toLowerCase().endsWith('.pdf') ? '📄' : '📎'}
            </span>
            <div>
              <p className="text-[14px] font-medium text-text break-all">{file.name}</p>
              <p className="text-[12px] text-text-mute mt-0.5">{fmtSize(file.size)}</p>
            </div>
            <button
              className="ml-auto bg-transparent border-0 text-[20px] text-text-mute py-1 px-2 flex-shrink-0 min-w-9 min-h-9 flex items-center justify-center hover:text-red"
              onClick={e => { e.stopPropagation(); setFile(null); setProg(0); }}
            >×</button>
          </div>
        ) : (
          <div>
            <p className="text-[32px] mb-2">📂</p>
            <p className="text-[14px] text-text-dim font-medium">Klicka eller dra hit en fil</p>
            <p className="text-[12px] text-text-mute mt-1">PDF, Word, Excel, PNG, JPG · Max 20 MB</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="h-1 bg-border rounded-[2px] mt-3 overflow-hidden">
          <div className="h-full bg-gold rounded-[2px] transition-[width] duration-300 ease-in-out" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="grid-2 mt-4">
        <FormGroup label="Kategori" className="col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {CATEGORIES.map(c => {
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  className={[
                    'flex flex-col items-center gap-1 py-2.5 px-1.5 min-h-[60px] rounded-[6px] border bg-transparent text-[11px] text-center transition-all duration-150 leading-[1.2]',
                    active
                      ? 'border-gold bg-gold-faint text-gold'
                      : 'border-border text-text-mute hover:border-border-hi hover:text-text-dim hover:bg-bg-subtle',
                  ].join(' ')}
                  onClick={() => setCat(c.key)}
                  type="button"
                >
                  <span className="text-[18px]">{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              );
            })}
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
