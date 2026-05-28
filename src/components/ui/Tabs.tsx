export interface Tab {
  id:    string;
  label: string;
}

export interface TabsProps {
  tabs:     Tab[];
  active:   string;
  onChange: (id: string) => void;
}

// Vertikal padding (py-2.5) ger texten andrum trots att min-height redan
// säkerställer 44px-höjden — utan py-2.5 hamnar texten klistrad mot kanten.
// Mer generös horisontell padding så att texten andas mellan tabbarna.
// Originalet hade 14px/20px; vi bumpar till 20px/28px för tydligare separation.
const TAB_BASE = 'py-2.5 px-5 md:px-6 border-0 border-b-2 bg-transparent text-[13px] -mb-px whitespace-nowrap min-h-[44px] transition-colors duration-150 [-webkit-tap-highlight-color:transparent]';

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-border mb-4 overflow-x-auto [-webkit-overflow-scrolling:touch]">
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            className={`${TAB_BASE} ${
              isActive
                ? 'text-gold border-b-gold'
                : 'text-text-mute border-b-transparent hover:text-text-dim'
            }`}
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
