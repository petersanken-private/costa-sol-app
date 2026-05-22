// ─────────────────────────────────────────────────────────────────────────────
// iCal-import — feed-URL:er från Airbnb/Booking och deras importstatus.
// ─────────────────────────────────────────────────────────────────────────────

import type { RentalPlatform } from './database.types';

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
