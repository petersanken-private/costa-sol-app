// ─────────────────────────────────────────────────────────────────────────────
// Bolån + ränteperioder.
// ─────────────────────────────────────────────────────────────────────────────

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
