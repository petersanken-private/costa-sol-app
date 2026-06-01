// ── OwnerEditor — editera ägarstruktur per fastighet ─────────────────────────
//
// Visas i PropertyModal. Stöder sambo/skuldebrev-scenarion där ni vill
// splittra P&L mellan flera ägare (90/10, 50/50 etc.).
//
// Tom lista = ensam ägare 100% (default, bakåtkompatibelt).

import { Btn, IconBtn } from '../ui';
import { validateOwners } from '../../utils/owner.utils';
import type { PropertyOwner } from '../../types';

interface OwnerEditorProps {
  owners:   PropertyOwner[];
  onChange: (owners: PropertyOwner[]) => void;
}

export function OwnerEditor({ owners, onChange }: OwnerEditorProps) {
  const hasMultiple = owners.length > 0;
  const sum = owners.reduce((s, o) => s + o.sharePct, 0);
  const error = hasMultiple ? validateOwners(owners) : null;

  function addOwner() {
    if (owners.length === 0) {
      // Starta med 2 ägare 50/50
      onChange([
        { name: 'Du',      sharePct: 50 },
        { name: 'Partner', sharePct: 50 },
      ]);
    } else {
      onChange([...owners, { name: '', sharePct: 0 }]);
    }
  }

  function removeOwner(idx: number) {
    const next = owners.filter((_, i) => i !== idx);
    onChange(next);
  }

  function update(idx: number, patch: Partial<PropertyOwner>) {
    onChange(owners.map((o, i) => i === idx ? { ...o, ...patch } : o));
  }

  function balanceFromOther(idx: number, newPct: number) {
    // Om bara 2 ägare: justera den andra automatiskt så summan = 100
    if (owners.length === 2) {
      const other = idx === 0 ? 1 : 0;
      onChange(owners.map((o, i) =>
        i === idx  ? { ...o, sharePct: newPct }
        : i === other ? { ...o, sharePct: Math.max(0, 100 - newPct) }
        : o,
      ));
    } else {
      update(idx, { sharePct: newPct });
    }
  }

  return (
    <div className="col-span-2">
      <div className="flex items-center justify-between mb-2">
        <label className="form-label">Ägarstruktur</label>
        {!hasMultiple && (
          <Btn size="sm" onClick={addOwner}>+ Lägg till delägare</Btn>
        )}
      </div>

      {!hasMultiple ? (
        <p className="text-[12px] text-text-mute">
          Ensam ägare 100%. Klicka ovan om ni samäger denna fastighet (sambo/gemensam köp).
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2 mb-2">
            {owners.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="form-input flex-1"
                  value={o.name}
                  placeholder="Namn"
                  onChange={e => update(i, { name: e.target.value })}
                />
                <div className="flex items-center gap-1 min-w-[110px]">
                  <input
                    className="form-input w-[70px] text-right"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={o.sharePct}
                    onChange={e => balanceFromOther(i, parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-[14px] text-text-mute">%</span>
                </div>
                <IconBtn variant="delete" onClick={() => removeOwner(i)} alwaysVisible />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Btn size="sm" onClick={addOwner}>+ Lägg till delägare</Btn>
            <span className={[
              'text-[12px] font-medium',
              Math.abs(sum - 100) < 0.01 ? 'text-green' : 'text-red',
            ].join(' ')}>
              Summa: {sum.toFixed(1)}%
            </span>
          </div>

          {error && (
            <p className="text-[12px] text-red mt-2">⚠ {error}</p>
          )}

          <p className="text-[11px] text-text-mute mt-3 leading-[1.5]">
            💡 Dashboard, Skatt och Modelo 210-export kan visa data splittat per ägare när du har 2+ delägare.
            Andelarna används för att beräkna varje ägares P&L.
          </p>
        </>
      )}
    </div>
  );
}
