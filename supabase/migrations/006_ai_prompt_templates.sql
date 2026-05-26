-- ── AI Prompt Templates ──────────────────────────────────────────────────────
-- Sparade prompt-mallar som användaren kan klicka istället för att
-- skriva samma fråga om och om igen.

CREATE TABLE IF NOT EXISTS ai_prompt_templates (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  prompt     text        NOT NULL,
  scope      text        NOT NULL DEFAULT 'portfolio'
               CHECK (scope IN ('portfolio', 'property')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Authenticated users har full access (single-tenant, samma som övriga tabeller)
ALTER TABLE ai_prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth full access"
  ON ai_prompt_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
