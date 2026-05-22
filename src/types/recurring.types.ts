// ─────────────────────────────────────────────────────────────────────────────
// Återkommande utgifter — mallar som auto-genererar Expense-poster.
// ─────────────────────────────────────────────────────────────────────────────

import type { ExpenseCategory } from './database.types';

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
