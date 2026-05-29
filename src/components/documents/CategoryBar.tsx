import { DocCategory, PropertyDocument } from '../../types';
import { CATEGORIES } from './categories';

interface Props {
  docs:        PropertyDocument[];
  filterCat:   DocCategory | 'all';
  onFilter:    (cat: DocCategory | 'all') => void;
}

const PILL_BASE     = 'inline-flex items-center gap-1.5 py-1.5 px-3 min-h-[36px] rounded-[20px] border text-[12px] transition-all duration-150 whitespace-nowrap';
const PILL_ACTIVE   = 'border-gold bg-gold-faint text-gold';
const PILL_INACTIVE = 'border-border bg-bg-card text-text-mute hover:border-border-hi hover:text-text-dim';

const COUNT_BASE   = 'rounded-[10px] px-1.5 py-px text-[10px]';
const COUNT_ACTIVE = 'bg-gold/15';
const COUNT_INACTIVE = 'bg-bg-subtle';

/**
 * Pill-rad ovanför dokumentlistan: "Alla / Kontrakt 3 / Ritningar 1" osv.
 * Visas bara när användaren har dokument i fler än en kategori.
 */
export function CategoryBar({ docs, filterCat, onFilter }: Props) {
  const byCat = CATEGORIES
    .map(c => ({ ...c, count: docs.filter(d => d.category === c.key).length }))
    .filter(c => c.count > 0);

  if (byCat.length <= 1) return null;

  return (
    <div className="flex gap-1.5 flex-wrap mb-4">
      <button
        className={`${PILL_BASE} ${filterCat === 'all' ? PILL_ACTIVE : PILL_INACTIVE}`}
        onClick={() => onFilter('all')}
      >
        Alla <span className={`${COUNT_BASE} ${filterCat === 'all' ? COUNT_ACTIVE : COUNT_INACTIVE}`}>{docs.length}</span>
      </button>
      {byCat.map(c => {
        const active = filterCat === c.key;
        return (
          <button
            key={c.key}
            className={`${PILL_BASE} ${active ? PILL_ACTIVE : PILL_INACTIVE}`}
            onClick={() => onFilter(active ? 'all' : c.key)}
          >
            {c.icon} {c.label} <span className={`${COUNT_BASE} ${active ? COUNT_ACTIVE : COUNT_INACTIVE}`}>{c.count}</span>
          </button>
        );
      })}
    </div>
  );
}
