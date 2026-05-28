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

// VIKTIGT: ingen font-size, min-height eller padding i BASE — de definieras
// per storlek (SIZES) för att undvika konflikter mellan arbitrary values i
// Tailwind v4 (där cascade-ordning för arbitrary values inte är garanterad).
const BASE = 'inline-flex items-center gap-2 rounded-[6px] font-medium leading-none transition-all duration-150 whitespace-nowrap [-webkit-tap-highlight-color:transparent] disabled:opacity-50 disabled:cursor-not-allowed';

const SIZES = {
  md: 'text-[13px] min-h-[44px] px-5 py-2.5',
  sm: 'text-[12px] min-h-[36px] px-3.5 py-2',
} as const;

const VARIANTS = {
  primary: 'bg-gold text-white border-0 shadow-[0_1px_3px_rgba(184,134,11,0.25)] hover:bg-[#9a7009]',
  ghost:   'bg-transparent text-text-dim border border-border hover:bg-bg-hover hover:border-border-hi',
  danger:  'bg-red-bg text-red border border-red/20 hover:bg-[#fee2e2]',
} as const;

export function Btn({
  children, onClick, variant = 'ghost', size = 'md',
  type = 'button', className = '', disabled = false,
}: BtnProps) {
  const classes = [BASE, SIZES[size], VARIANTS[variant], className]
    .filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
