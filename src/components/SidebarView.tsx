// ════════════════════════════════════════════════════════════════════════════
// SidebarView — presentational sidebar (Tailwind)
//
// Tar all data + callbacks som props. Ingen hook-användning här.
// Detta gör att Playwright/Styleguide kan rendera den utan auth/providers.
//
// Container-komponenten Sidebar.tsx anropar hooks och delegerar till denna.
// ════════════════════════════════════════════════════════════════════════════

import { PageKey } from '../types';
import { Icon, IconName } from './ui/Icon';
import { SidebarSearch, SidebarSearchItem } from './SidebarSearch';

export interface SidebarViewProps {
  activePage:        PageKey;
  urgentCount:       number;
  currency:          'EUR' | 'SEK';
  rate:              number;
  userEmail?:        string;
  searchItems:       SidebarSearchItem[];
  onNavigate:        (page: PageKey) => void;
  onSelectProperty:  (id: string) => void;
  onToggleCurrency:  () => void;
  onReset:           () => void;
  onSignOut:         () => void;
}

const NAV_ITEMS: { key: PageKey; icon: IconName; label: string; group: string }[] = [
  { key: 'dashboard',  icon: 'grid',     label: 'Dashboard',           group: 'Portfölj'  },
  { key: 'portfolio',  icon: 'layers',   label: 'Portfölj',            group: 'Portfölj'  },
  { key: 'calendar',   icon: 'calendar', label: 'Kalender',            group: 'Portfölj'  },
  { key: 'milestones', icon: 'bell',     label: 'Påminnelser',         group: 'Portfölj'  },
  { key: 'taxes',      icon: 'receipt',  label: 'Skatt',               group: 'Portfölj'  },
  { key: 'market',     icon: 'chart',    label: 'Marknadsdata',        group: 'Köpanalys' },
  { key: 'compare',    icon: 'compare',  label: 'Jämför objekt',       group: 'Köpanalys' },
  { key: 'calculator', icon: 'calc',     label: 'Kalkylator',          group: 'Köpanalys' },
  { key: 'guide',      icon: 'book',     label: 'Investera i Spanien', group: 'Kunskap'  },
];

const GROUPS = ['Portfölj', 'Köpanalys', 'Kunskap'];

const NAV_BTN_BASE     = 'relative flex items-center gap-2.5 w-full py-2 px-2.5 rounded-[8px] border-0 text-[13.5px] text-left transition-all duration-150 mb-px';
const NAV_BTN_INACTIVE = 'bg-transparent text-text-dim font-normal hover:bg-bg-hover hover:text-text';
const NAV_BTN_ACTIVE   = 'bg-green-soft text-green font-semibold';

const RESET_BTN = 'bg-transparent border-0 p-0 text-[10px] text-border-hi transition-colors duration-150 hover:text-red text-left';

export function SidebarView({
  activePage, urgentCount, currency, rate, userEmail, searchItems,
  onNavigate, onSelectProperty, onToggleCurrency, onReset, onSignOut,
}: SidebarViewProps) {
  return (
    <aside className="hidden md:flex w-[248px] min-w-[248px] bg-bg-card border-r border-border flex-col h-screen sticky top-0 px-[18px] pt-[26px] pb-4">
      {/* Brand */}
      <div className="flex items-center gap-[11px] px-1.5 pb-[22px]">
        <span className="w-[38px] h-[38px] rounded-[9px] bg-green text-white font-display font-medium text-[17px] flex items-center justify-center tracking-[0.5px]">
          CS
        </span>
        <span>
          <span className="block font-display text-[19px] font-medium text-text leading-none">Costa Sol</span>
          <span className="block text-[10px] tracking-[2px] uppercase text-text-mute mt-[3px]">Fastighetsportfölj</span>
        </span>
      </div>

      {/* Sök fastighet */}
      <SidebarSearch items={searchItems} onSelect={onSelectProperty} />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto">
        {GROUPS.map(group => (
          <div key={group} className="mb-[18px]">
            <p className="text-[10px] tracking-[1.8px] uppercase text-text-mute px-2 pb-2">{group}</p>
            {NAV_ITEMS.filter(i => i.group === group).map(item => {
              const active    = activePage === item.key;
              const showBadge = item.key === 'milestones' && urgentCount > 0;
              return (
                <button
                  key={item.key}
                  className={`${NAV_BTN_BASE} ${active ? NAV_BTN_ACTIVE : NAV_BTN_INACTIVE}`}
                  onClick={() => onNavigate(item.key)}
                >
                  {active && (
                    <span className="absolute -left-[18px] top-[7px] bottom-[7px] w-[3px] rounded-[2px] bg-green" />
                  )}
                  <span className={`flex-shrink-0 flex ${active ? 'opacity-100' : 'opacity-70'}`}>
                    <Icon name={item.icon} size={17} />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-pill bg-red text-white text-[10px] font-bold leading-none">
                      {urgentCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-border">
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
      active ? 'bg-green text-bg' : 'text-text-mute',
    ].join(' ')}>
      {label}
    </span>
  );
}
