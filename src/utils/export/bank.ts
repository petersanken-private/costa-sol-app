import { ProspectProperty, AreaMarketData } from '../../types';
import { calcInvestment, calcBuyingCosts, calcProjection, fmtEur, fmtPct } from '../calc';
import { SCENARIOS } from '../../data';
import { TAX, BUYING_COSTS, OPERATING, MORTGAGE_DEFAULTS } from '../../constants/tax';

const DEFAULT_MORTGAGE_RATE = 0.045;

export function exportBankPdf(
  prospect: ProspectProperty,
  market: AreaMarketData | undefined,
  scenarioKey: 'conservative' | 'base' | 'optimistic' = 'base',
  horizonYears = 10,
  mortgagePct = 0,
) {
  const sc = SCENARIOS.find(s => s.key === scenarioKey)!;
  const scenarioWithMarket = market ? {
    ...sc,
    nights:          Math.round(market.occupancyPct * 3.65),
    adr:             market.avgAdr,
    annualGrowthPct: market.annualGrowthPct,
  } : sc;

  const useMortgage = mortgagePct > 0;
  const result      = calcInvestment({
    purchasePrice: prospect.purchasePrice,
    scenario:      scenarioWithMarket,
    horizonYears,
    useMortgage,
    mortgagePct,
    mortgageRate:  DEFAULT_MORTGAGE_RATE,
  });
  const costs      = calcBuyingCosts(prospect.purchasePrice);
  const projection = calcProjection({
    purchasePrice: prospect.purchasePrice,
    startYear:     new Date().getFullYear() + 1,
    horizonYears,
    scenario:      scenarioWithMarket,
    useMortgage,
    mortgagePct,
    mortgageRate:    DEFAULT_MORTGAGE_RATE,
    amortizationPct: MORTGAGE_DEFAULTS.AMORTIZATION_PCT,
    inflationPct:    MORTGAGE_DEFAULTS.INFLATION_PCT,
  });
  const today      = new Date().toLocaleDateString('sv-SE');

  const itpPct  = (BUYING_COSTS.TRANSFER_TAX_PCT  * 100).toFixed(1);
  const notPct  = (BUYING_COSTS.NOTARY_PCT        * 100).toFixed(1);
  const regPct  = (BUYING_COSTS.LAND_REGISTRY_PCT * 100).toFixed(0);
  const lawPct  = (BUYING_COSTS.LAWYER_PCT        * 100).toFixed(1);
  const mgmtPct = (OPERATING.MANAGEMENT_FEE_PCT   * 100).toFixed(0);
  const maintPct = (OPERATING.MAINTENANCE_PCT     * 100).toFixed(1);
  const taxPct   = (TAX.IRNR_EU_PCT               * 100).toFixed(0);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'DM Sans',sans-serif; font-size:10pt; color:#1a1714; background:#fff; padding:32px 40px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #b8860b; padding-bottom:16px; margin-bottom:24px; }
  .header-left h1 { font-family:'Cormorant Garamond',serif; font-size:24pt; font-weight:400; color:#b8860b; }
  .header-left p { font-size:9pt; color:#9c9088; margin-top:2px; }
  .header-right { text-align:right; font-size:9pt; color:#9c9088; }
  .section { margin-bottom:24px; }
  .section-title { font-size:8pt; letter-spacing:2px; text-transform:uppercase; color:#9c9088; margin-bottom:10px; border-bottom:1px solid #e4dfd8; padding-bottom:4px; }
  .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
  .kpi { background:#faf9f7; border:1px solid #e4dfd8; border-radius:6px; padding:12px; }
  .kpi-label { font-size:8pt; color:#9c9088; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px; }
  .kpi-value { font-family:'Cormorant Garamond',serif; font-size:18pt; font-weight:400; color:#1a1714; }
  .kpi-value.gold { color:#b8860b; }
  .kpi-value.green { color:#166534; }
  table { width:100%; border-collapse:collapse; font-size:9pt; }
  th { background:#faf9f7; padding:8px 10px; text-align:left; font-size:8pt; font-weight:500; letter-spacing:1px; text-transform:uppercase; color:#9c9088; border-bottom:1px solid #e4dfd8; }
  td { padding:8px 10px; border-bottom:1px solid #f0ede8; }
  tr:last-child td { border-bottom:none; }
  .num { text-align:right; font-variant-numeric:tabular-nums; }
  .gold { color:#b8860b; font-weight:500; }
  .green { color:#166534; }
  .red { color:#991b1b; }
  .bold { font-weight:600; }
  .row-highlight td { background:#fffbf0; font-weight:600; }
  .footer { margin-top:32px; padding-top:12px; border-top:1px solid #e4dfd8; font-size:8pt; color:#9c9088; display:flex; justify-content:space-between; }
  .disclaimer { font-size:7.5pt; color:#b0a898; margin-top:8px; }
  @media print { body { padding:16px 20px; } }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <h1>Investment Analysis</h1>
    <p>${prospect.name} · ${prospect.area}${prospect.development ? ' · ' + prospect.development : ''}</p>
  </div>
  <div class="header-right">
    <p><strong>Costa Sol Portfolio</strong></p>
    <p>Generated: ${today}</p>
    <p>Scenario: ${scenarioWithMarket.label ?? sc.label}</p>
    <p>Horizon: ${horizonYears} years</p>
  </div>
</div>

<!-- Property details -->
<div class="section">
  <p class="section-title">Property Details</p>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px">
    <div class="kpi"><div class="kpi-label">Purchase Price</div><div class="kpi-value gold">${fmtEur(prospect.purchasePrice)}</div></div>
    <div class="kpi"><div class="kpi-label">Size</div><div class="kpi-value">${prospect.sizeSqm} m²</div></div>
    <div class="kpi"><div class="kpi-label">Terrace</div><div class="kpi-value">${prospect.terraceSqm} m²</div></div>
    <div class="kpi"><div class="kpi-label">Bedrooms</div><div class="kpi-value">${prospect.bedrooms}</div></div>
    <div class="kpi"><div class="kpi-label">€/m²</div><div class="kpi-value">${prospect.sizeSqm > 0 ? fmtEur(Math.round(prospect.purchasePrice / prospect.sizeSqm)) : '—'}</div></div>
  </div>
</div>

<!-- KPIs -->
<div class="section">
  <p class="section-title">Key Metrics — Year 1</p>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-label">Gross Rental Income</div><div class="kpi-value">${fmtEur(result.grossRent)}</div></div>
    <div class="kpi"><div class="kpi-label">Net Income (after tax)</div><div class="kpi-value green">${fmtEur(result.netAfterTax)}</div></div>
    <div class="kpi"><div class="kpi-label">Net Yield</div><div class="kpi-value gold">${fmtPct(result.netYield)}</div></div>
    <div class="kpi"><div class="kpi-label">Annualised Return</div><div class="kpi-value gold">${fmtPct(result.annualizedReturn)}</div></div>
  </div>
</div>

<!-- Annual cashflow -->
<div class="section">
  <p class="section-title">Annual Cash Flow</p>
  <table>
    <tr><th>Item</th><th class="num">Amount</th></tr>
    <tr><td>Gross Rental Income (${scenarioWithMarket.nights} nights × €${scenarioWithMarket.adr}/night)</td><td class="num gold">${fmtEur(result.grossRent)}</td></tr>
    <tr><td>Management Fee (${mgmtPct}%)</td><td class="num red">−${fmtEur(result.managementFee)}</td></tr>
    <tr><td>Cleaning Costs</td><td class="num red">−${fmtEur(result.cleaningCost)}</td></tr>
    <tr><td>Fixed Costs (IBI, insurance, community, gestor)</td><td class="num red">−${fmtEur(result.fixedCosts)}</td></tr>
    <tr><td>Maintenance (${maintPct}%)</td><td class="num red">−${fmtEur(prospect.purchasePrice * OPERATING.MAINTENANCE_PCT)}</td></tr>
    ${useMortgage ? `<tr><td>Mortgage Interest (${(DEFAULT_MORTGAGE_RATE * 100).toFixed(1)}%)</td><td class="num red">−${fmtEur(result.mortgageCost)}</td></tr>` : ''}
    <tr><td><strong>Net Before Tax</strong></td><td class="num bold">${fmtEur(result.netBeforeTax)}</td></tr>
    <tr><td>IRNR Tax (${taxPct}%)</td><td class="num red">−${fmtEur(result.tax)}</td></tr>
    <tr class="row-highlight"><td><strong>Net After Tax</strong></td><td class="num gold bold">${fmtEur(result.netAfterTax)}</td></tr>
  </table>
</div>

<!-- Acquisition costs -->
<div class="section">
  <p class="section-title">Acquisition Costs</p>
  <table>
    <tr><th>Item</th><th class="num">Amount</th></tr>
    <tr><td>Purchase Price</td><td class="num">${fmtEur(prospect.purchasePrice)}</td></tr>
    <tr><td>Transfer Tax ITP (${itpPct}%)</td><td class="num">${fmtEur(costs.transferTax)}</td></tr>
    <tr><td>Notary Fees (${notPct}%)</td><td class="num">${fmtEur(costs.notary)}</td></tr>
    <tr><td>Land Registry (${regPct}%)</td><td class="num">${fmtEur(costs.landRegistry)}</td></tr>
    <tr><td>Legal Fees (${lawPct}%)</td><td class="num">${fmtEur(costs.lawyer)}</td></tr>
    <tr><td>NIE + Administration</td><td class="num">${fmtEur(costs.admin)}</td></tr>
    <tr class="row-highlight"><td><strong>Total Capital Required</strong></td><td class="num gold bold">${fmtEur(prospect.purchasePrice + costs.total)}</td></tr>
  </table>
</div>

<!-- N-year projection -->
<div class="section">
  <p class="section-title">${horizonYears}-Year Projection</p>
  <table>
    <tr><th>Year</th><th class="num">Property Value</th><th class="num">Loan Balance</th><th class="num">Net Equity</th><th class="num">Annual Net Income</th><th class="num">Cumul. Cash Flow</th><th class="num">Total Wealth</th></tr>
    ${projection.map(p => `
    <tr ${p.year === horizonYears ? 'class="row-highlight"' : ''}>
      <td>${p.calendarYear}</td>
      <td class="num gold">${fmtEur(p.propertyValue)}</td>
      <td class="num">${p.loanBalance > 0 ? '−' + fmtEur(p.loanBalance) : '—'}</td>
      <td class="num">${fmtEur(p.equity)}</td>
      <td class="num ${p.netAfterTax >= 0 ? 'green' : 'red'}">${p.netAfterTax >= 0 ? '+' : '−'}${fmtEur(Math.abs(p.netAfterTax))}</td>
      <td class="num ${p.cumulativeCashflow >= 0 ? 'green' : 'red'}">${p.cumulativeCashflow >= 0 ? '+' : '−'}${fmtEur(Math.abs(p.cumulativeCashflow))}</td>
      <td class="num gold bold">${p.totalWealth >= 0 ? '+' : '−'}${fmtEur(Math.abs(p.totalWealth))}</td>
    </tr>`).join('')}
  </table>
</div>

${market ? `
<div class="section">
  <p class="section-title">Market Data — ${market.area}</p>
  <table>
    <tr><td>Average Price/m²</td><td class="num">${fmtEur(market.pricePerSqm)}</td><td>Average ADR</td><td class="num">€${market.avgAdr}/night</td></tr>
    <tr><td>Occupancy Rate</td><td class="num">${market.occupancyPct}%  (≈${Math.round(market.occupancyPct * 3.65)} nights/year)</td><td>Annual Growth</td><td class="num green">+${market.annualGrowthPct}%/year</td></tr>
    <tr><td>Source</td><td colspan="3">${market.source} · Updated ${market.updatedAt}</td></tr>
  </table>
</div>` : ''}

<div class="footer">
  <span>Costa Sol Portfolio · ${today}</span>
  <span>Confidential — For discussion purposes only</span>
</div>
<p class="disclaimer">All figures are estimates based on market data and stated assumptions. Past performance does not guarantee future results. This document does not constitute financial advice. Always consult a Spanish gestor and legal advisor (abogado) before proceeding.</p>

<script>window.onload = () => window.print();</script>
</body></html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
}
