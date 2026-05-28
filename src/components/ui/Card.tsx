import { ReactNode, CSSProperties } from 'react';

export interface CardProps {
  children:   ReactNode;
  className?: string;
  onClick?:   () => void;
  hoverable?: boolean;
  dashed?:    boolean;
  style?:     CSSProperties;
}

// Bas: 10px radius mobil, 14px desktop — matchar original --radius-md/lg.
const BASE   = 'bg-bg-card border border-border rounded-[10px] md:rounded-[14px] shadow-sm transition-all duration-150';
const HOVER  = 'cursor-pointer hover:bg-bg-subtle hover:border-border-hi hover:shadow-md';
const DASHED = 'border-dashed text-center shadow-none';

export function Card({ children, className = '', onClick, hoverable, dashed, style }: CardProps) {
  const classes = [
    BASE,
    hoverable ? HOVER  : '',
    dashed    ? DASHED : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} style={style}>
      {children}
    </div>
  );
}
