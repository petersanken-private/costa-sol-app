import { ReactNode, CSSProperties } from 'react';

export interface CardProps {
  children:   ReactNode;
  className?: string;
  onClick?:   () => void;
  hoverable?: boolean;
  dashed?:    boolean;
  style?:     CSSProperties;
}

export function Card({ children, className = '', onClick, hoverable, dashed, style }: CardProps) {
  const classes = [
    'card',
    hoverable ? 'card--hoverable' : '',
    dashed    ? 'card--dashed'    : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} style={style}>
      {children}
    </div>
  );
}
