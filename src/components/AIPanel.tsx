import React, { useState } from 'react';
import { useAIInsights } from '../hooks/useAIInsights';
import { useApp } from '../hooks/useApp';
import { AIPreset } from '../types';
import { Card, Btn, SectionHeader } from './ui';
import { renderMarkdown } from '../utils/markdown.utils';

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
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustom,   setShowCustom]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [expandedId,   setExpandedId]   = useState<string | null>(insights[0]?.id ?? null);

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

  async function handleCustom() {
    if (!customPrompt.trim()) return;
    setError(null);
    const res = await analyze({ preset: 'custom', customPrompt, propertyId });
    if (!res.ok) setError(res.error ?? 'Okänt fel');
    else {
      setExpandedId(res.id ?? null);
      setCustomPrompt('');
      setShowCustom(false);
    }
  }

  return (
    <Card className="card-p mt-5">
      <SectionHeader title={title} />

      {blocked && (
        <p className="text-[13px] mb-3 px-3 py-2.5 bg-surface-2 rounded-md border border-dashed border-border text-text-mute">
          💡 Lägg till minst en fastighet (Portfölj) eller ett prospekt (Jämför) innan du kör AI-analyser.
        </p>
      )}

      {/* Preset-knappar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {presets.map(p => (
          <Btn key={p.key} size="sm" onClick={() => handlePreset(p.key)} disabled={analyzing || blocked}>
            {p.icon} {p.label}
          </Btn>
        ))}
        <Btn size="sm" onClick={() => setShowCustom(!showCustom)} disabled={analyzing || blocked}>
          ✏️ Egen fråga
        </Btn>
      </div>

      {/* Custom prompt */}
      {showCustom && (
        <div className="mb-4">
          <textarea
            className="form-input min-h-[80px] resize-y"
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="Ställ vad som helst om din portfölj…"
          />
          <div className="mt-2 flex gap-2">
            <Btn variant="primary" size="sm" onClick={handleCustom} disabled={analyzing || !customPrompt.trim()}>
              Analysera
            </Btn>
            <Btn size="sm" onClick={() => { setShowCustom(false); setCustomPrompt(''); }}>
              Avbryt
            </Btn>
          </div>
        </div>
      )}

      {analyzing && (
        <div className="p-5 text-center text-text-mute">
          <div className="app-loading__spinner mx-auto mb-3" />
          AI:n tänker… (5-15 sekunder)
        </div>
      )}

      {error && (
        <div className="db-error-banner mb-3">
          <span>⚠ {error}</span>
        </div>
      )}

      {/* Historik */}
      {insights.length === 0 && !analyzing && (
        <p className="text-text-mute text-[13px]">
          Klicka på en av knapparna ovan för att starta din första AI-analys.
        </p>
      )}

      <div className="flex flex-col gap-3">
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

// ── Per-svar-kort ─────────────────────────────────────────────────────────────
interface InsightCardProps {
  insight:  ReturnType<typeof useAIInsights>['insights'][number];
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

const PRESET_LABELS: Record<AIPreset, string> = {
  'rank-prospects':    'Rangordning av prospekt',
  'portfolio-summary': 'Portföljöversikt',
  'cost-anomalies':    'Kostnadsanalys',
  'next-quarter':      'Nästa kvartal',
  'property-deepdive': 'Djupanalys objekt',
  'custom':            'Egen fråga',
};

function InsightCard({ insight, expanded, onToggle, onDelete }: InsightCardProps) {
  const date = new Date(insight.createdAt).toLocaleString('sv-SE', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  // Beräkna sparade tokens från caching
  const cachedPct = insight.tokensCacheRead > 0
    ? (insight.tokensCacheRead / (insight.tokensInput + insight.tokensCacheRead)) * 100
    : 0;

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();   // hindra att klick även triggar onToggle
    if (window.confirm('Ta bort denna AI-analys?')) onDelete();
  }

  return (
    <div className="border border-border rounded-lg px-4 py-3 bg-surface">
      <div className="flex justify-between items-center gap-3">
        <div className="flex-1 cursor-pointer" onClick={onToggle}>
          <p className="m-0 font-medium">
            {expanded ? '▼' : '▶'} {PRESET_LABELS[insight.preset]}
          </p>
          <p className="text-text-mute mt-1 text-[12px]">
            {date} · {insight.tokensOutput} tokens svar · {(insight.durationMs / 1000).toFixed(1)}s
            {cachedPct > 0 && ` · ${cachedPct.toFixed(0)}% cachat`}
          </p>
        </div>
        <button
          className="delete-btn flex-shrink-0 px-3 py-2 min-w-[36px]"
          onClick={handleDelete}
          title="Ta bort"
        >
          ×
        </button>
      </div>

      {expanded && (
        <div className="ai-response mt-3 pt-3 border-t border-border">
          {insight.preset === 'custom' && (
            <p className="text-text-mute text-[13px] italic mb-3">
              Fråga: "{insight.prompt}"
            </p>
          )}
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(insight.response) }} />
        </div>
      )}
    </div>
  );
}
