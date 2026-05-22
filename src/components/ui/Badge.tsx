export interface BadgeProps {
  label: string;
  /** CSS color value — endast för dynamiska runtime-färger (statiska går via CSS). */
  color?: string;
}

export function Badge({ label, color }: BadgeProps) {
  const style = color
    ? { color, background: color + '18', borderColor: color + '40' }
    : undefined;
  return (
    <span className="badge" style={style}>
      {label}
    </span>
  );
}
