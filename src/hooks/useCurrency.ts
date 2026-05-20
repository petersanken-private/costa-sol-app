import { useState, useEffect } from 'react';

export interface CurrencyData {
  rate:       number;       // 1 EUR = X SEK
  change1d:   number;       // % förändring senaste dygnet
  change30d:  number;       // % förändring senaste 30 dagarna
  change1y:   number;       // % förändring senaste 12 månaderna
  history30d: { date: string; rate: number }[];
  history1y:  { date: string; rate: number }[];
  updatedAt:  string;
  loading:    boolean;
  error:      string | null;
}

const CACHE_KEY = 'costa-sol:currency';
const CACHE_TTL = 60 * 60 * 1000; // 1 timme

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateStr(d);
}

export function useCurrency(): CurrencyData {
  const [data, setData] = useState<CurrencyData>({
    rate: 11.5, change1d: 0, change30d: 0, change1y: 0,
    history30d: [], history1y: [], updatedAt: '',
    loading: true, error: null,
  });

  useEffect(() => {
    // Try cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, payload } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setData({ ...payload, loading: false, error: null });
          return;
        }
      }
    } catch {}

    fetchRates();
  }, []);

  async function fetchRates() {
    try {
      const today     = dateStr(new Date());
      const ago1d     = daysAgo(2);   // yesterday (markets closed weekends)
      const ago30d    = daysAgo(31);
      const ago1y     = daysAgo(366);

      // Fetch current rate + history in parallel
      const [currentRes, historyRes] = await Promise.all([
        fetch(`https://api.frankfurter.app/latest?from=EUR&to=SEK`),
        fetch(`https://api.frankfurter.app/${ago1y}..${today}?from=EUR&to=SEK`),
      ]);

      if (!currentRes.ok || !historyRes.ok) throw new Error('API-fel');

      const current = await currentRes.json();
      const history = await historyRes.json();

      const rate = current.rates.SEK as number;

      // Build sorted history array
      const entries = Object.entries(history.rates as Record<string, { SEK: number }>)
        .map(([date, r]) => ({ date, rate: r.SEK }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Find reference rates
      const rate1d  = entries.find(e => e.date >= ago1d)?.rate  ?? rate;
      const rate30d = entries.find(e => e.date >= ago30d)?.rate ?? rate;
      const rate1y  = entries[0]?.rate ?? rate;

      const change1d  = ((rate - rate1d)  / rate1d)  * 100;
      const change30d = ((rate - rate30d) / rate30d) * 100;
      const change1y  = ((rate - rate1y)  / rate1y)  * 100;

      // Downsample for 30d (daily) and 1y (weekly)
      const history30d = entries.filter(e => e.date >= ago30d);
      const history1y  = entries.filter((_, i) => i % 7 === 0); // weekly

      const payload: Omit<CurrencyData, 'loading' | 'error'> = {
        rate, change1d, change30d, change1y,
        history30d, history1y,
        updatedAt: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
      };

      // Cache it
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), payload }));

      setData({ ...payload, loading: false, error: null });
    } catch (err) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Kunde inte hämta valutakurs.',
      }));
    }
  }

  return data;
}
