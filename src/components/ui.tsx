import { ReactNode, CSSProperties } from 'react';

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  children:  ReactNode;
  className?: string;
  onClick?:  () => void;
  hoverable?: boolean;
  dashed?:   boolean;
  style?:    CSSProperties;
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

// ── Badge ─────────────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string;
  color?: string;  // CSS color value — only for dynamic runtime colors
}

export function Badge({ label, color }: BadgeProps) {
  const style = color
    ? { color, background: color + '18', borderColor: color + '40' }
    : undefined;
  return (
    <span className="badge" style={style}>
      {label}
    </span>
  );
}

// ── Stat ──────────────────────────────────────────────────────────────────────

interface StatProps {
  label: string;
  value: string;
  sub?:  string;
  color?: string;  // dynamic color only
}

export function Stat({ label, value, sub, color }: StatProps) {
  return (
    <div>
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={color ? { color } : undefined}>{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      {action}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────

interface BtnProps {
  children:  ReactNode;
  onClick?:  () => void;
  variant?:  'primary' | 'ghost' | 'danger';
  size?:     'sm' | 'md';
  type?:     'button' | 'submit';
  className?: string;
  disabled?: boolean;
}

export function Btn({ children, onClick, variant = 'ghost', size = 'md', type = 'button', className = '', disabled = false }: BtnProps) {
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

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider({ className = '' }: { className?: string }) {
  return <hr className={`divider ${className}`} />;
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="empty-state">
      <p className="empty-state__icon">{icon}</p>
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__sub">{subtitle}</p>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

interface Tab { id: string; label: string }

interface TabsProps {
  tabs:      Tab[];
  active:    string;
  onChange:  (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab-btn ${active === t.id ? 'tab-btn--active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  title:    string;
  onClose:  () => void;
  children: ReactNode;
  footer?:  ReactNode;
}

export function Modal({ title, onClose, children, footer }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Form group ────────────────────────────────────────────────────────────────

interface FormGroupProps {
  label:    string;
  children: ReactNode;
  span2?:   boolean;
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
