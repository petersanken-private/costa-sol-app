export interface EmptyStateProps {
  icon:     string;
  title:    string;
  subtitle: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="text-center px-4 py-8 md:px-6 md:py-12">
      <p className="text-[32px] leading-[1.5] mb-2.5">{icon}</p>
      <p className="font-display text-[18px] leading-[1.5] text-text-dim">{title}</p>
      <p className="text-[13px] leading-[1.5] text-text-mute mt-1.5">{subtitle}</p>
    </div>
  );
}
