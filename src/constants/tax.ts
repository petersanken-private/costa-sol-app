// ── Spanska skattesatser och köpkostnader (Andalusien) ─────────────────────────
// Källa: AEAT + Junta de Andalucía 2025/2026
// Uppdatera här när reglerna ändras — samtliga kalkyler läser från denna fil.

export const TAX = {
  /** IRNR — Impuesto sobre la Renta de no Residentes. EU/EEA-bosatta. */
  IRNR_EU_PCT: 0.19,
  /** IRNR — icke-EU-bosatta (inga avdrag tillåtna). */
  IRNR_NON_EU_PCT: 0.24,
  /** Kapitalvinstskatt vid försäljning (samma sats som IRNR EU). */
  CAPITAL_GAINS_PCT: 0.19,
  /** Retención: 3% innehållning av köpare vid försäljning från non-resident. */
  RETENCION_PCT: 0.03,
} as const;

export const BUYING_COSTS = {
  /** ITP — Impuesto de Transmisiones Patrimoniales (andrahandsobjekt). */
  TRANSFER_TAX_PCT: 0.07,
  /** AJD — Actos Jurídicos Documentados (nybyggt, ersätter ITP). */
  STAMP_DUTY_PCT: 0.012,
  /** IVA på nybyggda objekt (ersätter ITP). */
  VAT_NEW_BUILD_PCT: 0.10,
  /** Notarie. */
  NOTARY_PCT: 0.005,
  /** Lagfart (Registro de la Propiedad). */
  LAND_REGISTRY_PCT: 0.01,
  /** Advokat. */
  LAWYER_PCT: 0.015,
  /** Fast administrativ avgift (gestor m.m.). */
  ADMIN_FEE_EUR: 500,
} as const;

export const OPERATING = {
  /** Förvaltningsbolagets fee på bruttohyra (typiskt 15–22% Costa del Sol). */
  MANAGEMENT_FEE_PCT: 0.18,
  /** Städning per natt (€). */
  CLEANING_PER_NIGHT_EUR: 55,
  /** Schablon årligt underhåll som % av köpeskilling. */
  MAINTENANCE_PCT: 0.004,
  /** Default fasta årskostnader (€). Bryts ut för Calculator-defaultvärden. */
  DEFAULT_FIXED: {
    INSURANCE_EUR: 900,
    IBI_EUR: 1100,
    COMMUNITY_EUR: 2400,
    GESTOR_EUR: 1200,
  },
  /** Total schablon fasta årskostnader. */
  get DEFAULT_FIXED_TOTAL_EUR(): number {
    const f = this.DEFAULT_FIXED;
    return f.INSURANCE_EUR + f.IBI_EUR + f.COMMUNITY_EUR + f.GESTOR_EUR;
  },
} as const;

export const MORTGAGE_DEFAULTS = {
  /** Default amortering per år (% av ursprungligt lån). */
  AMORTIZATION_PCT: 2,
  /** Default kostnadsinflation per år. */
  INFLATION_PCT: 2,
  /** Max årlig hyrestillväxt som tillämpas (cap för att inte skena). */
  RENT_GROWTH_CAP_PCT: 5,
} as const;
