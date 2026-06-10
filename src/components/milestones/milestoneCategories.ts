import { MilestoneCategory } from '../../types';
import type { IconName } from '../ui';

export interface MilestoneCategoryInfo {
  key:   MilestoneCategory;
  label: string;
  icon:  IconName;
}

export const MILESTONE_CATS: MilestoneCategoryInfo[] = [
  { key: 'payment',    label: 'Betalningsetapp', icon: 'coins'   },
  { key: 'completion', label: 'Inflyttning',     icon: 'home'    },
  { key: 'vft',        label: 'VFT-licens',      icon: 'scroll'  },
  { key: 'tax',        label: 'Skatt/Modelo',    icon: 'receipt' },
  { key: 'inspection', label: 'Besiktning',      icon: 'search'  },
  { key: 'legal',      label: 'Juridisk',        icon: 'scale'   },
  { key: 'bank',       label: 'Bank',            icon: 'bank'    },
  { key: 'renovation', label: 'Renovering',      icon: 'hammer'  },
  { key: 'rental',     label: 'Uthyrning',       icon: 'bed'     },
  { key: 'other',      label: 'Övrigt',          icon: 'pin'     },
];

export function catInfo(key: MilestoneCategory): MilestoneCategoryInfo {
  return MILESTONE_CATS.find(c => c.key === key) ?? MILESTONE_CATS[MILESTONE_CATS.length - 1];
}
