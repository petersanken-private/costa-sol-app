// ── Kassaflödesprognos ────────────────────────────────────────────────────────

export interface ForecastMonth {
  year:               number;
  month:              number;        // 1-12
  label:              string;        // "Jan 2026"
  isPast:             boolean;       // historisk månad (faktisk data)
  isCurrent:          boolean;       // pågående månad
  rentalIncome:       number;        // EUR
  recurringExpenses:  number;        // EUR
  mortgageInterest:   number;        // EUR (för bolåneräntor)
  mortgageAmort:      number;        // EUR (för amortering)
  oneOffExpenses:     number;        // EUR (faktiska expenses)
  taxPayment:         number;        // EUR (kvartalsvis Modelo 210)
  netCashflow:        number;        // EUR (inflöde − utflöde)
  balanceEnd:         number;        // EUR (kumulativt saldo)
}

export interface ForecastSummary {
  startBalance:       number;
  totalIncome:        number;
  totalExpenses:      number;
  totalNet:           number;
  endBalance:         number;
  minBalance:         number;       // lägsta saldot under perioden
  minBalanceMonth?:   string;       // när det inträffar
}

export interface ForecastConfig {
  /** Startdatum för prognosen (default: idag). */
  startDate:          string;       // ISO date
  /** Antal månader framåt. Default 12. */
  horizonMonths:      number;
  /** Användarens manuella startsaldo i banken (EUR). */
  startBalance:       number;
  /** Filtrera på enskild fastighet, eller 'all'. */
  propertyId:         string | 'all';
}
