import React, { lazy, Suspense } from 'react';
import { AppProvider, useApp } from './hooks/useApp';
import { DisplayCurrencyProvider, useDisplayCurrency } from './hooks/useDisplayCurrency';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar, CurrencyPill } from './components/Sidebar';
import { PWAStatus } from './components/PWAStatus';
import { Dashboard } from './components/dashboard/Dashboard';
import { Icon, IconName } from './components/ui/Icon';
import { PageKey } from './types';
import './styles/global.css';
import './styles/components.css';

// ── Lazy-loaded sidor ─────────────────────────────────────────────────────────
// Dashboard laddas eager (default-landing). Övriga sidor kommer som egna
// chunks som hämtas första gången användaren navigerar dit.
// Komponenterna är named exports, så vi mappar `.X` till `default` här.
const Portfolio      = lazy(() => import('./components/portfolio/Portfolio').then(m => ({ default: m.Portfolio })));
const PropertyDetail = lazy(() => import('./components/property/PropertyDetail').then(m => ({ default: m.PropertyDetail })));
const Calculator     = lazy(() => import('./components/calculator/Calculator').then(m => ({ default: m.Calculator })));
const Taxes          = lazy(() => import('./components/taxes/Taxes').then(m => ({ default: m.Taxes })));
const Market         = lazy(() => import('./components/market/Market').then(m => ({ default: m.Market })));
const Compare        = lazy(() => import('./components/compare/Compare').then(m => ({ default: m.Compare })));
const Milestones     = lazy(() => import('./components/milestones/Milestones').then(m => ({ default: m.Milestones })));
const Calendar       = lazy(() => import('./components/calendar').then(m => ({ default: m.Calendar })));
const Guide          = lazy(() => import('./components/guide/Guide').then(m => ({ default: m.Guide })));

const PAGE_MAP: Record<PageKey, React.ComponentType> = {
  dashboard:  Dashboard,
  portfolio:  Portfolio,
  property:   PropertyDetail,
  calculator: Calculator,
  taxes:      Taxes,
  market:     Market,
  compare:    Compare,
  milestones: Milestones,
  calendar:   Calendar,
  guide:      Guide,
};

const MOBILE_NAV: { key: PageKey; icon: IconName; label: string }[] = [
  { key: 'dashboard',  icon: 'grid',    label: 'Start'    },
  { key: 'portfolio',  icon: 'layers',  label: 'Portfölj' },
  { key: 'milestones', icon: 'bell',    label: 'Deadlines'},
  { key: 'compare',    icon: 'compare', label: 'Jämför'   },
  { key: 'calculator', icon: 'calc',    label: 'Kalkyl'   },
];

const PAGE_TITLES: Record<PageKey, string> = {
  dashboard:  'Dashboard',
  portfolio:  'Portfölj',
  property:   'Objekt',
  calculator: 'Kalkylator',
  taxes:      'Skatt',
  market:     'Marknadsdata',
  compare:    'Jämför objekt',
  milestones: 'Påminnelser',
  calendar:   'Kalender',
  guide:      'Investera i Spanien',
};

/** Mobil top-bar: brand-mark + aktuell vy-titel + currency-pill. */
function MobileTopBar({ activePage }: { activePage: PageKey }) {
  const { currency, toggle } = useDisplayCurrency();
  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-5 pt-3.5 pb-1.5 bg-bg-card border-b border-border">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-[8px] bg-green text-white font-display font-medium text-[12px] flex items-center justify-center tracking-[0.3px]">
          CdS
        </span>
        <span className="font-display font-medium text-[17px] text-text">{PAGE_TITLES[activePage]}</span>
      </div>
      <button
        className="flex bg-transparent border border-border rounded-pill p-0.5"
        onClick={toggle}
      >
        <CurrencyPill label="EUR" active={currency === 'EUR'} />
        <CurrencyPill label="SEK" active={currency === 'SEK'} />
      </button>
    </header>
  );
}

/** Liten fallback medan en lazy-laddad sida hämtas. */
function PageLoading() {
  return (
    <div className="app-loading">
      <div className="app-loading__inner">
        <div className="app-loading__spinner" />
      </div>
    </div>
  );
}

function AppContent() {
  const { state, navigate, loading, dbError } = useApp();
  const PageComp = PAGE_MAP[state.activePage] ?? Dashboard;

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
      <MobileTopBar activePage={state.activePage} />
      <main className="app-main">
        {dbError && (
          <div className="db-error-banner">
            <span>⚠ {dbError}</span>
            <button onClick={() => window.location.reload()}>Ladda om</button>
          </div>
        )}
        <Suspense fallback={<PageLoading />}>
          <PageComp />
        </Suspense>
      </main>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border flex z-50 pb-[env(safe-area-inset-bottom,0px)]">
        {MOBILE_NAV.map(item => (
          <button
            key={item.key}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 bg-transparent border-0 text-[10px] transition-colors duration-150 [-webkit-tap-highlight-color:transparent] ${
              state.activePage === item.key ? 'text-green' : 'text-text-mute'
            }`}
            onClick={() => navigate(item.key)}
          >
            <Icon name={item.icon} size={20} />
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

/**
 * Styleguide-route — visuell katalog som bypassar auth.
 * Nås via `?styleguide` query-param. Används av Playwright visual regression tests.
 */
const Styleguide = lazy(() => import('./components/Styleguide').then(m => ({ default: m.Styleguide })));

export default function App() {
  // Bypassa hela auth/Supabase-kedjan när styleguide körs — testerna ska inte
  // behöva en riktig session eller databas-data.
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('styleguide')) {
    return (
      <Suspense fallback={<PageLoading />}>
        <Styleguide />
      </Suspense>
    );
  }

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
