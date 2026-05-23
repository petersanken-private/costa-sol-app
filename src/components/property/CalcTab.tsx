import { useState } from 'react';
import { Card, SectionHeader, Stat, Divider } from '../ui';
import { Property, ScenarioKey } from '../../types';
import { SCENARIOS } from '../../data';
import {
  fmtMoney, fmtPct, calcInvestment, cashflowLabelColor, cashflowValueColor,
} from '../../utils/calc.utils';
import { OPERATING } from '../../constants/tax';

export interface CalcTabProps {
  property: Property;
}

export function CalcTab({ property }: CalcTabProps) {
  const [scenario, setScenario] = useState<ScenarioKey>('base');
  const sc = SCENARIOS.find(s => s.key === scenario)!;

  const result = calcInvestment({
    purchasePrice: property.purchasePrice,
    scenario:      sc,
    horizonYears:  5,
    useMortgage:   false,
    mortgagePct:   60,
    mortgageRate:  0.045,
  });

  const cashflowRows = [
    { label: 'Bruttohyra',                            value:  result.grossRent,                isIncome: true },
    { label: 'Förvaltning (18%)',                     value: -result.managementFee                            },
    { label: `Städning (${sc.nights} nätter)`,        value: -result.cleaningCost                             },
    { label: 'IBI + Försäkring + Community + Gestor', value: -result.fixedCosts                               },
    { label: `Underhåll (${(OPERATING.MAINTENANCE_PCT * 100).toFixed(1)}%)`,
                                                       value: -(property.purchasePrice * OPERATING.MAINTENANCE_PCT) },
    { label: 'Netto f. skatt',                        value:  result.netBeforeTax, isNet:   true              },
    { label: 'IRNR-skatt (19%)',                      value: -result.tax                                      },
    { label: 'Netto e. skatt',                        value:  result.netAfterTax,  isFinal: true              },
  ];

  return (
    <div>
      <div className="scenario-list" style={{ marginBottom: '20px', maxWidth: '600px' }}>
        {SCENARIOS.map(s => (
          <button
            key={s.key}
            className="scenario-btn"
            style={{
              borderColor: scenario === s.key ? s.color : undefined,
              background:  scenario === s.key ? s.color + '10' : undefined,
            }}
            onClick={() => setScenario(s.key)}
          >
            <span className="scenario-btn__label" style={{ color: scenario === s.key ? s.color : undefined }}>
              {s.label}
            </span>
            <span className="scenario-btn__meta">
              {s.nights} nätter · €{s.adr}/natt · +{s.annualGrowthPct}%/år
            </span>
          </button>
        ))}
      </div>

      <div className="grid-2">
        <Card>
          <div className="card-p" style={{ paddingBottom: 0 }}>
            <SectionHeader title="Kassaflöde / år (est.)" />
          </div>
          {cashflowRows.map((row, i) => (
            <div key={i}
                 className={`cashflow-row ${row.isFinal ? 'cashflow-row--final' : ''} ${row.isNet ? 'cashflow-row--net' : ''}`}>
              <span style={{ color: cashflowLabelColor(row) }}>{row.label}</span>
              <span style={{ color: cashflowValueColor(row, sc.color) }}>
                {row.value >= 0 ? '+' : '−'}{fmtMoney(Math.abs(row.value))}
              </span>
            </div>
          ))}
        </Card>

        <Card className="card-p">
          <SectionHeader title="Avkastning & exit (5 år)" />
          <div className="grid-2" style={{ marginBottom: '20px' }}>
            <Stat label="Direktavkastning" value={fmtPct(result.netYield)}         sub="Netto på eget kapital"   color={sc.color}       />
            <Stat label="Bruttoyield"       value={fmtPct(result.grossYield)}       sub="Brutto på köpeskilling"                          />
            <Stat label="Exit-pris (5 år)"  value={fmtMoney(result.exitPrice)}        sub={`+${sc.annualGrowthPct}%/år`} color="var(--gold)" />
            <Stat label="Totalavkastning"   value={fmtPct(result.annualizedReturn)} sub="Annualiserat inkl. exit"  color={sc.color}       />
          </div>
          <Divider />
          <div className="exit-highlight" style={{ background: sc.color + '10', border: `1px solid ${sc.color}30`, marginTop: '16px' }}>
            <label>Total vinst efter 5 år</label>
            <p style={{ color: sc.color }}>{fmtMoney(result.totalReturn)}</p>
            <small>{fmtMoney(result.cumulativeRent)} hyra + {fmtMoney(result.saleProfit)} värdeökning (e. skatt)</small>
          </div>
        </Card>
      </div>
    </div>
  );
}
