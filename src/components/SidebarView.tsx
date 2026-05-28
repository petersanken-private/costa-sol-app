// ════════════════════════════════════════════════════════════════════════════
// SidebarView — presentational sidebar (Tailwind)
//
// Tar all data + callbacks som props. Ingen hook-användning här.
// Detta gör att Playwright/Styleguide kan rendera den utan auth/providers.
//
// Container-komponenten Sidebar.tsx anropar hooks och delegerar till denna.
// ════════════════════════════════════════════════════════════════════════════

import { PageKey } from '../types';

export interface SidebarViewProps {
  activePage:       PageKey;
  urgentCount:      number;
  currency:         'EUR' | 'SEK';
  rate:             number;
  userEmail?:       string;
  onNavigate:       (page: PageKey) => void;
  onToggleCurrency: () => void;
  onReset:          () => void;
  onSignOut:        () => void;
}

const NAV_ITEMS: { key: PageKey; icon: string; label: string; group: string }[] = [
  { key: 'dashboard',  icon: '▦', label: 'Dashboard',           group: 'Portfölj'  },
  { key: 'portfolio',  icon: '◈', label: 'Portfölj',            group: 'Portfölj'  },
  { key: 'milestones', icon: '🗓', label: 'Påminnelser',         group: 'Portfölj'  },
  { key: 'taxes',      icon: '⊡', label: 'Skatt',               group: 'Portfölj'  },
  { key: 'market',     icon: '◉', label: 'Marknadsdata',        group: 'Köpanalys' },
  { key: 'compare',    icon: '⊞', label: 'Jämför objekt',       group: 'Köpanalys' },
  { key: 'calculator', icon: '◎', label: 'Kalkylator',          group: 'Köpanalys' },
  { key: 'guide',      icon: '📖', label: 'Investera i Spanien', group: 'Kunskap'  },
];

const GROUPS = ['Portfölj', 'Köpanalys', 'Kunskap'];

const NAV_BTN_BASE     = 'flex items-center gap-2.5 w-full py-2.5 px-3 rounded-[6px] border-0 text-[13px] text-left transition-all duration-150 mb-0.5';
const NAV_BTN_INACTIVE = 'bg-transparent text-text-dim font-normal hover:bg-bg-hover hover:text-text';
const NAV_BTN_ACTIVE   = 'bg-gold-faint text-gold font-medium';

const RESET_BTN = 'bg-transparent border-0 p-0 text-[10px] text-border-hi transition-colors duration-150 hover:text-red text-left';

export function SidebarView({
  activePage, urgentCount, currency, rate, userEmail,
  onNavigate, onToggleCurrency, onReset, onSignOut,
}: SidebarViewProps) {
  return (
    <aside className="hidden md:flex w-[220px] min-w-[220px] bg-white border-r border-border flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 pt-7 pb-6 border-b border-border">
        <p className="font-display text-[20px] font-semibold text-gold tracking-[0.3px]">Costa Sol</p>
        <p className="text-[10px] tracking-[2.5px] uppercase text-text-mute mt-[3px]">Fastighetsportfölj</p>
      </div>

      {/* Nav */}
      <nav className="py-4 px-3 flex-1 overflow-y-auto">
        {GROUPS.map(group => (
          <div key={group} className="mb-2">
            <p className="text-[9px] tracking-[2px] uppercase text-text-mute pt-2.5 px-3 pb-1 block">{group}</p>
            {NAV_ITEMS.filter(i => i.group === group).map(item => {
              const active    = activePage === item.key;
              const showBadge = item.key === 'milestones' && urgentCount > 0;
              return (
                <button
                  key={item.key}
                  className={`${NAV_BTN_BASE} ${active ? NAV_BTN_ACTIVE : NAV_BTN_INACTIVE}`}
                  onClick={() => onNavigate(item.key)}
                >
                  <span className={`text-[14px] flex-shrink-0 ${active ? 'opacity-100' : 'opacity-60'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {showBadge && (
                    <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-pill bg-red text-white text-[10px] font-semibold leading-none">
                      {urgentCount}
                    </span>
                  )}
                  {active && !showBadge && (
                    <span className="ml-auto w-1 h-1 rounded-full bg-gold" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <button
          className="flex bg-transparent border border-border rounded-pill p-0.5 mb-2.5 w-full cursor-pointer transition-colors duration-150 hover:border-border-hi"
          onClick={onToggleCurrency}
          title={`Växla till ${currency === 'EUR' ? 'SEK' : 'EUR'} (1€ = ${rate.toFixed(2)} kr)`}
        >
          <CurrencyPill label="EUR" active={currency === 'EUR'} />
          <CurrencyPill label="SEK" active={currency === 'SEK'} />
        </button>
        <p className="text-[10px] text-text-mute mb-2">
          {new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })}
        </p>
        {userEmail && (
          <p className="text-[11px] text-text-mute mb-2 text-center">
            Inloggad: {userEmail}
          </p>
        )}
        <button className={`${RESET_BTN} block`} onClick={onReset}>↺ Återställ data</button>
        <button className={`${RESET_BTN} block mt-1.5`} onClick={onSignOut}>→ Logga ut</button>
      </div>
    </aside>
  );
}

/** Återanvänds av MobileCurrencyToggle i App.tsx. */
export function CurrencyPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={[
      'flex-1 text-[10px] font-medium tracking-[1px] py-1 px-2.5 rounded-pill transition-all duration-150',
      active ? 'bg-gold text-bg' : 'text-text-mute',
    ].join(' ')}>
      {label}
    </span>
  );
}
