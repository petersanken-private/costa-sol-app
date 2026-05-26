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

  const triggerHover = 'border-border-hi bg-bg-hover text-text';
  const triggerBase  = 'inline-flex items-center gap-[7px] px-3.5 min-h-[44px] rounded-md border border-border bg-bg-card text-text-dim text-[13px] transition-all duration-150 shadow-sm hover:border-border-hi hover:bg-bg-hover hover:text-text';

  return (
    <div className="relative" ref={containerRef}>
      <button
        className={`${triggerBase} ${open ? triggerHover : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-[11px] opacity-60">↓</span>
        {label}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-[220px] bg-bg-card border border-border rounded-lg p-2 z-50 shadow-md shadow-black/10">
          <p className="text-[10px] tracking-[1.5px] uppercase text-text-mute px-2 pt-1 pb-2">Exportformat</p>
          {options.map((opt, i) => (
            <button
              key={i}
              className="flex items-center gap-2.5 w-full min-h-[44px] px-2.5 rounded-md border-none bg-transparent text-text-dim text-[13px] text-left transition-colors duration-150 hover:bg-bg-hover hover:text-text"
              onClick={() => { opt.onClick(); setOpen(false); }}
            >
              <span className="text-[15px] w-5 text-center">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
