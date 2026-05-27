import { useApp } from '../hooks/useApp';
import { useMilestones } from '../hooks/useMilestones';
import { useDisplayCurrency } from '../hooks/useDisplayCurrency';
import { useAuth } from '../hooks/useAuth';
import { PageKey } from '../types';

const NAV_ITEMS: { key: PageKey; icon: string; label: string; group: string }[] = [
  { key: 'dashboard',  icon: '▦', label: 'Dashboard',          group: 'Portfölj'  },
  { key: 'portfolio',  icon: '◈', label: 'Portfölj',           group: 'Portfölj'  },
  { key: 'milestones', icon: '🗓', label: 'Påminnelser',        group: 'Portfölj'  },
  { key: 'taxes',      icon: '⊡', label: 'Skatt',              group: 'Portfölj'  },
  { key: 'market',     icon: '◉', label: 'Marknadsdata',       group: 'Köpanalys' },
  { key: 'compare',    icon: '⊞', label: 'Jämför objekt',      group: 'Köpanalys' },
  { key: 'calculator', icon: '◎', label: 'Kalkylator',         group: 'Köpanalys' },
  { key: 'guide',      icon: '📖', label: 'Investera i Spanien', group: 'Kunskap'  },
];

const GROUPS = ['Portfölj', 'Köpanalys', 'Kunskap'];

export function Sidebar() {
  const { state, navigate, resetAllData } = useApp();
  const { urgentCount } = useMilestones();
  const { currency, rate, toggle } = useDisplayCurrency();
  const { user, signOut } = useAuth();

  function handleReset() {
    if (window.confirm('Återställ all data till seed-data? Detta går inte att ångra.')) resetAllData();
  }

  async function handleSignOut() {
    if (window.confirm('Logga ut?')) await signOut();
  }

  return (
    <aside className="hidden md:flex w-[220px] min-w-[220px] bg-white border-r border-border flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 pt-7 pb-6 border-b border-border">
        <p className="font-display text-[20px] font-semibold text-gold tracking-[0.3px]">Costa Sol</p>
        <p className="text-[10px] tracking-[2.5px] uppercase text-text-mute mt-0.5">Fastighetsportfölj</p>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 flex-1 overflow-y-auto">
        {GROUPS.map(group => (
          <div key={group} className="mb-2">
            <p className="text-[9px] tracking-[2px] uppercase text-text-mute px-3 pt-2.5 pb-1 block">
              {group}
            </p>
            {NAV_ITEMS.filter(i => i.group === group).map(item => {
              const active     = state.activePage === item.key;
              const showBadge  = item.key === 'milestones' && urgentCount > 0;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  className={[
                    'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-sm border-none text-[13px] text-left transition-all duration-150 mb-0.5',
                    active
                      ? 'bg-gold-faint text-gold font-medium'
                      : 'bg-transparent text-text-dim font-normal hover:bg-bg-hover hover:text-text',
                  ].join(' ')}
                >
                  <span className={`text-[14px] flex-shrink-0 ${active ? 'opacity-100' : 'opacity-60'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {showBadge && (
                    <span className="ml-auto bg-red text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-pill leading-none">
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
          onClick={toggle}
          title={`Växla till ${currency === 'EUR' ? 'SEK' : 'EUR'} (1€ = ${rate.toFixed(2)} kr)`}
        >
          <CurrencyPill label="EUR" active={currency === 'EUR'} />
          <CurrencyPill label="SEK" active={currency === 'SEK'} />
        </button>
        <p className="text-[10px] text-text-mute mb-2">
          {new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })}
        </p>
        {user && (
          <p className="text-[11px] text-text-mute mb-2 text-center">{user.email}</p>
        )}
        <button
          className="bg-transparent border-none p-0 text-[10px] text-border-hi transition-colors duration-150 hover:text-red block"
          onClick={handleReset}
        >
          ↺ Återställ data
        </button>
        <button
          className="bg-transparent border-none p-0 text-[10px] text-border-hi transition-colors duration-150 hover:text-red block mt-1.5"
          onClick={handleSignOut}
        >
          → Logga ut
        </button>
      </div>
    </aside>
  );
}

/** Återanvänds av MobileCurrencyToggle i App.tsx. */
function CurrencyPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={[
      'flex-1 text-[10px] font-medium tracking-[1px] py-1 px-2.5 rounded-pill transition-all duration-150',
      active ? 'bg-gold text-bg' : 'text-text-mute',
    ].join(' ')}>
      {label}
    </span>
  );
}

export { CurrencyPill };
