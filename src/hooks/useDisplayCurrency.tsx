import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useCurrency } from './useCurrency';
import { DisplayCurrency, setDisplayCurrency, setEurToSekRate } from '../utils/calc.utils';

const STORAGE_KEY = 'costa-sol:display-currency';

interface CurrencyContextValue {
  currency: DisplayCurrency;
  rate:     number;           // 1 EUR = X SEK
  toggle:   () => void;
  set:      (c: DisplayCurrency) => void;
}

const Ctx = createContext<CurrencyContextValue | null>(null);

export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  const live = useCurrency(); // Frankfurter API
  const [currency, setCurrencyState] = useState<DisplayCurrency>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved === 'SEK' || saved === 'EUR') ? saved : 'EUR';
  });

  // Synca rate till modulnivå-state så fmtMoney i calc.ts ser den
  useEffect(() => {
    if (!live.loading && live.rate > 0) setEurToSekRate(live.rate);
  }, [live.rate, live.loading]);

  // Synca currency till modulnivå-state
  useEffect(() => {
    setDisplayCurrency(currency);
    localStorage.setItem(STORAGE_KEY, currency);
  }, [currency]);

  function toggle() { setCurrencyState(c => c === 'EUR' ? 'SEK' : 'EUR'); }
  function set(c: DisplayCurrency) { setCurrencyState(c); }

  return (
    <Ctx.Provider value={{ currency, rate: live.rate, toggle, set }}>
      {/* key={currency} forces remount so all fmtMoney-calls re-evaluate */}
      <div key={currency} style={{ display: 'contents' }}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function useDisplayCurrency(): CurrencyContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDisplayCurrency måste användas inuti DisplayCurrencyProvider');
  return ctx;
}
