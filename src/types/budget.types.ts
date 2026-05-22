// ─────────────────────────────────────────────────────────────────────────────
// Årsbudget per fastighet — jämförs mot faktiska rentals/expenses.
// ─────────────────────────────────────────────────────────────────────────────

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
