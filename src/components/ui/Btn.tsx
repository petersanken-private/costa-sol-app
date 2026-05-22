import { ReactNode } from 'react';

export interface BtnProps {
  children:   ReactNode;
  onClick?:   () => void;
  variant?:   'primary' | 'ghost' | 'danger';
  size?:      'sm' | 'md';
  type?:      'button' | 'submit';
  className?: string;
  disabled?:  boolean;
}

export function Btn({
  children, onClick, variant = 'ghost', size = 'md',
  type = 'button', className = '', disabled = false,
}: BtnProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'sm' ? 'btn--sm' : '',
    disabled ? 'btn--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
