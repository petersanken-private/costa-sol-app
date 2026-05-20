import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface RefreshResult {
  ok:      boolean;
  results?: Array<{ area: string; updated: boolean; error?: string }>;
  error?:  string;
}

/**
 * Trigga Edge Function refresh-market-data som hämtar gratis-data
 * (INE IPV + Inside Airbnb) och uppdaterar area_market_data.
 */
export function useMarketRefresh() {
  const [running, setRunning] = useState(false);
  const [last,    setLast]    = useState<RefreshResult | null>(null);

  async function refresh(): Promise<RefreshResult> {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('refresh-market-data', {
        method: 'POST',
      });
      if (error) {
        const result: RefreshResult = { ok: false, error: error.message };
        setLast(result);
        return result;
      }
      const result = data as RefreshResult;
      setLast(result);
      return result;
    } catch (err) {
      const result: RefreshResult = { ok: false, error: err instanceof Error ? err.message : String(err) };
      setLast(result);
      return result;
    } finally {
      setRunning(false);
    }
  }

  return { refresh, running, last };
}
