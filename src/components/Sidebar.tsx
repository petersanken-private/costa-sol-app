// Sidebar — container som hämtar data via hooks och delegerar
// rendering till presentational SidebarView.

import { useApp } from '../hooks/useApp';
import { useMilestones } from '../hooks/useMilestones';
import { useDisplayCurrency } from '../hooks/useDisplayCurrency';
import { useAuth } from '../hooks/useAuth';
import { SidebarView } from './SidebarView';

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
    <SidebarView
      activePage={state.activePage}
      urgentCount={urgentCount}
      currency={currency}
      rate={rate}
      userEmail={user?.email}
      onNavigate={navigate}
      onToggleCurrency={toggle}
      onReset={handleReset}
      onSignOut={handleSignOut}
    />
  );
}

// Återexportera CurrencyPill från SidebarView (används i App.tsx för MobileCurrencyToggle).
export { CurrencyPill } from './SidebarView';
