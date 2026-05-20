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
        <div style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface-2)', border: '1px solid var(--gold)',
          borderRadius: '8px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 9999, maxWidth: 'calc(100vw - 32px)',
        }}>
          <span style={{ fontSize: '14px' }}>↻ Ny version tillgänglig</span>
          <Btn size="sm" variant="primary" onClick={() => updateSW(true)}>Uppdatera</Btn>
          <button className="delete-btn" onClick={() => setNeedRefresh(false)}>×</button>
        </div>
      )}

      {/* Offline-indikator */}
      {isOffline && (
        <div style={{
          position: 'fixed', top: '16px', right: '16px',
          background: 'var(--surface-2)', border: '1px solid var(--red)',
          borderRadius: '999px', padding: '6px 14px',
          fontSize: '12px', fontWeight: 500, color: 'var(--red)',
          zIndex: 9999,
        }}>
          ⚠ Offline
        </div>
      )}
    </>
  );
}
