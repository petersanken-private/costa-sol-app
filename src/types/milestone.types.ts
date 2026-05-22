// ─────────────────────────────────────────────────────────────────────────────
// Milstolpar / påminnelser — betalningsetapper, VFT-licens-deadlines etc.
// ─────────────────────────────────────────────────────────────────────────────

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
