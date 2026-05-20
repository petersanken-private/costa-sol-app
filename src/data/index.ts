import { Property, RentalEntry, Expense, ScenarioConfig, UnitPreset } from '../types';

export const STORAGE_VERSION = 1;

export const STORAGE_KEYS = {
  version:    'costa-sol:version',
  properties: 'costa-sol:properties',
  rentals:    'costa-sol:rentals',
  expenses:   'costa-sol:expenses',
} as const;

export const SCENARIOS: ScenarioConfig[] = [
  { key: 'conservative', label: 'Försiktig',   nights: 160, adr: 180, annualGrowthPct: 4,  color: '#6B7280' },
  { key: 'base',         label: 'Realistisk',  nights: 220, adr: 210, annualGrowthPct: 7,  color: '#D4AA50' },
  { key: 'optimistic',   label: 'Optimistisk', nights: 270, adr: 250, annualGrowthPct: 11, color: '#10B981' },
];

export const UNIT_PRESETS: UnitPreset[] = [
  { id: 'u-2bdr', label: '2 sovrum',          bedrooms: 2, sizeSqm: 93,  terraceSqm: 35,  purchasePrice: 780000  },
  { id: 'u-3bdr', label: '3 sovrum',          bedrooms: 3, sizeSqm: 122, terraceSqm: 60,  purchasePrice: 1050000 },
  { id: 'u-4bdr', label: '4 sovrum / Penth.', bedrooms: 4, sizeSqm: 152, terraceSqm: 216, purchasePrice: 1450000 },
];

export const MONTHS_SV = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];

export const EXPENSE_LABELS: Record<string, string> = {
  management:  'Förvaltning',
  cleaning:    'Städning',
  maintenance: 'Underhåll',
  insurance:   'Försäkring',
  ibi:         'IBI-skatt',
  community:   'Community-avgift',
  mortgage:    'Bolåneränta',
  gestor:      'Gestor/Revision',
  legal:       'Juridik',
  utilities:   'El/Vatten',
  other:       'Övrigt',
};

export const STATUS_LABELS: Record<string, string> = {
  'off-plan':       'Off-plan',
  'owned':          'Ägs',
  'under-contract': 'Under kontrakt',
  'watchlist':      'Bevakas',
};

export const STATUS_COLORS: Record<string, string> = {
  'off-plan':       '#D4AA50',
  'owned':          '#10B981',
  'under-contract': '#6366F1',
  'watchlist':      '#6B7280',
};

export const PLATFORM_COLORS: Record<string, string> = {
  airbnb:      '#FF5A5F',
  booking:     '#4A90E2',
  direct:      '#D4AA50',
  'long-term': '#10B981',
};

export const SEED_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    name: 'Essence Residences 2A',
    development: 'Essence Residences',
    area: 'Cancelada',
    type: 'apartment',
    status: 'off-plan',
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 93,
    terraceSqm: 35,
    purchasePrice: 780000,
    currentValue: 820000,
    completionDate: '2027-09-01',
    rentalStrategy: 'short-term',
    hasVFTLicense: false,
    notes: 'Off-plan köp. Betalning: 30% nu, 70% vid inflyttning Q3 2027.',
  },
  {
    id: 'prop-2',
    name: 'Gamla Stan Lägenhet',
    development: 'El Presidente',
    area: 'Estepona Gamla Stan',
    type: 'apartment',
    status: 'watchlist',
    bedrooms: 2,
    bathrooms: 1,
    sizeSqm: 78,
    terraceSqm: 12,
    purchasePrice: 385000,
    currentValue: 385000,
    rentalStrategy: 'short-term',
    hasVFTLicense: true,
    notes: 'Befintlig VFT-licens inkluderad. Sydvändande takvåning.',
  },
];

export const SEED_RENTALS: RentalEntry[] = [
  { id: 'r1', propertyId: 'prop-2', year: 2025, month: 7,  nights: 28, revenue: 8400, platform: 'airbnb'  },
  { id: 'r2', propertyId: 'prop-2', year: 2025, month: 8,  nights: 30, revenue: 9300, platform: 'airbnb'  },
  { id: 'r3', propertyId: 'prop-2', year: 2025, month: 9,  nights: 20, revenue: 4800, platform: 'booking' },
  { id: 'r4', propertyId: 'prop-2', year: 2025, month: 10, nights: 14, revenue: 2940, platform: 'direct'  },
  { id: 'r5', propertyId: 'prop-2', year: 2025, month: 11, nights: 8,  revenue: 1440, platform: 'airbnb'  },
  { id: 'r6', propertyId: 'prop-2', year: 2025, month: 12, nights: 12, revenue: 2520, platform: 'booking' },
];

export const SEED_EXPENSES: Expense[] = [
  { id: 'e1', propertyId: 'prop-2', date: '2025-07-01', category: 'ibi',         amount: 1100, description: 'IBI 2025',              deductible: true },
  { id: 'e2', propertyId: 'prop-2', date: '2025-07-01', category: 'insurance',   amount: 900,  description: 'Hemförsäkring 2025',     deductible: true },
  { id: 'e3', propertyId: 'prop-2', date: '2025-07-01', category: 'community',   amount: 2400, description: 'Communidad-avgift 2025', deductible: true },
  { id: 'e4', propertyId: 'prop-2', date: '2025-07-05', category: 'management',  amount: 1512, description: 'Förvaltning juli 18%',   deductible: true },
  { id: 'e5', propertyId: 'prop-2', date: '2025-08-05', category: 'management',  amount: 1674, description: 'Förvaltning aug 18%',    deductible: true },
  { id: 'e6', propertyId: 'prop-2', date: '2025-08-10', category: 'maintenance', amount: 340,  description: 'Reparation AC-enhet',    deductible: true },
  { id: 'e7', propertyId: 'prop-2', date: '2025-09-01', category: 'gestor',      amount: 300,  description: 'Gestor Q3',              deductible: true },
];
