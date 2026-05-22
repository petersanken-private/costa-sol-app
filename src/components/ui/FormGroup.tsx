import { ReactNode } from 'react';

export interface FormGroupProps {
  label:      string;
  children:   ReactNode;
  /** Spann över 2 kolumner i grid-2 layout. */
  span2?:     boolean;
  className?: string;
}

export function FormGroup({ label, children, span2, className = '' }: FormGroupProps) {
  const classes = ['form-group', span2 ? 'col-span-2' : '', className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}
