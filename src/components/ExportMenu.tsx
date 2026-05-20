import { useState, useRef, useEffect } from 'react';

export interface ExportOption {
  label:   string;
  icon:    string;
  onClick: () => void;
}

interface ExportMenuProps {
  options: ExportOption[];
  label?:  string;
}

export function ExportMenu({ options, label = 'Exportera' }: ExportMenuProps) {
  const [open, setOpen]     = useState(false);
  const containerRef        = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="export-menu" ref={containerRef}>
      <button
        className={`export-trigger ${open ? 'export-trigger--open' : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <span className="export-trigger__icon">↓</span>
        {label}
      </button>

      {open && (
        <div className="export-dropdown">
          <p className="export-dropdown__heading">Exportformat</p>
          {options.map((opt, i) => (
            <button
              key={i}
              className="export-dropdown__item"
              onClick={() => { opt.onClick(); setOpen(false); }}
            >
              <span className="export-dropdown__item-icon">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
