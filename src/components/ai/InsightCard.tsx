import React from 'react';
import { AIPreset } from '../../types';
import { useAIInsights } from '../../hooks/useAIInsights';
import { renderMarkdown } from '../../utils/markdown.utils';

const PRESET_LABELS: Record<AIPreset, string> = {
  'rank-prospects':    'Rangordning av prospekt',
  'portfolio-summary': 'Portföljöversikt',
  'cost-anomalies':    'Kostnadsanalys',
  'next-quarter':      'Nästa kvartal',
  'property-deepdive': 'Djupanalys objekt',
  'custom':            'Egen fråga',
};

interface Props {
  insight:  ReturnType<typeof useAIInsights>['insights'][number];
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

/** Per-svar-kort i AIPanel:s historik. */
export function InsightCard({ insight, expanded, onToggle, onDelete }: Props) {
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
