// Liten 28×28 ikon-knapp för rad-actions (edit / delete).
// Används i tabellrader och kort där man behöver kompakta operationer.

import React from 'react';

interface RowActionBtnProps {
  variant: 'edit' | 'delete';
  onClick: (e: React.MouseEvent) => void;
  title?:  string;
}

const BASE = 'bg-transparent border border-border rounded-[6px] w-7 h-7 text-[14px] text-text-mute flex items-center justify-center transition-all duration-150';

const HOVER = {
  edit:   'hover:border-gold hover:text-gold hover:bg-gold-faint',
  delete: 'hover:border-red hover:text-red hover:bg-red-bg',
} as const;

const ICON = {
  edit:   '✎',
  delete: '×',
} as const;

export function RowActionBtn({ variant, onClick, title }: RowActionBtnProps) {
  return (
    <button
      className={`${BASE} ${HOVER[variant]}`}
      onClick={onClick}
      title={title ?? (variant === 'edit' ? 'Redigera' : 'Ta bort')}
    >
      {ICON[variant]}
    </button>
  );
}
