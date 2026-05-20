import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(stored));
    } catch {
      // Ignore write errors (private mode, quota exceeded)
    }
  }, [key, stored]);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch { /* ignore */ }
    setStored(initialValue);
  }, [key, initialValue]);

  return [stored, setStored, clear];
}
