import { Icon, IconName } from './Icon';

export interface EmptyStateProps {
  icon:     IconName;
  title:    string;
  subtitle: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="text-center px-4 py-8 md:px-6 md:py-12">
      <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-bg-hover text-text-mute mb-3.5">
        <Icon name={icon} size={24} />
      </span>
      <p className="font-display text-[18px] leading-[1.5] text-text-dim">{title}</p>
      <p className="text-[13px] leading-[1.5] text-text-mute mt-1.5">{subtitle}</p>
    </div>
  );
}
