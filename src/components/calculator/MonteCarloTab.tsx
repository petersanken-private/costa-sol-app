import { useState, useMemo } from 'react';
import { Card, SectionHeader, Btn } from '../ui';
import { runMonteCarlo, MonteCarloResult } from '../../utils/calc.utils';
import { ScenarioConfig } from '../../types';
import { MonteCarloResults } from './MonteCarloResults';

export interface MonteCarloTabProps {
  purchasePrice:   number;
  scenario:        ScenarioConfig;
  horizonYears:    number;
  useMortgage:     boolean;
  mortgagePct:     number;
  mortgageRatePct: number;
}

export function MonteCarloTab({
  purchasePrice, scenario, horizonYears,
  useMortgage, mortgagePct, mortgageRatePct,
}: MonteCarloTabProps) {
  const [adrStd,     setAdrStd]     = useState(30);
  const [occStd,     setOccStd]     = useState(25);
  const [growthStd,  setGrowthStd]  = useState(2.5);
  const [iterations, setIterations] = useState(2000);
  const [result,     setResult]     = useState<MonteCarloResult | null>(null);
  const [running,    setRunning]    = useState(false);

  const maxCount = useMemo(
    () => result ? Math.max(...result.histogram.map(h => h.count), 1) : 1,
    [result],
  );

  function handleRun() {
    setRunning(true);
    // Defer till nästa frame så UI hinner uppdatera "Kör…"-state
    setTimeout(() => {
      setResult(runMonteCarlo({
        purchasePrice, horizonYears, useMortgage, mortgagePct,
        mortgageRate:    mortgageRatePct / 100,
        iterations,
        adrMean:         scenario.adr,
        adrStdDev:       adrStd,
        occupancyMean:   scenario.nights,
        occupancyStdDev: occStd,
        growthMean:      scenario.annualGrowthPct,
        growthStdDev:    growthStd,
      }));
      setRunning(false);
    }, 30);
  }

  return (
    <div className="mc-section">
      <Card>
        <div className="mc-intro">
          <SectionHeader title="Känslighetsanalys (Monte Carlo)" />
          <p className="text-mute" style={{ fontSize: '13px', marginTop: '4px' }}>
            Kör tusentals simuleringar med slumpmässig variation runt scenariots värden för att se
            fördelningen av möjliga utfall.
          </p>
        </div>

        <div className="mc-controls">
          <div className="mc-control">
            <label className="form-label">ADR osäkerhet (±€/natt)</label>
            <input type="number" className="form-input" value={adrStd}
                   onChange={e => setAdrStd(parseInt(e.target.value) || 0)} />
            <p className="mc-control__sub">
              Medel: €{scenario.adr}/natt · Spread ≈ €{scenario.adr - adrStd}–{scenario.adr + adrStd}
            </p>
          </div>

          <div className="mc-control">
            <label className="form-label">Beläggning osäkerhet (±nätter)</label>
            <input type="number" className="form-input" value={occStd}
                   onChange={e => setOccStd(parseInt(e.target.value) || 0)} />
            <p className="mc-control__sub">
              Medel: {scenario.nights} nätter · Spread ≈ {Math.max(0, scenario.nights - occStd)}–{scenario.nights + occStd}
            </p>
          </div>

          <div className="mc-control">
            <label className="form-label">Tillväxt osäkerhet (±%)</label>
            <input type="number" step="0.5" className="form-input" value={growthStd}
                   onChange={e => setGrowthStd(parseFloat(e.target.value) || 0)} />
            <p className="mc-control__sub">
              Medel: {scenario.annualGrowthPct}% · Spread ≈ {(scenario.annualGrowthPct - growthStd).toFixed(1)}–{(scenario.annualGrowthPct + growthStd).toFixed(1)}%
            </p>
          </div>

          <div className="mc-control">
            <label className="form-label">Antal simuleringar</label>
            <select className="form-input" value={iterations}
                    onChange={e => setIterations(parseInt(e.target.value))}>
              <option value={500}>500 (snabb)</option>
              <option value={2000}>2 000 (rekommenderat)</option>
              <option value={5000}>5 000</option>
              <option value={10000}>10 000 (långsam)</option>
            </select>
          </div>
        </div>

        <div className="mc-run-row">
          <Btn variant="primary" onClick={handleRun} disabled={running}>
            {running ? 'Kör simulering…' : `▶ Kör ${iterations.toLocaleString('sv-SE')} simuleringar`}
          </Btn>
        </div>
      </Card>

      {result && <MonteCarloResults result={result} maxCount={maxCount} />}

      {!result && !running && (
        <Card>
          <div className="empty-state">
            <p className="empty-state__icon">🎲</p>
            <p className="empty-state__title">Ingen simulering körd ännu</p>
            <p className="empty-state__sub">
              Justera osäkerheten ovan och klicka "Kör simuleringar" för att se fördelningen av möjliga utfall.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
