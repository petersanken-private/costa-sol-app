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
    <span
      className="inline-block px-2 py-0.5 rounded-[20px] text-[11px] font-medium tracking-[0.3px] border border-transparent whitespace-nowrap"
      style={style}
    >
      {label}
    </span>
  );
}
