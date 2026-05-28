// YearButton — liten pill-knapp för år- eller horisontval.
// Används i Dashboard, Taxes, ScenarioControls (Compare).

interface YearButtonProps {
  label:    string | number;
  active:   boolean;
  onClick:  () => void;
}

const BASE   = 'py-1.5 px-3.5 rounded-pill border text-[12px] transition-all duration-150 shadow-sm';
const ACTIVE = 'border-gold bg-gold-faint text-gold font-medium';
const INACTIVE = 'border-border bg-bg-card text-text-mute hover:border-border-hi hover:text-text-dim';

export function YearButton({ label, active, onClick }: YearButtonProps) {
  return (
    <button
      className={`${BASE} ${active ? ACTIVE : INACTIVE}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
