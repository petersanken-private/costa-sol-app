export interface Tab {
  id:    string;
  label: string;
}

export interface TabsProps {
  tabs:     Tab[];
  active:   string;
  onChange: (id: string) => void;
}

const TAB_BASE   = 'px-3.5 md:px-5 border-none border-b-2 border-b-transparent bg-transparent text-[13px] text-text-mute -mb-px whitespace-nowrap min-h-[44px] transition-colors duration-150 [-webkit-tap-highlight-color:transparent] hover:text-text-dim';
const TAB_ACTIVE = 'text-gold border-b-gold';

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-border mb-4 overflow-x-auto [-webkit-overflow-scrolling:touch]">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`${TAB_BASE} ${active === t.id ? TAB_ACTIVE : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
