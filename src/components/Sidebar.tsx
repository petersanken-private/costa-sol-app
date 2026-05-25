import { useApp } from '../hooks/useApp';
import { useMilestones } from '../hooks/useMilestones';
import { useDisplayCurrency } from '../hooks/useDisplayCurrency';
import { useAuth } from '../hooks/useAuth';
import { PageKey } from '../types';

const NAV_ITEMS: { key: PageKey; icon: string; label: string; group: string }[] = [
  { key: 'dashboard',  icon: '▦', label: 'Dashboard',     group: 'Portfölj'  },
  { key: 'portfolio',  icon: '◈', label: 'Portfölj',      group: 'Portfölj'  },
  { key: 'milestones', icon: '🗓', label: 'Påminnelser',   group: 'Portfölj'  },
  { key: 'taxes',      icon: '⊡', label: 'Skatt',         group: 'Portfölj'  },
  { key: 'market',     icon: '◉', label: 'Marknadsdata',  group: 'Köpanalys' },
  { key: 'compare',    icon: '⊞', label: 'Jämför objekt', group: 'Köpanalys' },
  { key: 'calculator', icon: '◎', label: 'Kalkylator',    group: 'Köpanalys' },
  { key: 'guide',      icon: '📖', label: 'Investera i Spanien', group: 'Kunskap' },
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
    <aside className="hidden md:flex md:w-[220px] md:min-w-[220px] md:max-lg:w-[180px] md:max-lg:min-w-[180px] bg-bg-card border-r border-border flex-col h-screen sticky top-0">
      <div className="px-6 pt-8 pb-7 border-b border-border">
        <p className="font-display text-[22px] font-semibold text-gold tracking-[0.3px] leading-none">Costa Sol</p>
        <p className="text-[10px] tracking-[2.5px] uppercase text-text-mute mt-1.5">Fastighetsportfölj</p>
      </div>

      <nav className="px-3 py-5 flex-1 overflow-y-auto">
        {GROUPS.map(group => (
          <div key={group} className="mb-5">
            <p className="text-[9px] tracking-[2px] uppercase text-text-mute px-3 pt-2 pb-2.5">{group}</p>
            <div className="flex flex-col gap-0.5">
              {NAV_ITEMS.filter(i => i.group === group).map(item => {
                const active = state.activePage === item.key;
                const showBadge = item.key === 'milestones' && urgentCount > 0;
                const base = 'flex items-center gap-3 w-full px-3 py-2.5 rounded-md border-none text-left text-[13px] transition-colors duration-150';
                const variant = active
                  ? 'bg-gold-faint text-gold font-medium'
                  : 'bg-transparent text-text-dim font-normal hover:bg-bg-hover hover:text-text';
                return (
                  <button
                    key={item.key}
                    className={`${base} ${variant}`}
                    onClick={() => navigate(item.key)}
                  >
                    <span className={`text-[14px] flex-shrink-0 ${active ? 'opacity-100' : 'opacity-60'}`}>{item.icon}</span>
                    {item.label}
                    {showBadge && (
                      <span className="ml-auto bg-red text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {urgentCount}
                      </span>
                    )}
                    {active && !showBadge && <span className="ml-auto w-1 h-1 rounded-full bg-gold" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-6 py-5 border-t border-border flex flex-col gap-3">
        <button
          className="flex bg-transparent border border-border rounded-full p-0.5 w-full cursor-pointer transition-colors duration-150 hover:border-border-hi"
          onClick={toggle}
          title={`Växla till ${currency === 'EUR' ? 'SEK' : 'EUR'} (1€ = ${rate.toFixed(2)} kr)`}
        >
          <CurrencyPill label="EUR" active={currency === 'EUR'} />
          <CurrencyPill label="SEK" active={currency === 'SEK'} />
        </button>
        <p className="text-[10px] text-text-mute">
          {new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })}
        </p>
        {user && (
          <p className="text-text-mute text-[11px] text-center -mt-1">Inloggad: {user.email}</p>
        )}
        <div className="flex flex-col gap-2 mt-1">
          <button
            className="text-left bg-transparent border-none p-0 text-[11px] text-border-hi transition-colors duration-150 hover:text-red"
            onClick={handleReset}
          >
            ↺ Återställ data
          </button>
          <button
            className="text-left bg-transparent border-none p-0 text-[11px] text-border-hi transition-colors duration-150 hover:text-red"
            onClick={handleSignOut}
          >
            → Logga ut
          </button>
        </div>
      </div>
    </aside>
  );
}

function CurrencyPill({ label, active }: { label: string; active: boolean }) {
  const base = 'flex-1 text-[10px] font-medium tracking-[1px] px-2.5 py-1 rounded-full transition-all duration-150';
  const variant = active ? 'bg-gold text-bg' : 'text-text-mute';
  return <span className={`${base} ${variant}`}>{label}</span>;
}

export { CurrencyPill };
