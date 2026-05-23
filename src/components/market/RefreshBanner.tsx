import { Card, Btn } from '../ui';
import { useMarketRefresh } from '../../hooks/useMarketRefresh';

export interface RefreshBannerProps {
  running: boolean;
  last:    ReturnType<typeof useMarketRefresh>['last'];
  onRun:   () => void;
}

export function RefreshBanner({ running, last, onRun }: RefreshBannerProps) {
  const updated = last?.results?.filter(r => r.updated).length ?? 0;
  const failed  = last?.results?.filter(r => !r.updated).length ?? 0;

  return (
    <Card className="card-p" style={{ marginBottom: '20px', background: 'var(--surface-2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 500 }}>↻ Automatisk uppdatering</p>
          <p className="text-mute" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            Hämtar tillväxt-% från INE och ADR/beläggning från Inside Airbnb (kräver CSV i Storage).
          </p>
          {last && (
            <p className="text-mute" style={{ margin: '8px 0 0', fontSize: '12px' }}>
              {last.ok
                ? `Senaste körning: ${updated} områden uppdaterade${failed > 0 ? `, ${failed} felade` : ''}`
                : `Senaste körning failade: ${last.error}`}
            </p>
          )}
        </div>
        <Btn variant="primary" size="sm" onClick={onRun} disabled={running}>
          {running ? 'Hämtar…' : '↻ Uppdatera från källor'}
        </Btn>
      </div>
    </Card>
  );
}
