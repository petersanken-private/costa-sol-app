// ── AITemplateList ────────────────────────────────────────────────────────────
// Rad med sparade mallar + mallhantering (lista med delete).

import type { AIPromptTemplate } from '../../types';
import { IconBtn } from '../ui';

interface AITemplateListProps {
  templates:       AIPromptTemplate[];
  analyzing:       boolean;
  blocked:         boolean;
  showManage:      boolean;
  onRun:           (prompt: string) => void;
  onDelete:        (id: string) => void;
  onToggleManage:  () => void;
}

export function AITemplateList({
  templates, analyzing, blocked, showManage,
  onRun, onDelete, onToggleManage,
}: AITemplateListProps) {
  if (templates.length === 0) return null;

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-mute)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Mallar:
        </span>
        {templates.map(t => (
          <button
            key={t.id}
            onClick={() => onRun(t.prompt)}
            disabled={analyzing || blocked}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(184,134,11,0.3)',
              background: 'var(--gold-faint)', color: 'var(--gold)',
              fontSize: '12px', cursor: 'pointer', fontWeight: 500,
            }}
          >
            🔖 {t.name}
          </button>
        ))}
        <button
          style={{ fontSize: '11px', background: 'none', border: 'none', color: 'var(--text-mute)', cursor: 'pointer', padding: '0 4px' }}
          onClick={onToggleManage}
        >
          {showManage ? 'Dölj' : 'Hantera'}
        </button>
      </div>

      {showManage && (
        <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--surface-2)', borderRadius: '6px' }}>
          <p style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>Sparade mallar</p>
          {templates.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>{t.name}</p>
                <p className="text-mute" style={{ margin: '2px 0 0', fontSize: '12px' }}>{t.prompt}</p>
              </div>
              <IconBtn variant="delete" onClick={() => onDelete(t.id)} title="Ta bort mall" alwaysVisible />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
