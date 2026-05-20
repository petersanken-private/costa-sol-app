import { useApp } from '../hooks/useApp';
import { useMilestones } from '../hooks/useMilestones';
import { useDisplayCurrency } from '../hooks/useDisplayCurrency';
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
];

export function Sidebar() {
  const { state, navigate, resetAllData } = useApp();
  const { urgentCount } = useMilestones();
  const { currency, rate, toggle } = useDisplayCurrency();

  function handleReset() {
    if (window.confirm('Återställ all data till seed-data? Detta går inte att ångra.')) resetAllData();
  }

  const groups = ['Portfölj', 'Köpanalys'];

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <p className="sidebar__logo-name">Costa Sol</p>
        <p className="sidebar__logo-sub">Fastighetsportfölj</p>
      </div>

      <nav className="sidebar__nav">
        {groups.map(group => (
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
          <span className={`sidebar__currency-pill ${currency === 'EUR' ? 'sidebar__currency-pill--active' : ''}`}>EUR</span>
          <span className={`sidebar__currency-pill ${currency === 'SEK' ? 'sidebar__currency-pill--active' : ''}`}>SEK</span>
        </button>
        <p className="sidebar__footer-date">
          {new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })}
        </p>
        <button className="sidebar__reset-btn" onClick={handleReset}>↺ Återställ data</button>
      </div>
    </aside>
  );
}
