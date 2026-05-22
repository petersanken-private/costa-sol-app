// ─────────────────────────────────────────────────────────────────────────────
// Database row types — speglar Supabase-tabellerna properties, rentals,
// expenses och property_documents. Underliggande enum-typer ligger här eftersom
// de är intimt kopplade till hur DB-fälten är begränsade.
// ─────────────────────────────────────────────────────────────────────────────

export type PropertyStatus   = 'off-plan' | 'owned' | 'under-contract' | 'watchlist';
export type PropertyType     = 'apartment' | 'penthouse' | 'villa' | 'townhouse';
export type RentalStrategy   = 'short-term' | 'mid-term' | 'long-term' | 'mixed';
export type RentalPlatform   = 'airbnb' | 'booking' | 'direct' | 'long-term';

export type ExpenseCategory  =
  | 'management' | 'cleaning' | 'maintenance' | 'insurance'
  | 'ibi' | 'community' | 'mortgage' | 'gestor' | 'legal' | 'utilities' | 'other';

export type DocCategory =
  | 'contract'      // Köpekontrakt / Reservation
  | 'floor_plan'    // Planritning
  | 'inspection'    // Besiktning
  | 'vft_license'   // VFT-licens
  | 'tax'           // Skattehandling / Modelo
  | 'insurance'     // Försäkring
  | 'bank'          // Bankrelaterat
  | 'other';        // Övrigt

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
