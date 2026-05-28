export interface StatProps {
  label: string;
  value: string;
  sub?:   string;
  /** Dynamisk färg (för t.ex. gröna/röda värden) — annars styr CSS. */
  color?: string;
}

export function Stat({ label, value, sub, color }: StatProps) {
  return (
    <div>
      <p className="text-[10px] tracking-[1.5px] uppercase text-text-mute mb-1">{label}</p>
      <p
        className="font-display text-[22px] md:text-[28px] font-normal leading-[1] text-text"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-text-mute mt-1">{sub}</p>}
    </div>
  );
}
