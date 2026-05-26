import { useState } from 'react';
import { useAIInsights } from '../../hooks/useAIInsights';
import { useApp } from '../../hooks/useApp';
import { usePromptTemplates } from '../../hooks/usePromptTemplates';
import { AIPreset } from '../../types';
import { Card, Btn, SectionHeader } from '../ui';
import { InsightCard } from './InsightCard';

interface PresetOption { key: AIPreset; label: string; icon: string; }

interface Props {
  scope:        'portfolio' | 'property';
  propertyId?:  string;
  presets:      PresetOption[];
  title?:       string;
}

export function AIPanel({ scope, propertyId, presets, title = '🤖 AI-analys' }: Props) {
  const { insights, analyzing, analyze, remove } = useAIInsights(scope === 'property' ? propertyId : undefined);
  const { state } = useApp();
  const { templates, add: addTemplate, remove: removeTemplate } = usePromptTemplates(scope);

  const [customPrompt,   setCustomPrompt]   = useState('');
  const [showCustom,     setShowCustom]     = useState(false);
  const [templateName,   setTemplateName]   = useState('');
  const [showSaveAs,     setShowSaveAs]     = useState(false);
  const [showTemplates,  setShowTemplates]  = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [expandedId,     setExpandedId]     = useState<string | null>(insights[0]?.id ?? null);

  // Förhindra meningslös AI-körning på tom portfölj
  const portfolioIsEmpty = state.properties.length === 0;
  const isPropertyScope  = scope === 'property';
  const blocked          = portfolioIsEmpty && !isPropertyScope;

  async function handlePreset(preset: AIPreset) {
    setError(null);
    if (blocked) {
      setError('Lägg till minst en fastighet eller prospekt först — AI:n behöver data att analysera.');
      return;
    }
    const res = await analyze({ preset, propertyId });
    if (!res.ok) setError(res.error ?? 'Okänt fel');
    else         setExpandedId(res.id ?? null);
  }

  async function handleTemplate(prompt: string) {
    setError(null);
    if (blocked) return;
    const res = await analyze({ preset: 'custom', customPrompt: prompt, propertyId });
    if (!res.ok) setError(res.error ?? 'Okänt fel');
    else         setExpandedId(res.id ?? null);
  }

  async function handleCustom() {
    if (!customPrompt.trim()) return;
    setError(null);
    const res = await analyze({ preset: 'custom', customPrompt, propertyId });
    if (!res.ok) setError(res.error ?? 'Okänt fel');
    else {
      setExpandedId(res.id ?? null);
      setShowSaveAs(true);   // erbjud att spara efter lyckad analys
    }
  }

  async function handleSaveTemplate() {
    const name = templateName.trim() || customPrompt.slice(0, 40) + (customPrompt.length > 40 ? '…' : '');
    await addTemplate(name, customPrompt, scope);
    setTemplateName('');
    setShowSaveAs(false);
    setCustomPrompt('');
    setShowCustom(false);
  }

  return (
    <Card className="card-p" style={{ marginTop: '20px' }}>
      <SectionHeader title={title} />

      {blocked && (
        <p className="text-mute" style={{ fontSize: '13px', marginBottom: '12px',
                                          padding: '10px 12px', background: 'var(--surface-2)',
                                          borderRadius: '6px', border: '1px dashed var(--border)' }}>
          💡 Lägg till minst en fastighet (Portfölj) eller ett prospekt (Jämför) innan du kör AI-analyser.
        </p>
      )}

      {/* Inbyggda preset-knappar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: templates.length > 0 ? '8px' : '16px' }}>
        {presets.map(p => (
          <Btn key={p.key} size="sm" onClick={() => handlePreset(p.key)} disabled={analyzing || blocked}>
            {p.icon} {p.label}
          </Btn>
        ))}
        <Btn size="sm" onClick={() => setShowCustom(!showCustom)} disabled={analyzing || blocked}>
          ✏️ Egen fråga
        </Btn>
      </div>

      {/* Sparade mallar */}
      {templates.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-mute)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Mallar:
          </span>
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => handleTemplate(t.prompt)}
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
            onClick={() => setShowTemplates(!showTemplates)}
          >
            {showTemplates ? 'Dölj' : 'Hantera'}
          </button>
        </div>
      )}

      {/* Mallhantering */}
      {showTemplates && (
        <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--surface-2)', borderRadius: '6px' }}>
          <p style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>Sparade mallar</p>
          {templates.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>{t.name}</p>
                <p className="text-mute" style={{ margin: '2px 0 0', fontSize: '12px' }}>{t.prompt}</p>
              </div>
              <button className="delete-btn" onClick={() => removeTemplate(t.id)} title="Ta bort mall">×</button>
            </div>
          ))}
          {templates.length === 0 && (
            <p className="text-mute" style={{ fontSize: '13px' }}>Inga sparade mallar ännu.</p>
          )}
        </div>
      )}

      {/* Custom prompt */}
      {showCustom && (
        <div style={{ marginBottom: '16px' }}>
          <textarea
            className="form-input"
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="Ställ vad som helst om din portfölj…"
            style={{ minHeight: '80px', resize: 'vertical' }}
          />
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Btn variant="primary" size="sm" onClick={handleCustom} disabled={analyzing || !customPrompt.trim()}>
              Analysera
            </Btn>
            <Btn size="sm" onClick={() => { setShowCustom(false); setCustomPrompt(''); setShowSaveAs(false); }}>
              Avbryt
            </Btn>
          </div>

          {/* Spara som mall — visas efter lyckad analys */}
          {showSaveAs && customPrompt.trim() && (
            <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--gold-faint)', borderRadius: '6px', border: '1px solid rgba(184,134,11,0.2)' }}>
              <p style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: 'var(--gold)' }}>
                🔖 Spara som mall för snabb återanvändning?
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  className="form-input"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder={customPrompt.slice(0, 40) + (customPrompt.length > 40 ? '…' : '')}
                  style={{ flex: 1, minWidth: '160px' }}
                />
                <Btn size="sm" variant="primary" onClick={handleSaveTemplate}>
                  Spara mall
                </Btn>
                <Btn size="sm" onClick={() => { setShowSaveAs(false); setCustomPrompt(''); setShowCustom(false); }}>
                  Hoppa över
                </Btn>
              </div>
            </div>
          )}
        </div>
      )}

      {analyzing && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-mute)' }}>
          <div className="app-loading__spinner" style={{ margin: '0 auto 12px' }} />
          AI:n tänker… (5-15 sekunder)
        </div>
      )}

      {error && (
        <div className="db-error-banner" style={{ marginBottom: '12px' }}>
          <span>⚠ {error}</span>
        </div>
      )}

      {/* Historik */}
      {insights.length === 0 && !analyzing && (
        <p className="text-mute" style={{ fontSize: '13px' }}>
          Klicka på en av knapparna ovan för att starta din första AI-analys.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {insights.map(ins => (
          <InsightCard
            key={ins.id}
            insight={ins}
            expanded={expandedId === ins.id}
            onToggle={() => setExpandedId(expandedId === ins.id ? null : ins.id)}
            onDelete={() => remove(ins.id)}
          />
        ))}
      </div>
    </Card>
  );
}
