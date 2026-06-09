// HeroValue — stor display-siffra (Spectral 62px) för portföljvärde o.dyl.
// Matchar designens .a-hero-value.

export interface HeroValueProps {
  value:      string;
  className?: string;
}

export function HeroValue({ value, className = '' }: HeroValueProps) {
  return (
    <div
      className={
        'font-display font-light leading-[0.9] tracking-[-1.5px] text-text ' +
        'text-[44px] md:text-[62px] ' + className
      }
    >
      {value}
    </div>
  );
}
