import { ReactNode } from 'react';

export interface SectionHeaderProps {
  title:    string;
  action?:  ReactNode;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 md:mb-5">
      <h2 className="font-display text-[18px] md:text-[20px] font-normal text-text">{title}</h2>
      {action}
    </div>
  );
}
