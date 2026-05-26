import { useState } from 'react';
import { PropertyDocument, DocCategory } from '../../types';
import { useDocuments } from '../../hooks/useDocuments';
import { Card, Btn } from '../ui';
import { CategoryBar } from './CategoryBar';
import { DocumentRow } from './DocumentRow';
import { UploadModal } from './UploadModal';

interface Props { propertyId: string; }

export function DocumentsTab({ propertyId }: Props) {
  const { docs, loading, error, upload, getUrl, remove } = useDocuments(propertyId);
  const [showUpload,   setShowUpload]   = useState(false);
  const [filterCat,    setFilterCat]    = useState<DocCategory | 'all'>('all');
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);

  const filtered = filterCat === 'all' ? docs : docs.filter(d => d.category === filterCat);

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

  if (loading) return <p className="text-text-mute py-4">Laddar dokument…</p>;
  if (error)   return <p className="text-red py-4">Fel: {error}</p>;

  return (
    <div>
      <div className="tab-action-bar">
        <Btn variant="primary" size="sm" onClick={() => setShowUpload(true)}>
          + Ladda upp dokument
        </Btn>
      </div>

      {docs.length === 0 ? (
        <Card className="card-p">
          <div className="empty-state">
            <p className="empty-state__icon">📂</p>
            <p className="empty-state__title">Inga dokument ännu</p>
            <p className="empty-state__sub">
              Ladda upp kontrakt, planritningar, besiktningar och andra handlingar kopplade till fastigheten.
            </p>
            <div className="mt-4">
              <Btn variant="primary" size="sm" onClick={() => setShowUpload(true)}>
                + Ladda upp första dokumentet
              </Btn>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <CategoryBar docs={docs} filterCat={filterCat} onFilter={setFilterCat} />

          <div className="doc-list">
            {filtered.map(doc => (
              <DocumentRow
                key={doc.id}
                doc={doc}
                isOpening={openingDocId === doc.id}
                isDeleting={deletingId === doc.id}
                onOpen={() => handleOpen(doc)}
                onDelete={() => handleDelete(doc)}
              />
            ))}
          </div>
        </>
      )}

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
