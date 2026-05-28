import { ReactNode } from 'react';

export interface ModalProps {
  title:    string;
  onClose:  () => void;
  children: ReactNode;
  footer?:  ReactNode;
}

export function Modal({ title, onClose, children, footer }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-[100] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border rounded-[20px_20px_0_0] md:rounded-[16px] px-4 py-6 md:px-8 md:py-8 w-full md:w-[540px] max-h-[90dvh] md:max-h-[85vh] overflow-y-auto shadow-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display text-[20px] md:text-[22px] font-normal text-text">{title}</h2>
          <button
            className="bg-transparent border-0 text-text-mute text-[22px] leading-[1] p-1 rounded-[6px] min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-bg-hover hover:text-text transition-colors duration-150"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
        {footer && (
          <div className="flex gap-2.5 justify-end mt-5 pt-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
