import React, { useState } from 'react';
import { useAIInsights } from '../hooks/useAIInsights';
import { AIPreset } from '../types';
import { Card, Btn, SectionHeader } from './ui';
import { renderMarkdown } from '../utils/markdown';

interface PresetOption { key: AIPreset; label: string; icon: string; }

interface Props {
  scope:        'portfolio' | 'property';
  propertyId?:  string;
  presets:      PresetOption[];
  title?:       string;
}

export function AIPanel({ scope, propertyId, presets, title = '🤖 AI-analys' }: Props) {
  const { insights, analyzing, analyze, remove } = useAIInsights(scope === 'property' ? propertyId : undefined);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustom,   setShowCustom]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [expandedId,   setExpandedId]   = useState<string | null>(insights[0]?.id ?? null);

  async function handlePreset(preset: AIPreset) {
    setError(null);
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
    <Card className="card-p" style={{ marginTop: '20px' }}>
      <SectionHeader title={title} />

      {/* Preset-knappar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {presets.map(p => (
          <Btn key={p.key} size="sm" onClick={() => handlePreset(p.key)} disabled={analyzing}>
            {p.icon} {p.label}
          </Btn>
        ))}
        <Btn size="sm" onClick={() => setShowCustom(!showCustom)} disabled={analyzing}>
          ✏️ Egen fråga
        </Btn>
      </div>

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
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
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
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '12px 16px',
      background: 'var(--surface)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={onToggle}>
          <p style={{ margin: 0, fontWeight: 500 }}>
            {expanded ? '▼' : '▶'} {PRESET_LABELS[insight.preset]}
          </p>
          <p className="text-mute" style={{ margin: '4px 0 0', fontSize: '12px' }}>
            {date} · {insight.tokensOutput} tokens svar · {(insight.durationMs / 1000).toFixed(1)}s
            {cachedPct > 0 && ` · ${cachedPct.toFixed(0)}% cachat`}
          </p>
        </div>
        <button
          className="delete-btn"
          onClick={handleDelete}
          title="Ta bort"
          style={{ flexShrink: 0, padding: '8px 12px', minWidth: '36px' }}
        >×</button>
      </div>

      {expanded && (
        <div className="ai-response" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          {insight.preset === 'custom' && (
            <p className="text-mute" style={{ fontSize: '13px', fontStyle: 'italic', marginBottom: '12px' }}>
              Fråga: "{insight.prompt}"
            </p>
          )}
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(insight.response) }} />
        </div>
      )}
    </div>
  );
}
