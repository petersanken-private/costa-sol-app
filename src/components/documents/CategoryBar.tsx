import { DocCategory, PropertyDocument } from '../../types';
import { CATEGORIES } from './categories';

interface Props {
  docs:        PropertyDocument[];
  filterCat:   DocCategory | 'all';
  onFilter:    (cat: DocCategory | 'all') => void;
}

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
    <div className="doc-cat-bar">
      <button
        className={`doc-cat-pill ${filterCat === 'all' ? 'doc-cat-pill--active' : ''}`}
        onClick={() => onFilter('all')}
      >
        Alla <span className="doc-cat-count">{docs.length}</span>
      </button>
      {byCat.map(c => (
        <button
          key={c.key}
          className={`doc-cat-pill ${filterCat === c.key ? 'doc-cat-pill--active' : ''}`}
          onClick={() => onFilter(filterCat === c.key ? 'all' : c.key)}
        >
          {c.icon} {c.label} <span className="doc-cat-count">{c.count}</span>
        </button>
      ))}
    </div>
  );
}
