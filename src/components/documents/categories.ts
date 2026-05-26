import { DocCategory } from '../../types';

export interface CategoryInfo {
  key:   DocCategory;
  label: string;
  icon:  string;
}

export const CATEGORIES: CategoryInfo[] = [
  { key: 'contract',   label: 'Köpekontrakt',  icon: '📋' },
  { key: 'floor_plan', label: 'Planritning',   icon: '📐' },
  { key: 'inspection', label: 'Besiktning',    icon: '🔍' },
  { key: 'vft_license',label: 'VFT-licens',    icon: '📜' },
  { key: 'tax',        label: 'Skatt/Modelo',  icon: '🧾' },
  { key: 'insurance',  label: 'Försäkring',    icon: '🛡️' },
  { key: 'bank',       label: 'Bank',          icon: '🏦' },
  { key: 'other',      label: 'Övrigt',        icon: '📁' },
];

export function catInfo(key: DocCategory): CategoryInfo {
  return CATEGORIES.find(c => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function fmtSize(bytes: number): string {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Gissa rätt kategori baserat på filnamn. */
export function guessCategory(filename: string): DocCategory {
  const name = filename.toLowerCase();
  if (name.includes('kontrakt') || name.includes('contract')) return 'contract';
  if (name.includes('ritning')  || name.includes('plan'))     return 'floor_plan';
  if (name.includes('besiktning'))                            return 'inspection';
  if (name.includes('vft') || name.includes('licens'))        return 'vft_license';
  if (name.includes('modelo') || name.includes('skatt'))      return 'tax';
  if (name.includes('försäkring') || name.includes('insurance')) return 'insurance';
  if (name.includes('bank') || name.includes('lån'))          return 'bank';
  return 'contract';
}
