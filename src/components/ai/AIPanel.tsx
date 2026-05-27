import { useState } from 'react';
import { useAIInsights } from '../../hooks/useAIInsights';
import { useApp } from '../../hooks/useApp';
import { usePromptTemplates } from '../../hooks/usePromptTemplates';
import { AIPreset } from '../../types';
import { Card, Btn, SectionHeader } from '../ui';
import { InsightCard } from './InsightCard';
import { AITemplateList } from './AITemplateList';
import { AICustomPromptForm } from './AICustomPromptForm';

interface PresetOption { key: AIPreset; label: string; icon: string; }

interface Props {
  scope:       'portfolio' | 'property';
  propertyId?: string;
  presets:     PresetOption[];
  title?:      string;
}

export function AIPanel({ scope, propertyId, presets, title = '🤖 AI-analys' }: Props) {
  const { insights, analyzing, analyze, remove } = useAIInsights(scope === 'property' ? propertyId : undefined);
  const { state } = useApp();
  const { templates, add: addTemplate, remove: removeTemplate } = usePromptTemplates(scope);

  const [customPrompt,  setCustomPrompt]  = useState('');
  const [showCustom,    setShowCustom]    = useState(false);
  const [templateName,  setTemplateName]  = useState('');
  const [showSaveAs,    setShowSaveAs]    = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [expandedId,    setExpandedId]    = useState<string | null>(insights[0]?.id ?? null);

  const blocked = state.properties.length === 0 && scope !== 'property';

  async function handlePreset(preset: AIPreset) {
    setError(null);
    if (blocked) { setError('Lägg till minst en fastighet eller prospekt först — AI:n behöver data att analysera.'); return; }
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
    else { setExpandedId(res.id ?? null); setShowSaveAs(true); }
  }

  async function handleSaveTemplate() {
    const name = templateName.trim() || customPrompt.slice(0, 40) + (customPrompt.length > 40 ? '…' : '');
    await addTemplate(name, customPrompt, scope);
    setTemplateName(''); setShowSaveAs(false); setCustomPrompt(''); setShowCustom(false);
  }

  return (
    <Card className="card-p" style={{ marginTop: '20px' }}>
      <SectionHeader title={title} />

      {blocked && (
        <p className="text-mute" style={{ fontSize: '13px', marginBottom: '12px', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: '6px', border: '1px dashed var(--border)' }}>
          💡 Lägg till minst en fastighet (Portfölj) eller ett prospekt (Jämför) innan du kör AI-analyser.
        </p>
      )}

      {/* Preset-knappar */}
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

      <AITemplateList
        templates={templates}
        analyzing={analyzing}
        blocked={blocked}
        showManage={showTemplates}
        onRun={handleTemplate}
        onDelete={removeTemplate}
        onToggleManage={() => setShowTemplates(v => !v)}
      />

      {showCustom && (
        <AICustomPromptForm
          customPrompt={customPrompt}
          onPromptChange={setCustomPrompt}
          onAnalyze={handleCustom}
          onClose={() => { setShowCustom(false); setCustomPrompt(''); setShowSaveAs(false); }}
          analyzing={analyzing}
          showSaveAs={showSaveAs}
          templateName={templateName}
          onTemplateNameChange={setTemplateName}
          onSaveTemplate={handleSaveTemplate}
          onSkipSave={() => { setShowSaveAs(false); setCustomPrompt(''); setShowCustom(false); }}
        />
      )}

      {analyzing && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-mute)' }}>
          <div className="app-loading__spinner" style={{ margin: '0 auto 12px' }} />
          AI:n tänker… (5-15 sekunder)
        </div>
      )}

      {error && <div className="db-error-banner" style={{ marginBottom: '12px' }}><span>⚠ {error}</span></div>}

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
