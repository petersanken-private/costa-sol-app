import { useState, useEffect } from 'react';
// @ts-expect-error - virtual:pwa-register injiceras av vite-plugin-pwa under build
import { registerSW } from 'virtual:pwa-register';
import { Btn } from './ui';

/**
 * Visar två slags meddelanden:
 * 1. När en ny version av appen finns tillgänglig → "Ladda om för att uppdatera"
 * 2. När browsern är offline → liten indikator i hörnet
 */
export function PWAStatus() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [isOffline,   setIsOffline]   = useState(!navigator.onLine);
  const [updateSW,    setUpdateSW]    = useState<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() { setNeedRefresh(true); },
      onOfflineReady() {
        console.log('App är nu redo att fungera offline.');
      },
    });
    setUpdateSW(() => update);

    function handleOnline()  { setIsOffline(false); }
    function handleOffline() { setIsOffline(true);  }
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Update-prompt */}
      {needRefresh && updateSW && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-surface-2 border border-gold rounded-lg px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] max-w-[calc(100vw-32px)]">
          <span className="text-[14px]">↻ Ny version tillgänglig</span>
          <Btn size="sm" variant="primary" onClick={() => updateSW(true)}>Uppdatera</Btn>
          <button
            className="bg-transparent border-none text-text-mute text-[18px] leading-none cursor-pointer p-0 transition-colors duration-150 hover:text-text"
            onClick={() => setNeedRefresh(false)}
            aria-label="Stäng"
          >
            ×
          </button>
        </div>
      )}

      {/* Offline-indikator */}
      {isOffline && (
        <div className="fixed top-4 right-4 z-[9999] bg-surface-2 border border-red rounded-full px-3.5 py-1.5 text-[12px] font-medium text-red">
          ⚠ Offline
        </div>
      )}
    </>
  );
}
