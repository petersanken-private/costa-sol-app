import React from 'react';
import { AppProvider, useApp } from './hooks/useApp';
import { DisplayCurrencyProvider, useDisplayCurrency } from './hooks/useDisplayCurrency';
import { Sidebar } from './components/Sidebar';
import { PWAStatus } from './components/PWAStatus';
import { Dashboard } from './pages/Dashboard';
import { Portfolio } from './pages/Portfolio';
import { PropertyDetail } from './pages/PropertyDetail';
import { Calculator } from './pages/Calculator';
import { Taxes } from './pages/Taxes';
import { Market } from './pages/Market';
import { Compare } from './pages/Compare';
import { Milestones } from './pages/Milestones';
import { PageKey } from './types';
import './styles/global.css';
import './styles/components.css';

const PAGE_MAP: Record<PageKey, React.ReactElement> = {
  dashboard:  <Dashboard />,
  portfolio:  <Portfolio />,
  property:   <PropertyDetail />,
  calculator: <Calculator />,
  taxes:      <Taxes />,
  market:     <Market />,
  compare:    <Compare />,
  milestones: <Milestones />,
};

const MOBILE_NAV: { key: PageKey; icon: string; label: string }[] = [
  { key: 'dashboard',  icon: '▦', label: 'Start'      },
  { key: 'portfolio',  icon: '◈', label: 'Portfölj'   },
  { key: 'milestones', icon: '🗓', label: 'Deadlines'  },
  { key: 'compare',    icon: '⊞', label: 'Jämför'     },
  { key: 'calculator', icon: '◎', label: 'Kalkyl'     },
];

function MobileCurrencyToggle() {
  const { currency, toggle } = useDisplayCurrency();
  return (
    <button className="mobile-currency-toggle" onClick={toggle}>
      <span className={`sidebar__currency-pill ${currency === 'EUR' ? 'sidebar__currency-pill--active' : ''}`}>EUR</span>
      <span className={`sidebar__currency-pill ${currency === 'SEK' ? 'sidebar__currency-pill--active' : ''}`}>SEK</span>
    </button>
  );
}

function AppContent() {
  const { state, navigate, loading, dbError } = useApp();
  const page = PAGE_MAP[state.activePage] ?? <Dashboard />;

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__inner">
          <div className="app-loading__spinner" />
          <p className="app-loading__text">Laddar data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <MobileCurrencyToggle />
      <main className="app-main">
        {dbError && (
          <div className="db-error-banner">
            <span>⚠ {dbError}</span>
            <button onClick={() => window.location.reload()}>Ladda om</button>
          </div>
        )}
        {page}
      </main>
      <nav className="mobile-nav">
        {MOBILE_NAV.map(item => (
          <button
            key={item.key}
            className={`mobile-nav__btn ${state.activePage === item.key ? 'mobile-nav__btn--active' : ''}`}
            onClick={() => navigate(item.key)}
          >
            <span className="mobile-nav__icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <DisplayCurrencyProvider>
        <AppContent />
        <PWAStatus />
      </DisplayCurrencyProvider>
    </AppProvider>
  );
}
