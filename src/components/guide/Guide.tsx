import { useState } from 'react';
import { Card, SectionHeader } from '../ui';
import { SECTIONS } from './guide.sections';

export function Guide() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([SECTIONS[0].id]));

  function toggle(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else              next.add(id);
      return next;
    });
  }

  const expandAll   = () => setExpandedIds(new Set(SECTIONS.map(s => s.id)));
  const collapseAll = () => setExpandedIds(new Set());

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-eyebrow">Investeringsguide</p>
        <h1 className="page-title">Att investera i fastigheter i Spanien</h1>
        <p className="text-mute" style={{ fontSize: '14px', marginTop: '8px', maxWidth: '720px' }}>
          Praktisk översikt av köpprocess, skatter, regler och fallgropar.
          Fokus på Andalusien & Costa del Sol — där reglerna och kostnaderna ofta avviker från övriga Spanien.
        </p>
      </div>

      <Card className="card-p" style={{ marginBottom: '20px', background: 'var(--surface-2)', borderLeft: '3px solid var(--gold)' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-mute)' }}>
          ⚠ <strong>Disclaimer:</strong> Detta är allmän information, inte juridisk eller skatterådgivning.
          Anlita alltid spansk advokat och svensk skatterådgivare för din specifika situation.
        </p>
      </Card>

      {/* Innehållsförteckning */}
      <Card className="card-p" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
          <p className="section-title" style={{ margin: 0 }}>Innehåll</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="filter-pill" onClick={expandAll}>Expandera alla</button>
            <button className="filter-pill" onClick={collapseAll}>Kollapsa alla</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={e => {
                e.preventDefault();
                if (!expandedIds.has(s.id)) toggle(s.id);
                setTimeout(() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
              }}
              style={{
                padding: '8px 10px', fontSize: '13px', color: 'var(--text)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '6px', textDecoration: 'none', cursor: 'pointer',
              }}
            >
              {s.icon} {s.title.split(' — ')[0]}
            </a>
          ))}
        </div>
      </Card>

      {/* Sektioner */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {SECTIONS.map(s => {
          const open = expandedIds.has(s.id);
          return (
            <div key={s.id} id={s.id} style={{ scrollMarginTop: '20px' }}>
              <Card className="card-p">
                <div style={{ cursor: 'pointer' }} onClick={() => toggle(s.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '17px', fontWeight: 600 }}>{s.icon} {s.title}</p>
                      {!open && <p className="text-mute" style={{ margin: '4px 0 0', fontSize: '13px' }}>{s.summary}</p>}
                    </div>
                    <span style={{ color: 'var(--text-mute)', fontSize: '14px' }}>{open ? '▼' : '▶'}</span>
                  </div>
                </div>
                {open && (
                  <div className="ai-response" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    {s.content}
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      <Card className="card-p" style={{ marginTop: '24px' }}>
        <SectionHeader title="Vidare läsning" />
        <ul style={{ fontSize: '14px', lineHeight: 1.8 }}>
          <li><a href="https://www.aeat.es" target="_blank" rel="noopener noreferrer">AEAT — Agencia Tributaria (spanska skatteverket)</a></li>
          <li><a href="https://www.juntadeandalucia.es/organismos/turismoregeneracionjusticiayadministracionlocal/areas/turismo.html" target="_blank" rel="noopener noreferrer">Junta de Andalucía — Turism & VFT-information</a></li>
          <li><a href="https://www.skatteverket.se/privat/internationellt/utlandsinkomster.4.2cf1b5cd163796a5c8b4a35.html" target="_blank" rel="noopener noreferrer">Skatteverket — Inkomster från utlandet</a></li>
          <li>Anlita en gestor lokalt + en svensk skatterådgivare med Spanien-erfarenhet</li>
        </ul>
      </Card>
    </div>
  );
}
