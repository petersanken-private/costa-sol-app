import { MilestoneCategory } from '../../types';

export interface MilestoneCategoryInfo {
  key:   MilestoneCategory;
  label: string;
  icon:  string;
}

export const MILESTONE_CATS: MilestoneCategoryInfo[] = [
  { key: 'payment',    label: 'Betalningsetapp', icon: '💶' },
  { key: 'completion', label: 'Inflyttning',     icon: '🏠' },
  { key: 'vft',        label: 'VFT-licens',      icon: '📜' },
  { key: 'tax',        label: 'Skatt/Modelo',    icon: '🧾' },
  { key: 'inspection', label: 'Besiktning',      icon: '🔍' },
  { key: 'legal',      label: 'Juridisk',        icon: '⚖️' },
  { key: 'bank',       label: 'Bank',            icon: '🏦' },
  { key: 'renovation', label: 'Renovering',      icon: '🔨' },
  { key: 'rental',     label: 'Uthyrning',       icon: '🛏'  },
  { key: 'other',      label: 'Övrigt',          icon: '📌' },
];

export function catInfo(key: MilestoneCategory): MilestoneCategoryInfo {
  return MILESTONE_CATS.find(c => c.key === key) ?? MILESTONE_CATS[MILESTONE_CATS.length - 1];
}
