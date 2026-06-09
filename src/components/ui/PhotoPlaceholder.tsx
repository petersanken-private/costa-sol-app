// PhotoPlaceholder — diagonalrandig, statustonad platshållare för fastighetsfoto.
// Matchar designens APhoto. TODO: ersätt med riktig <img> + CDN/Storage senare.

import { CSSProperties } from 'react';

export interface PhotoPlaceholderProps {
  /** Höjd i px (desktop). */
  height?:   number;
  /** Ton-färg (hex) — vanligtvis statusfärg. */
  tint?:     string;
  /** Kursiv etikett centrerad i rutan. */
  label?:    string;
  radius?:   number;
  className?: string;
}

export function PhotoPlaceholder({
  height = 140,
  tint = '#2f5d4d',
  label,
  radius = 10,
  className = '',
}: PhotoPlaceholderProps) {
  const style: CSSProperties = {
    height,
    borderRadius: radius,
    background: `repeating-linear-gradient(135deg, ${tint}22 0px, ${tint}22 11px, ${tint}11 11px, ${tint}11 22px)`,
  };
  return (
    <div
      className={'w-full relative flex items-center justify-center overflow-hidden ' + className}
      style={style}
    >
      {label && (
        <span className="font-display italic text-[12px] text-text-dim opacity-60">{label}</span>
      )}
    </div>
  );
}
