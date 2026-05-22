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
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={color ? { color } : undefined}>{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}
