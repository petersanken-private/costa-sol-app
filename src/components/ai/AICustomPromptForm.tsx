// ── AICustomPromptForm ────────────────────────────────────────────────────────
// Textarea för egen fråga + "Spara som mall"-flödet.

import { Btn } from '../ui';

interface AICustomPromptFormProps {
  customPrompt:     string;
  onPromptChange:   (v: string) => void;
  onAnalyze:        () => void;
  onClose:          () => void;
  analyzing:        boolean;
  showSaveAs:       boolean;
  templateName:     string;
  onTemplateNameChange: (v: string) => void;
  onSaveTemplate:   () => void;
  onSkipSave:       () => void;
}

export function AICustomPromptForm({
  customPrompt, onPromptChange, onAnalyze, onClose,
  analyzing, showSaveAs, templateName, onTemplateNameChange,
  onSaveTemplate, onSkipSave,
}: AICustomPromptFormProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <textarea
        className="form-input"
        value={customPrompt}
        onChange={e => onPromptChange(e.target.value)}
        placeholder="Ställ vad som helst om din portfölj…"
        style={{ minHeight: '80px', resize: 'vertical' }}
      />
      <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Btn variant="primary" size="sm" onClick={onAnalyze} disabled={analyzing || !customPrompt.trim()}>
          Analysera
        </Btn>
        <Btn size="sm" onClick={onClose}>Avbryt</Btn>
      </div>

      {showSaveAs && customPrompt.trim() && (
        <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--gold-faint)', borderRadius: '6px', border: '1px solid rgba(184,134,11,0.2)' }}>
          <p style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: 'var(--gold)' }}>
            🔖 Spara som mall för snabb återanvändning?
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="form-input"
              value={templateName}
              onChange={e => onTemplateNameChange(e.target.value)}
              placeholder={customPrompt.slice(0, 40) + (customPrompt.length > 40 ? '…' : '')}
              style={{ flex: 1, minWidth: '160px' }}
            />
            <Btn size="sm" variant="primary" onClick={onSaveTemplate}>Spara mall</Btn>
            <Btn size="sm" onClick={onSkipSave}>Hoppa över</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
