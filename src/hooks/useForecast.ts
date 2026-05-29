// useForecast — kombinerar appens datakällor till en 12-månadersprognos.
//
// Lokala inställningar (startBalance, propertyId) sparas i localStorage så
// användaren slipper ange dem varje gång.

import { useEffect, useMemo, useState } from 'react';
import { useApp } from './useApp';
import { useMortgages } from './useMortgages';
import { useRecurringExpenses } from './useRecurringExpenses';
import { buildForecast } from '../utils/forecast.utils';
import type { ForecastConfig } from '../types/forecast.types';

const LS_KEY = 'costa-sol:forecast-config-v1';

interface StoredConfig {
  startBalance: number;
  propertyId:   string | 'all';
}

function loadStored(): StoredConfig {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { startBalance: 0, propertyId: 'all' };
    return JSON.parse(raw);
  } catch {
    return { startBalance: 0, propertyId: 'all' };
  }
}

function saveStored(c: StoredConfig) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

export function useForecast() {
  const { state }                      = useApp();
  const { items: mortgages }           = useMortgages();
  const { items: recurring }           = useRecurringExpenses();

  const [startBalance, setStartBalance] = useState<number>(() => loadStored().startBalance);
  const [propertyId,   setPropertyId]   = useState<string | 'all'>(() => loadStored().propertyId);
  const [horizonMonths] = useState<number>(12);

  // Persist till localStorage
  useEffect(() => {
    saveStored({ startBalance, propertyId });
  }, [startBalance, propertyId]);

  // Säkerställ att vald property fortfarande finns
  useEffect(() => {
    if (propertyId !== 'all' && !state.properties.find(p => p.id === propertyId)) {
      setPropertyId('all');
    }
  }, [state.properties, propertyId]);

  const config: ForecastConfig = useMemo(() => ({
    startDate:     new Date().toISOString().split('T')[0],
    horizonMonths,
    startBalance,
    propertyId,
  }), [horizonMonths, startBalance, propertyId]);

  const forecast = useMemo(() =>
    buildForecast(config, state.properties, state.rentals, state.expenses, recurring, mortgages),
    [config, state.properties, state.rentals, state.expenses, recurring, mortgages],
  );

  return {
    forecast,
    config,
    properties: state.properties,
    startBalance,
    setStartBalance,
    propertyId,
    setPropertyId,
  };
}
