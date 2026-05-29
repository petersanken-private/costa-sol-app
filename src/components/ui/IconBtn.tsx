// Minimalistisk ikon-knapp utan border. Används i tabellrader och listor
// där man vill ha kompakta operationer som syns vid hover (eller alltid).
//
// Skillnad mot RowActionBtn: ingen border, ingen fast storlek (text-baserad).
// Visas typiskt vid hover på förälderraden via group-hover.

import React from 'react';

interface IconBtnProps {
  variant:        'edit' | 'delete';
  onClick:        (e: React.MouseEvent) => void;
  title?:         string;
  disabled?:      boolean;
  /** Sätt true om knappen ska vara synlig alltid (annars opacity-0 + group-hover:opacity-100). */
  alwaysVisible?: boolean;
}

const VARIANTS = {
  edit:   { icon: '✎', size: 'text-[14px] px-[3px]', hover: 'hover:text-gold' },
  delete: { icon: '×', size: 'text-[18px] px-1',     hover: 'hover:text-red'  },
} as const;

export function IconBtn({ variant, onClick, title, disabled, alwaysVisible = false }: IconBtnProps) {
  const v = VARIANTS[variant];
  return (
    <button
      className={[
        'bg-transparent border-0 text-text-mute leading-[1] transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed',
        v.size,
        v.hover,
        alwaysVisible ? '' : 'opacity-0 group-hover:opacity-100',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      disabled={disabled}
      title={title ?? (variant === 'edit' ? 'Redigera' : 'Ta bort')}
    >
      {VARIANTS[variant].icon}
    </button>
  );
}
