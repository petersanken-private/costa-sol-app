// ── Hjälpfunktioner för Kalkylatorn ───────────────────────────────────────────
//
// Rena funktioner som bygger rad-arrayer för CashflowTab och CostsTab.
// Extraherade från Calculator.tsx för att hålla komponenten under 150 rader.

import { calcInvestment, fmtMoney, BuyingCostBreakdown } from './calc.utils';
import { OPERATING } from '../constants/tax';
import type { CashflowRow } from '../components/calculator/CashflowTab';
import type { BuyingCostRow } from '../components/calculator/CostsTab';

export function buildCashflowRows(
  result:          ReturnType<typeof calcInvestment>,
  nights:          number,
  purchasePrice:   number,
  useMortgage:     boolean,
  mortgageRatePct: number,
): CashflowRow[] {
  return [
    { label: 'Bruttohyresintäkt',                         value:  result.grossRent,    isIncome: true },
    { label: 'Förvaltningsavgift (18%)',                   value: -result.managementFee               },
    { label: `Städning (€55 × ${nights} nätter)`,         value: -result.cleaningCost                },
    { label: 'IBI + Försäkring + Community + Gestor',     value: -result.fixedCosts                  },
    {
      label: `Underhåll (${(OPERATING.MAINTENANCE_PCT * 100).toFixed(1)}% × ${fmtMoney(purchasePrice)})`,
      value: -(purchasePrice * OPERATING.MAINTENANCE_PCT),
    },
    ...(useMortgage
      ? [{ label: `Bolåneränta (${mortgageRatePct}%)`, value: -result.mortgageCost }]
      : []),
    { label: 'Nettoinkomst f. skatt',  value:  result.netBeforeTax, isNet:   true },
    { label: 'IRNR-skatt (19% på netto)', value: -result.tax                      },
    { label: 'Netto e. skatt',         value:  result.netAfterTax,  isFinal: true },
  ];
}

export function buildBuyingCostRows(
  purchasePrice: number,
  costs:         BuyingCostBreakdown,
): BuyingCostRow[] {
  return [
    { label: 'Köpeskilling',             value: purchasePrice,               note: '',                         bold: false, highlight: false },
    { label: 'Transferskatt ITP (7%)',   value: costs.transferTax,           note: 'Andalusien, nyproduktion', bold: false, highlight: false },
    { label: 'Notarieavgifter (0.5%)',   value: costs.notary,                note: 'Obligatorisk',             bold: false, highlight: false },
    { label: 'Lantmäteri/stämpel (1%)',  value: costs.landRegistry,          note: '',                         bold: false, highlight: false },
    { label: 'Advokat (1.5%)',           value: costs.lawyer,                note: 'Rekommenderas',            bold: false, highlight: false },
    { label: 'NIE + administration',     value: costs.admin,                 note: 'Engångskostnad',           bold: false, highlight: false },
    { label: 'Totala köpomkostnader',    value: costs.total,                 note: '≈ 12%',                    bold: true,  highlight: false },
    { label: 'TOTAL KAPITALINSATS',      value: purchasePrice + costs.total, note: '',                         bold: true,  highlight: true  },
  ];
}
