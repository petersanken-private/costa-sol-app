// ── MonteCarloResults ─────────────────────────────────────────────────────────
// Visar statistik + histogram efter att en Monte Carlo-simulering körts.
// Extraherad från MonteCarloTab.tsx för att hålla den filen under ~150 rader.

import { Card, SectionHeader, Stat } from '../ui';
import { fmtPct, MonteCarloResult } from '../../utils/calc.utils';

interface MonteCarloResultsProps {
  result:   MonteCarloResult;
  maxCount: number;
}

export function MonteCarloResults({ result, maxCount }: MonteCarloResultsProps) {
  return (
    <>
      <Card>
        <SectionHeader title="Resultat" />
        <div className="mc-stats-grid">
          <Stat label="Medel (avk./år)"    value={fmtPct(result.meanAnnualizedReturn)}   color={result.meanAnnualizedReturn > 5 ? 'var(--green)' : 'var(--text)'} />
          <Stat label="Median"             value={fmtPct(result.medianAnnualizedReturn)} color="var(--gold)" />
          <Stat label="Pessimistisk (P10)" value={fmtPct(result.p10AnnualizedReturn)}    color={result.p10AnnualizedReturn > 0 ? 'var(--text)' : 'var(--red)'} />
          <Stat label="Optimistisk (P90)"  value={fmtPct(result.p90AnnualizedReturn)}    color="var(--green)" />
        </div>

        <div className="mc-probabilities">
          <p className="section-title" style={{ fontSize: '14px', marginTop: '20px' }}>Sannolikheter</p>
          <div className="mc-prob-grid">
            <ProbabilityRow label="Positiv avkastning" value={result.probabilityPositive} color="var(--green)" />
            <ProbabilityRow label="Över 5%/år"         value={result.probabilityAbove5}   color="var(--gold)" />
            <ProbabilityRow label="Över 10%/år"        value={result.probabilityAbove10}  color="var(--gold)" />
            <ProbabilityRow label="Över 15%/år"        value={result.probabilityAbove15}  color="var(--green)" />
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Fördelning av årlig avkastning" />
        <div className="mc-histogram">
          {result.histogram.map((h, i) => (
            <div key={i} className="mc-bar-wrap" title={`${h.bin.toFixed(1)}% — ${h.count} simuleringar`}>
              <div
                className="mc-bar"
                style={{
                  height:     `${(h.count / maxCount) * 100}%`,
                  background: h.bin >= 0 ? 'var(--gold)' : 'var(--red)',
                }}
              />
            </div>
          ))}
        </div>
        <div className="mc-histogram-axis">
          <span>{result.histogram[0]?.bin.toFixed(0)}%</span>
          <span style={{ color: 'var(--text-mute)' }}>Årlig avkastning</span>
          <span>{result.histogram[result.histogram.length - 1]?.bin.toFixed(0)}%</span>
        </div>
        <p className="text-mute" style={{ fontSize: '11px', marginTop: '12px', textAlign: 'center' }}>
          Baserat på {result.iterations.toLocaleString('sv-SE')} simuleringar med normalfördelad variation runt scenariot.
        </p>
      </Card>
    </>
  );
}

// ── ProbabilityRow ─────────────────────────────────────────────────────────────

interface ProbabilityRowProps {
  label: string;
  value: number;  // 0–1
  color: string;
}

function ProbabilityRow({ label, value, color }: ProbabilityRowProps) {
  return (
    <div className="mc-prob-row">
      <span>{label}</span>
      <div className="mc-prob-bar">
        <div className="mc-prob-bar__fill" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <strong>{fmtPct(value * 100, 0)}</strong>
    </div>
  );
}
