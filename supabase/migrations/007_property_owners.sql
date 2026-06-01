-- ── 007: Co-owner split per fastighet ──────────────────────────────────────
--
-- Lägger till en JSONB-kolumn `owners` på properties med struktur:
--   [{ "name": "Peter",   "share_pct": 90 },
--    { "name": "Partner", "share_pct": 10 }]
--
-- Default: tomma arrayer behandlas som "1 ägare med 100%" i appen (bakåtkomp).
-- Validering av att summan blir 100% sker i klienten (PropertyModal).
--
-- Användning:
--   - Dashboard KPI:er kan splittas per ägare när 2+ ägare finns
--   - Modelo 210 PDF-export kan generera per ägare
--   - Sambo-/skuldebrev-scenarion som beskrivs i Investeringsguiden

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS owners JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Kommentar för dokumentation
COMMENT ON COLUMN properties.owners IS
  'Array av { name: string, share_pct: number }. Tom array = single owner 100%.';
