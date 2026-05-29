import React, { lazy, Suspense } from 'react';
import { AppProvider, useApp } from './hooks/useApp';
import { DisplayCurrencyProvider, useDisplayCurrency } from './hooks/useDisplayCurrency';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar, CurrencyPill } from './components/Sidebar';
import { PWAStatus } from './components/PWAStatus';
import { Dashboard } from './components/dashboard/Dashboard';
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
  guide:      Guide,
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
    <button
      className="inline-flex md:hidden fixed top-3 right-3 z-[60] bg-bg-card border border-border rounded-pill p-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
      onClick={toggle}
    >
      <CurrencyPill label="EUR" active={currency === 'EUR'} />
      <CurrencyPill label="SEK" active={currency === 'SEK'} />
    </button>
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
      <MobileCurrencyToggle />
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
            className={`flex-1 flex flex-col items-center gap-[3px] py-2 px-1 bg-transparent border-0 text-[10px] transition-colors duration-150 [-webkit-tap-highlight-color:transparent] ${
              state.activePage === item.key ? 'text-gold' : 'text-text-mute'
            }`}
            onClick={() => navigate(item.key)}
          >
            <span className="text-[20px] leading-none">{item.icon}</span>
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
