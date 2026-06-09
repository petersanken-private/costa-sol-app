import { ReactNode, CSSProperties } from 'react';

export interface CardProps {
  children:   ReactNode;
  className?: string;
  onClick?:   () => void;
  hoverable?: boolean;
  dashed?:    boolean;
  style?:     CSSProperties;
}

// Bas: 14px radius — border-only (inga skuggor), matchar designens "Stillhet".
const BASE   = 'bg-bg-card border border-border rounded-[14px] transition-all duration-150';
const HOVER  = 'cursor-pointer hover:bg-bg-hover hover:border-border-hi hover:-translate-y-0.5';
const DASHED = 'border-dashed text-center hover:bg-bg-hover hover:border-green hover:text-green';

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
