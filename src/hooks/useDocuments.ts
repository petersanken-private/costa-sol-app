import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PropertyDocument, DocCategory } from '../types';
import { docFromDb, docToDb } from '../lib/mappers';

const BUCKET = 'property-docs';

export function useDocuments(propertyId: string) {
  const [docs,    setDocs]    = useState<PropertyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('property_documents')
      .select('*')
      .eq('property_id', propertyId)
      .order('uploaded_at', { ascending: false });

    if (err) { setError(err.message); }
    else     { setDocs((data ?? []).map(r => docFromDb(r as Record<string, unknown>))); }
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  // ── Upload ──────────────────────────────────────────────────────────────────
  async function upload(
    file: File,
    category: DocCategory,
    notes?: string,
    onProgress?: (pct: number) => void,
  ): Promise<{ error: string | null }> {
    const ext  = file.name.split('.').pop() ?? 'bin';
    const path = `${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    onProgress?.(10);

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadErr) return { error: uploadErr.message };
    onProgress?.(70);

    const doc: PropertyDocument = {
      id:          `doc-${Date.now()}`,
      propertyId,
      name:        file.name,
      category,
      storagePath: path,
      sizeBytes:   file.size,
      uploadedAt:  new Date().toISOString(),
      notes,
    };

    const { error: dbErr } = await supabase.from('property_documents').insert(docToDb(doc));

    if (dbErr) {
      await supabase.storage.from(BUCKET).remove([path]);
      return { error: dbErr.message };
    }

    onProgress?.(100);
    setDocs(prev => [doc, ...prev]);
    return { error: null };
  }

  // ── Get signed URL for viewing/downloading ─────────────────────────────────
  async function getUrl(doc: PropertyDocument): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.storagePath, 3600); // 1 hour
    if (error) return null;
    return data.signedUrl;
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function remove(doc: PropertyDocument): Promise<{ error: string | null }> {
    await supabase.storage.from(BUCKET).remove([doc.storagePath]);
    const { error: dbErr } = await supabase
      .from('property_documents')
      .delete()
      .eq('id', doc.id);

    if (dbErr) return { error: dbErr.message };
    setDocs(prev => prev.filter(d => d.id !== doc.id));
    return { error: null };
  }

  return { docs, loading, error, upload, getUrl, remove, reload: load };
}
