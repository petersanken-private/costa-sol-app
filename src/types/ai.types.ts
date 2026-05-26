// ─────────────────────────────────────────────────────────────────────────────
// AI-rådgivning — preset-frågor och sparade analyssvar.
// ─────────────────────────────────────────────────────────────────────────────

export type AIPreset =
  | 'rank-prospects'
  | 'portfolio-summary'
  | 'cost-anomalies'
  | 'next-quarter'
  | 'property-deepdive'
  | 'custom';

/** Sparad prompt-mall som användaren skapat och kan återanvända. */
export interface AIPromptTemplate {
  id:        string;
  name:      string;
  prompt:    string;
  scope:     'portfolio' | 'property';
  createdAt: string;
}

export interface AIInsight {
  id:                string;
  preset:            AIPreset;
  propertyId?:       string;
  prompt:            string;
  response:          string;
  model:             string;
  tokensInput:       number;
  tokensOutput:      number;
  tokensCacheRead:   number;
  tokensCacheWrite:  number;
  durationMs:        number;
  createdAt:         string;
}
