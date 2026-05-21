export type PropertyStatus   = 'off-plan' | 'owned' | 'under-contract' | 'watchlist';
export type PropertyType     = 'apartment' | 'penthouse' | 'villa' | 'townhouse';
export type RentalStrategy   = 'short-term' | 'mid-term' | 'long-term' | 'mixed';
export type ScenarioKey      = 'conservative' | 'base' | 'optimistic';
export type ExpenseCategory  =
  | 'management' | 'cleaning' | 'maintenance' | 'insurance'
  | 'ibi' | 'community' | 'mortgage' | 'gestor' | 'legal' | 'utilities' | 'other';
export type RentalPlatform   = 'airbnb' | 'booking' | 'direct' | 'long-term';
export type PageKey          = 'dashboard' | 'portfolio' | 'calculator' | 'taxes' | 'property' | 'market' | 'compare' | 'milestones' | 'guide';

export interface Property {
  id:              string;
  name:            string;
  development:     string;
  area:            string;
  type:            PropertyType;
  status:          PropertyStatus;
  bedrooms:        number;
  bathrooms:       number;
  sizeSqm:         number;
  terraceSqm:      number;
  purchasePrice:   number;
  currentValue:    number;
  purchaseDate?:   string;
  completionDate?: string;
  rentalStrategy:  RentalStrategy;
  hasVFTLicense:   boolean;
  notes?:          string;
}

export interface RentalEntry {
  id:         string;
  propertyId: string;
  year:       number;
  month:      number;
  nights:     number;
  revenue:    number;
  platform:   RentalPlatform;
  notes?:     string;
}

export interface Expense {
  id:          string;
  propertyId:  string;
  date:        string;
  category:    ExpenseCategory;
  amount:      number;
  description: string;
  deductible:  boolean;
}

export interface ScenarioConfig {
  key:              ScenarioKey;
  label:            string;
  nights:           number;
  adr:              number;
  annualGrowthPct:  number;
  color:            string;
}

export interface CalcResult {
  grossRent:        number;
  managementFee:    number;
  cleaningCost:     number;
  fixedCosts:       number;
  mortgageCost:     number;
  totalOpex:        number;
  netBeforeTax:     number;
  tax:              number;
  netAfterTax:      number;
  grossYield:       number;
  netYield:         number;
  equity:           number;
  exitPrice:        number;
  capitalGain:      number;
  capitalGainsTax:  number;
  saleProfit:       number;
  cumulativeRent:   number;
  totalReturn:      number;
  annualizedReturn: number;
}

export interface UnitPreset {
  id:           string;
  label:        string;
  bedrooms:     number;
  sizeSqm:      number;
  terraceSqm:   number;
  purchasePrice: number;
}

// ── Marknadsdata per område ───────────────────────────────────────────────────

export interface AreaMarketData {
  id:              string;
  area:            string;        // t.ex. "Cancelada", "Estepona Gamla Stan"
  pricePerSqm:     number;        // €/kvm
  avgAdr:          number;        // Snitt-ADR €/natt
  occupancyPct:    number;        // Beläggning % (0-100)
  annualGrowthPct: number;        // Historisk prisutveckling %/år
  source:          string;        // "Idealista mars 2025"
  updatedAt:       string;        // ISO date
  notes?:          string;
}

// ── Objektjämförelse ─────────────────────────────────────────────────────────

export interface ProspectProperty {
  id:            string;
  name:          string;
  area:          string;
  type:          PropertyType;
  bedrooms:      number;
  sizeSqm:       number;
  terraceSqm:    number;
  purchasePrice: number;
  floor?:        string;
  development?:  string;
  link?:         string;          // Idealista-länk
  notes?:        string;
}

// ── Dokument ──────────────────────────────────────────────────────────────────
export type DocCategory =
  | 'contract'      // Köpekontrakt / Reservation
  | 'floor_plan'    // Planritning
  | 'inspection'    // Besiktning
  | 'vft_license'   // VFT-licens
  | 'tax'           // Skattehandling / Modelo
  | 'insurance'     // Försäkring
  | 'bank'          // Bankrelaterat
  | 'other';        // Övrigt

export interface PropertyDocument {
  id:          string;
  propertyId:  string;
  name:        string;
  category:    DocCategory;
  storagePath: string;
  sizeBytes:   number;
  uploadedAt:  string;
  notes?:      string;
}

// ── Återkommande utgifter (Etapp 3) ───────────────────────────────────────────
export type RecurringFrequency = 'monthly' | 'quarterly' | 'yearly';

export interface RecurringExpense {
  id:                  string;
  propertyId:          string;
  category:            ExpenseCategory;
  description:         string;
  amount:              number;
  frequency:           RecurringFrequency;
  startDate:           string;          // ISO YYYY-MM-DD
  endDate?:            string;
  dayOfMonth:          number;          // 1-28
  monthOfYear?:        number;          // 1-12, för yearly
  deductible:          boolean;
  lastGeneratedDate?:  string;
  active:              boolean;
  notes?:              string;
}

// ── Bolån (Etapp 3) ───────────────────────────────────────────────────────────
export type AmortizationType = 'annuity' | 'linear' | 'interest_only';
export type RateType         = 'fixed' | 'variable';

export interface Mortgage {
  id:               string;
  propertyId:       string;
  bankName:         string;
  originalAmount:   number;             // €
  startDate:        string;             // ISO
  termYears:        number;
  amortizationType: AmortizationType;
  currentBalance?:  number;             // null = beräknas
  notes?:           string;
}

export interface MortgageRatePeriod {
  id:          string;
  mortgageId:  string;
  startDate:   string;
  endDate?:    string;
  ratePct:     number;                  // 4.5 = 4.5%
  rateType:    RateType;
  notes?:      string;
}

// ── Budget vs faktiskt (Etapp 3) ──────────────────────────────────────────────
export interface Budget {
  id:                   string;
  propertyId:           string;
  year:                 number;
  expectedRevenue:      number;
  expectedNights:       number;
  expectedManagement:   number;
  expectedCleaning:     number;
  expectedFixed:        number;
  expectedMaintenance:  number;
  expectedOther:        number;
  notes?:               string;
}

// ── iCal-import ───────────────────────────────────────────────────────────────
export interface RentalSource {
  id:               string;
  propertyId:       string;
  platform:         RentalPlatform;
  feedUrl:          string;
  displayName:      string;
  defaultRate:      number;            // €/natt fallback om feed saknar pris
  active:           boolean;
  lastImportedAt?:  string;
  lastStatus?:      'success' | 'error';
  lastError?:       string;
  bookingsImported: number;
}

// ── AI-rådgivning ─────────────────────────────────────────────────────────────
export type AIPreset =
  | 'rank-prospects'
  | 'portfolio-summary'
  | 'cost-anomalies'
  | 'next-quarter'
  | 'property-deepdive'
  | 'custom';

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

// ── Påminnelser & milstolpar ──────────────────────────────────────────────────
export type MilestoneCategory =
  | 'payment'       // Betalningsetapp
  | 'completion'    // Inflyttning / leverans
  | 'legal'         // Juridisk deadline (NIE, kontraktssignering)
  | 'tax'           // Skatteinlämning (Modelo 210 etc.)
  | 'vft'           // VFT-licens ansökan / förnyelse
  | 'inspection'    // Besiktning / överlämning
  | 'renovation'    // Renovering / möblering
  | 'rental'        // Hyresrelaterat (first booking, etc.)
  | 'bank'          // Bankärende
  | 'other';

export type MilestonePriority = 'high' | 'medium' | 'low';
export type MilestoneStatus   = 'upcoming' | 'done' | 'overdue' | 'snoozed';

export interface Milestone {
  id:           string;
  propertyId:   string;          // '' = global / ej kopplad
  title:        string;
  category:     MilestoneCategory;
  priority?:    MilestonePriority;
  dueDate:      string;          // ISO date YYYY-MM-DD
  status:       MilestoneStatus;
  amount?:      number;          // belopp om det är en betalning
  notes?:       string;
  completedAt?: string;
  createdAt?:   string;
}
