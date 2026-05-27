export interface DividerProps {
  className?: string;
}

export function Divider({ className = '' }: DividerProps) {
  return <hr className={`border-none border-t border-border ${className}`} />;
}
