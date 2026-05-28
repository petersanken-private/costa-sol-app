export interface EmptyStateProps {
  icon:     string;
  title:    string;
  subtitle: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="empty-state__icon">{icon}</p>
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__sub">{subtitle}</p>
    </div>
  );
}
