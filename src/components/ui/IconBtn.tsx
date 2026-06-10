// Minimalistisk ikon-knapp utan border. Används i tabellrader och listor
// där man vill ha kompakta operationer som syns vid hover (eller alltid).
//
// Skillnad mot RowActionBtn: ingen border, ingen fast storlek (text-baserad).
// Visas typiskt vid hover på förälderraden via group-hover.

import React from 'react';
import { Icon, IconName } from './Icon';

interface IconBtnProps {
  variant:        'edit' | 'delete';
  onClick:        (e: React.MouseEvent) => void;
  title?:         string;
  disabled?:      boolean;
  /** Sätt true om knappen ska vara synlig alltid (annars opacity-0 + group-hover:opacity-100). */
  alwaysVisible?: boolean;
}

const VARIANTS: Record<'edit' | 'delete', { icon: IconName; hover: string }> = {
  edit:   { icon: 'edit',  hover: 'hover:text-green' },
  delete: { icon: 'close', hover: 'hover:text-red'  },
};

export function IconBtn({ variant, onClick, title, disabled, alwaysVisible = false }: IconBtnProps) {
  const v = VARIANTS[variant];
  return (
    <button
      className={[
        'inline-flex items-center justify-center w-7 h-7 rounded-[6px] bg-transparent border-0 text-text-mute transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed',
        v.hover,
        alwaysVisible ? '' : 'opacity-0 group-hover:opacity-100',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      disabled={disabled}
      title={title ?? (variant === 'edit' ? 'Redigera' : 'Ta bort')}
    >
      <Icon name={v.icon} size={15} />
    </button>
  );
}
