import React from 'react';
import { AppProvider, useApp } from './hooks/useApp';
import { DisplayCurrencyProvider, useDisplayCurrency } from './hooks/useDisplayCurrency';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar, CurrencyPill } from './components/Sidebar';
import { PWAStatus } from './components/PWAStatus';
import { Dashboard } from './components/dashboard/Dashboard';
import { Portfolio } from './components/portfolio/Portfolio';
import { PropertyDetail } from './components/property/PropertyDetail';
import { Calculator } from './components/calculator/Calculator';
import { Taxes } from './components/taxes/Taxes';
import { Market } from './components/market/Market';
import { Compare } from './components/compare/Compare';
import { Milestones } from './components/milestones/Milestones';
import { Guide } from './components/guide/Guide';
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
  guide:      <Guide />,
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
      <CurrencyPill label="EUR" active={currency === 'EUR'} />
      <CurrencyPill label="SEK" active={currency === 'SEK'} />
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

/**
 * Visar login-skärm tills användaren är autentiserad.
 * Först när inloggning lyckats laddas resten av appen (inkl. Supabase-data).
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__inner">
          <div className="app-loading__spinner" />
        </div>
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <AppProvider>
          <DisplayCurrencyProvider>
            <AppContent />
            <PWAStatus />
          </DisplayCurrencyProvider>
        </AppProvider>
      </AuthGate>
    </AuthProvider>
  );
}
