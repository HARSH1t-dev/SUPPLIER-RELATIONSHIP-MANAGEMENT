import { X } from 'lucide-react';
import { Button } from './Button.jsx';

export function Modal({ title, children, isOpen, onClose, size = 'md' }) {
  if (!isOpen) return null;

  const sizes = {
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    xxl: 'max-w-7xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full ${sizes[size] || 'max-w-xl'} max-h-[calc(100vh-2rem)] flex flex-col rounded-2xl bg-white/80 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl transition-all duration-200 animate-in zoom-in-95 duration-200`}>
        <div className="flex items-center justify-between border-b border-slate-100/50 dark:border-slate-800/60 px-5 py-4 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">{title}</h2>
          <Button variant="ghost" className="h-9 w-9 p-0 dark:text-slate-300 dark:hover:bg-slate-800" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5 text-slate-700 dark:text-slate-300 overflow-y-auto flex-1 custom-scrollbar">{children}</div>
      </div>
    </div>
  );
}
