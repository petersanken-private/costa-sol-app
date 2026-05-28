import { useApp } from '../hooks/useApp';
import { useMilestones } from '../hooks/useMilestones';
import { useDisplayCurrency } from '../hooks/useDisplayCurrency';
import { useAuth } from '../hooks/useAuth';
import { PageKey } from '../types';
import '../styles/sidebar.css';

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
    <aside className="sidebar">
      <div className="sidebar__logo">
        <p className="sidebar__logo-name">Costa Sol</p>
        <p className="sidebar__logo-sub">Fastighetsportfölj</p>
      </div>

      <nav className="sidebar__nav">
        {GROUPS.map(group => (
          <div key={group} className="sidebar__nav-group">
            <p className="sidebar__nav-group-label">{group}</p>
            {NAV_ITEMS.filter(i => i.group === group).map(item => {
              const active = state.activePage === item.key;
              const showBadge = item.key === 'milestones' && urgentCount > 0;
              return (
                <button
                  key={item.key}
                  className={`sidebar__nav-btn ${active ? 'sidebar__nav-btn--active' : ''}`}
                  onClick={() => navigate(item.key)}
                >
                  <span className="sidebar__nav-icon">{item.icon}</span>
                  {item.label}
                  {showBadge && (
                    <span className="sidebar__urgent-badge">{urgentCount}</span>
                  )}
                  {active && !showBadge && <span className="sidebar__nav-dot" />}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button
          className="sidebar__currency-toggle"
          onClick={toggle}
          title={`Växla till ${currency === 'EUR' ? 'SEK' : 'EUR'} (1€ = ${rate.toFixed(2)} kr)`}
        >
          <CurrencyPill label="EUR" active={currency === 'EUR'} />
          <CurrencyPill label="SEK" active={currency === 'SEK'} />
        </button>
        <p className="sidebar__footer-date">
          {new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })}
        </p>
        {user && (
          <p className="text-mute" style={{ fontSize: '11px', marginBottom: '8px', textAlign: 'center' }}>
            Inloggad: {user.email}
          </p>
        )}
        <button className="sidebar__reset-btn" onClick={handleReset}>↺ Återställ data</button>
        <button className="sidebar__reset-btn" onClick={handleSignOut} style={{ marginTop: '6px' }}>
          → Logga ut
        </button>
      </div>
    </aside>
  );
}

/**
 * Återanvänds av MobileCurrencyToggle i App.tsx.
 * TODO: konvertera till Tailwind när sidebar-migrationen kan verifieras visuellt.
 */
function CurrencyPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`sidebar__currency-pill ${active ? 'sidebar__currency-pill--active' : ''}`}>
      {label}
    </span>
  );
}

export { CurrencyPill };
