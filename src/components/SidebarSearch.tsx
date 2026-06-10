// ── SidebarSearch ─────────────────────────────────────────────────────────────
// Sökfält i sidofältet. Presentational: tar fastighetslistan + onSelect som props
// och hanterar bara lokal UI-state (query, öppen, markerat index). Filtrerar på
// namn/område/utveckling. Tangentbord: ↑/↓ navigerar, Enter väljer, Esc rensar.

import { useMemo, useRef, useState } from 'react';
import { Icon } from './ui/Icon';

export interface SidebarSearchItem {
  id:    string;
  name:  string;
  area:  string;
  development?: string;
}

export interface SidebarSearchProps {
  items:    SidebarSearchItem[];
  onSelect: (id: string) => void;
}

const MAX_RESULTS = 6;

export function SidebarSearch({ items, onSelect }: SidebarSearchProps) {
  const [query, setQuery]   = useState('');
  const [open,  setOpen]    = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q) ||
        (p.development?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, MAX_RESULTS);
  }, [items, query]);

  const showDropdown = open && query.trim().length > 0;

  function choose(id: string) {
    onSelect(id);
    setQuery('');
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setQuery(''); setOpen(false); return; }
    if (!matches.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => (a + 1) % matches.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => (a - 1 + matches.length) % matches.length); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(matches[Math.min(active, matches.length - 1)].id); }
  }

  return (
    <div className="relative mb-5">
      <div className="flex items-center gap-2 py-[9px] px-3 border border-border rounded-[9px] text-text-mute text-[13px] bg-bg focus-within:border-green focus-within:text-text-dim transition-colors duration-150">
        <Icon name="search" size={15} />
        <input
          type="text"
          value={query}
          placeholder="Sök fastighet, område …"
          aria-label="Sök fastighet"
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-text placeholder:text-text-mute text-[13px]"
          onChange={e => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120); }}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type="button"
            className="flex items-center text-text-mute hover:text-text transition-colors duration-150"
            aria-label="Rensa sökning"
            onMouseDown={e => e.preventDefault()}
            onClick={() => { setQuery(''); setOpen(false); }}
          >
            <Icon name="close" size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-bg-card border border-border rounded-[10px] overflow-hidden py-1"
          onMouseDown={() => clearTimeout(blurTimer.current)}
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2.5 text-[12px] text-text-mute">Inga träffar</li>
          ) : (
            matches.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`flex flex-col items-start w-full text-left px-3 py-2 transition-colors duration-150 ${
                    i === active ? 'bg-green-soft' : 'hover:bg-bg-hover'
                  }`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(p.id)}
                >
                  <span className="text-[13px] text-text font-medium leading-tight">{p.name}</span>
                  <span className="text-[11px] text-text-mute">{p.area}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
